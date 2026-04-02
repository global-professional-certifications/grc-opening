import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: requestedRole,
          emailVerified: false,
        },
      });

      if (requestedRole === Role.EMPLOYER) {
        await tx.employerProfile.create({
          data: {
            userId: user.id,
            companyName,
          },
        });
      } else {
        await tx.seekerProfile.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
          },
        });
      }
    });

    // 6. Return standard 201 response (No JWT issued until email is verified)
    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};
