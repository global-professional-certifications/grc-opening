import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendOtpEmail, sendPasswordResetEmail } from '../services/email.service';
import { shouldBypassEmailVerificationForEmail } from '../config/dev-auth';

const prisma = new PrismaClient();

const OTP_TTL_MS = 10 * 60 * 1000;         // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 44 * 1000;  // 44 seconds (issue #42)
const RESET_TTL_MS = 60 * 60 * 1000;       // 1 hour

// ─── Helpers ─────────────────────────────────────────────

const isEmailDomainBlocked = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;

  const rawBlockedDomains = process.env.AUTH_EMP_DOMAIN || '';
  const blocklist = rawBlockedDomains
    .split(',')
    .map(d => d.trim().toLowerCase())
    .filter(Boolean);

  return blocklist.includes(domain);
};

function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

async function issueAndSendOtp(userId: string, email: string): Promise<{ cooldown: boolean }> {
  // Check cooldown via lastVerificationSentAt on the user row (issue #42)
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastVerificationSentAt: true },
  });

  if (userData?.lastVerificationSentAt) {
    const elapsed = Date.now() - userData.lastVerificationSentAt.getTime();
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      return { cooldown: true };
    }
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  // Delete old OTPs, create new one, and update cooldown timestamp atomically
  await prisma.$transaction([
    prisma.emailVerification.deleteMany({ where: { userId } }),
    prisma.emailVerification.create({
      data: { userId, otpHash, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { lastVerificationSentAt: new Date() },
    }),
  ]);

  await sendOtpEmail(email, otp);
  return { cooldown: false };
}

async function markUserEmailVerified(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    }),
    prisma.emailVerification.deleteMany({
      where: { userId },
    }),
  ]);
}

