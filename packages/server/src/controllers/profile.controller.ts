import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// JOB SEEKER PROFILES
// ==========================================

export const getSeekerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const profile = await prisma.seekerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, emailVerified: true, role: true } },
        skills: true,
      }
    });

    if (!profile) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    res.status(200).json({ profile });
  } catch (error) {
    console.error('Error fetching seeker profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSeekerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { firstName, lastName, headline, bio } = req.body;

    const profile = await prisma.seekerProfile.findUnique({ where: { userId } });
    if (!profile) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    const updatedProfile = await prisma.seekerProfile.update({
      where: { userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        // Allow clearing strings by checking undefined rather than truthy
        ...(headline !== undefined && { headline }),
        ...(bio !== undefined && { bio }),
      },
    });

    res.status(200).json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error updating seeker profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// EMPLOYER PROFILES
// ==========================================

export const getEmployerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const profile = await prisma.employerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, emailVerified: true, role: true } },
      }
    });

    if (!profile) {
      res.status(404).json({ error: 'Employer profile not found' });
      return;
    }

    res.status(200).json({ profile });
  } catch (error) {
    console.error('Error fetching employer profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEmployerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { companyName, description, website } = req.body;

    const profile = await prisma.employerProfile.findUnique({ where: { userId } });
    if (!profile) {
      res.status(404).json({ error: 'Employer profile not found' });
      return;
    }

    const updatedProfile = await prisma.employerProfile.update({
      where: { userId },
      data: {
        ...(companyName && { companyName }),
        ...(description !== undefined && { description }),
        ...(website !== undefined && { website }),
      },
    });

    res.status(200).json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error updating employer profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
