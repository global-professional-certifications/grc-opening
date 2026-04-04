import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sendOtpEmail } from '../services/email.service';

const prisma = new PrismaClient();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

// Helper to check if domain is blocked
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

/** Generate a cryptographically random 6-digit OTP */
function generateOtp(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return String(digits);
}

/**
 * Create (or replace) an OTP record for a user and send the email.
 * Returns early if a non-expired OTP was sent within the cooldown window.
 */
async function issueAndSendOtp(userId: string, email: string): Promise<{ cooldown: boolean }> {
  // Check for a recent OTP still within the resend cooldown
  const recent = await prisma.emailVerification.findFirst({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS) },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recent) {
    return { cooldown: true };
  }

  // Delete all previous OTPs for this user
  await prisma.emailVerification.deleteMany({ where: { userId } });

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  await prisma.emailVerification.create({
    data: {
      userId,
      otpHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  await sendOtpEmail(email, otp);
  return { cooldown: false };
}

// ─────────────────────────────────────────────────────────
// POST /auth/register
// ─────────────────────────────────────────────────────────
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, confirmPassword, role, firstName, lastName, companyName } = req.body;

    // 1. Basic Validations
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

    // 2. Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    // 3. Role-specific validation
    if (requestedRole === Role.EMPLOYER) {
      if (!companyName) {
        res.status(400).json({ error: 'companyName is required for employers' });
        return;
      }
      if (isEmailDomainBlocked(email)) {
        res.status(400).json({ error: 'Personal email domains are not allowed for employers. Please use a work email.' });
        return;
      }
    } else if (requestedRole === Role.JOB_SEEKER) {
      if (!firstName || !lastName) {
        res.status(400).json({ error: 'firstName and lastName are required for job seekers' });
        return;
      }
    }

    // 4. Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Create user and profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: requestedRole,
          emailVerified: false,
        },
      });

      if (requestedRole === Role.EMPLOYER) {
        await tx.employerProfile.create({
          data: { userId: created.id, companyName },
        });
      } else {
        await tx.seekerProfile.create({
          data: { userId: created.id, firstName, lastName },
        });
      }

      return created;
    });

    // 6. Generate OTP and send verification email
    await issueAndSendOtp(user.id, email);

    res.status(201).json({
      message: 'Registration successful! Please check your email for a verification code.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /auth/send-otp   { email }
// ─────────────────────────────────────────────────────────
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'email is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether the email exists
      res.status(200).json({ message: 'If that email is registered, a code has been sent.' });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({ error: 'Email is already verified.' });
      return;
    }

    const { cooldown } = await issueAndSendOtp(user.id, email);

    if (cooldown) {
      res.status(429).json({ error: 'Please wait before requesting another code.' });
      return;
    }

    res.status(200).json({ message: 'Verification code sent.' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /auth/verify-email   { email, otp }
// ─────────────────────────────────────────────────────────
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
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

    // Find the latest non-expired OTP for this user
    const record = await prisma.emailVerification.findFirst({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
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

    // Mark email as verified and clean up OTP records
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
      prisma.emailVerification.deleteMany({ where: { userId: user.id } }),
    ]);

    res.status(200).json({ message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