// ─────────────────────────────────────────────────────────
// POST /auth/register
// ─────────────────────────────────────────────────────────
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email: rawEmail, password, confirmPassword, role,
      firstName, middleName, lastName, country, professionalTitle,
      companyName, representativeFirstName, representativeMiddleName, representativeLastName, industry, companySize, website
    } = req.body;
    const email = (rawEmail as string)?.trim().toLowerCase();
    const bypassEmailVerification = shouldBypassEmailVerificationForEmail(email);

    if (!email || !password || !confirmPassword || !role) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long' });
      return;
    }

    const requestedRole = role as Role;
    if (requestedRole !== Role.JOB_SEEKER && requestedRole !== Role.EMPLOYER) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    // Role-specific validation
    if (requestedRole === Role.EMPLOYER) {
      if (!companyName || !representativeFirstName || !representativeLastName) {
        res.status(400).json({ error: 'companyName, first name, and last name are required for employers' });
        return;
      }
      if (isEmailDomainBlocked(email)) {
        res.status(400).json({ error: 'Personal email domains are not allowed for employers. Please use a work email.' });
        return;
      }
    } else if (requestedRole === Role.JOB_SEEKER) {
      if (!firstName || !lastName) {
        res.status(400).json({ error: 'First name and last name are required for job seekers' });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user and profile in a transaction.
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { email, passwordHash, role: requestedRole, emailVerified: bypassEmailVerification },
      });

      if (requestedRole === Role.EMPLOYER) {
        await tx.employerProfile.create({
          data: { 
            userId: created.id, 
            companyName, 
            representativeFirstName, 
            representativeMiddleName, 
            representativeLastName, 
            industry, 
            companySize, 
            website 
          },
        });
      } else {
        await tx.seekerProfile.create({
          data: { userId: created.id, firstName, middleName, lastName, country, headline: professionalTitle },
        });
      }

      return created;
    });

    if (!bypassEmailVerification) {
      try {
        await issueAndSendOtp(user.id, email);
      } catch (emailError) {
        console.error('OTP email failed (user still created):', emailError);
      }
    }

    res.status(201).json(
      bypassEmailVerification
        ? {
            message: 'Registration successful. Email verification was skipped for this development account.',
            requiresEmailVerification: false,
            emailVerified: true,
          }
        : {
            message: 'Registration successful! Please check your email for a verification code.',
            requiresEmailVerification: true,
            emailVerified: false,
          }
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /auth/resend-verification   { email }
// ─────────────────────────────────────────────────────────
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: rawEmail } = req.body;
    const email = (rawEmail as string)?.trim().toLowerCase();

    if (!email) {
      res.status(400).json({ error: 'email is required' });
      return;
    }

    // Don't reveal whether the email exists or is already verified
    const genericMsg = { message: 'If that email is registered and unverified, a code has been sent.' };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) {
      res.status(200).json(genericMsg);
      return;
    }

    const { cooldown } = await issueAndSendOtp(user.id, email);

    if (cooldown) {
      res.status(429).json({ error: 'Please wait before requesting another code.' });
      return;
    }

    res.status(200).json(genericMsg);
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /auth/verify-email   { email, otp }
// ─────────────────────────────────────────────────────────
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: rawEmail, otp } = req.body;
    const email = (rawEmail as string)?.trim().toLowerCase();

    if (!email || !otp) {
      res.status(400).json({ error: 'email and otp are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ error: 'Invalid or expired code.' });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({ error: 'Email is already verified.' });
      return;
    }

    const record = await prisma.emailVerification.findFirst({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      res.status(400).json({ error: 'Invalid or expired code.' });
      return;
    }

    const valid = await bcrypt.compare(otp, record.otpHash);
    if (!valid) {
      res.status(400).json({ error: 'Invalid or expired code.' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET as string;
    const token = jwt.sign(
      { id: user.id, role: user.role, email_verified: true },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Mark email as verified and clean up OTP records
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
      prisma.emailVerification.deleteMany({ where: { userId: user.id } }),
    ]);

    res.status(200).json({
      message: 'Email verified successfully.',
      token,
      user: { id: user.id, email: user.email, role: user.role, emailVerified: true },
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────────────────
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: rawEmail, password, role: intendedRole } = req.body;
    const email = (rawEmail as string)?.trim().toLowerCase();

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Role enforcement: ensure user is logging in through the correct portal
    if (intendedRole && user.role !== intendedRole) {
      const friendlyRole = user.role === Role.EMPLOYER ? 'an Employer' : 'a Job Seeker';
      res.status(401).json({ 
        error: `This account is registered as ${friendlyRole}. Please switch to the correct portal to sign in.` 
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    let effectiveEmailVerified = user.emailVerified;

    if (!effectiveEmailVerified && shouldBypassEmailVerificationForEmail(email)) {
      await markUserEmailVerified(user.id);
      effectiveEmailVerified = true;
    }

    if (!effectiveEmailVerified) {
      res.status(403).json({ error: 'Please verify your email before logging in.' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET as string;
    const token = jwt.sign(
      { id: user.id, role: user.role, email_verified: effectiveEmailVerified },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role: user.role, emailVerified: effectiveEmailVerified },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /auth/forgot-password   { email }
// ─────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: rawEmail } = req.body;
    const email = (rawEmail as string)?.trim().toLowerCase();

    if (!email) {
      res.status(400).json({ error: 'email is required' });
      return;
    }

    // Always respond the same way — do not reveal whether the email exists
    const successMsg = { message: 'If that email is registered, a password reset link has been sent.' };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(200).json(successMsg);
      return;
    }

    // Invalidate any previous unused tokens for this user
    await prisma.passwordReset.deleteMany({ where: { userId: user.id, usedAt: null } });

    // Generate a cryptographically random URL-safe token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);

    await prisma.passwordReset.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
    });

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    try {
      await sendPasswordResetEmail(email, resetLink);
    } catch (emailError) {
      console.error('Password reset email failed:', emailError);
    }

    res.status(200).json(successMsg);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /auth/reset-password   { email, token, password, confirmPassword }
// ─────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: rawEmail, token, password, confirmPassword } = req.body;
    const email = (rawEmail as string)?.trim().toLowerCase();

    if (!email || !token || !password || !confirmPassword) {
      res.status(400).json({ error: 'email, token, password and confirmPassword are required' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long' });
      return;
    }

    const invalidMsg = { error: 'This reset link is invalid or has expired.' };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json(invalidMsg);
      return;
    }

    // Find an unused, non-expired token for this user
    const record = await prisma.passwordReset.findFirst({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      res.status(400).json(invalidMsg);
      return;
    }

    const valid = await bcrypt.compare(token, record.tokenHash);
    if (!valid) {
      res.status(400).json(invalidMsg);
      return;
    }

    const newPasswordHash = await bcrypt.hash(password, 12);

    // Burn the token and update password atomically
    await prisma.$transaction([
      prisma.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: user.id }, data: { passwordHash: newPasswordHash } }),
    ]);

    res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
