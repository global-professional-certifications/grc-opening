import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await prisma.seekerProfile.findFirst({
      include: {
        skills: true,
        user: true,
      },
    });

    if (!profile) {
      res.status(404).json({ error: 'No seeker profile found' });
      return;
    }

    res.status(200).json({
      firstName: profile.firstName,
      lastName: profile.lastName,
      headline: profile.headline,
      bio: profile.bio,
      resumeUrl: profile.resumeUrl,
      email: profile.user.email,
      skills: profile.skills,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error while fetching profile' });
  }
};
