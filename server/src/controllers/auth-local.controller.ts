import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// ---------------------------------------------------------
// POST /auth/local/register-candidate
// ---------------------------------------------------------
export const registerCandidateLocal = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, middleName, lastName, country, professionalTitle } = req.body;
    
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(400).json({ error: 'Email already registered.' });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          role: Role.JOB_SEEKER,
          emailVerified: true
        }
      });

      await tx.seekerProfile.create({
        data: {
          userId: u.id,
          firstName,
          middleName,
          lastName,
          country,
          headline: professionalTitle
        }
      });

      return u;
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, String(process.env.JWT_SECRET || 'dev_secret_keys_grc_2026'), { expiresIn: '1d', algorithm: 'HS256' });
    res.json({ message: 'Registration successful', token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during local registration' });
  }
};

// ---------------------------------------------------------
// POST /auth/local/register-employer
// ---------------------------------------------------------
export const registerEmployerLocal = async (req: Request, res: Response) => {
  try {
    const { email, password, companyName, firstName, middleName, lastName, industry, companySize } = req.body;
    
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(400).json({ error: 'Email already registered.' });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          role: Role.EMPLOYER,
          emailVerified: true
        }
      });

      await tx.employerProfile.create({
        data: {
          userId: u.id,
          companyName,
          representativeFirstName: firstName,
          representativeMiddleName: middleName,
          representativeLastName: lastName,
          industry,
          companySize
        }
      });

      return u;
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, String(process.env.JWT_SECRET || 'dev_secret_keys_grc_2026'), { expiresIn: '1d', algorithm: 'HS256' });
    res.json({ message: 'Registration successful', token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during local registration' });
  }
};

// ---------------------------------------------------------
// POST /auth/local/login
// ---------------------------------------------------------
export const loginLocal = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user || !user.passwordHash) return res.status(400).json({ error: 'Invalid credentials.' });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(400).json({ error: 'Invalid credentials.' });

    const payload = { userId: user.id, role: user.role };
    console.log("[AuthLocalController] Signing token for:", user.email, "payload:", payload);
    const token = jwt.sign(payload, String(process.env.JWT_SECRET || 'dev_secret_keys_grc_2026'), { expiresIn: '1d', algorithm: 'HS256' });
    res.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during local login' });
  }
};
