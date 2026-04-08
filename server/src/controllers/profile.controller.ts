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
        workExperiences: { orderBy: { sortOrder: 'asc' } },
        certifications: { orderBy: { sortOrder: 'asc' } },
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
    const { firstName, lastName, headline, bio, location, linkedInUrl, avatarUrl, country, workExperiences, certifications } = req.body;

    const profile = await prisma.seekerProfile.findUnique({ where: { userId } });
    if (!profile) {
      res.status(404).json({ error: 'Seeker profile not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.seekerProfile.update({
        where: { userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(headline !== undefined && { headline }),
          ...(bio !== undefined && { bio }),
          ...(location !== undefined && { location }),
          ...(linkedInUrl !== undefined && { linkedInUrl }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(country !== undefined && { country }),
        },
      });

      if (workExperiences !== undefined) {
        await tx.workExperience.deleteMany({ where: { seekerId: profile.id } });
        if (workExperiences.length > 0) {
          await tx.workExperience.createMany({
            data: workExperiences.map((wx: any, idx: number) => ({
              seekerId: profile.id,
              title: wx.title,
              company: wx.company,
              location: wx.location ?? null,
              startDate: wx.startDate,
              endDate: wx.endDate || null,
              current: wx.current,
              description: wx.description ?? null,
              sortOrder: idx,
            })),
          });
        }
      }

      if (certifications !== undefined) {
        await tx.seekerCertification.deleteMany({ where: { seekerId: profile.id } });
        if (certifications.length > 0) {
          await tx.seekerCertification.createMany({
            data: certifications.map((cert: any, idx: number) => ({
              seekerId: profile.id,
              name: cert.name,
              sortOrder: idx,
            })),
          });
        }
      }
    });

    const updatedProfile = await prisma.seekerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, emailVerified: true, role: true } },
        skills: true,
        workExperiences: { orderBy: { sortOrder: 'asc' } },
        certifications: { orderBy: { sortOrder: 'asc' } },
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
    const { companyName, description, website, representativeName, industry, companySize } = req.body;

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
        ...(representativeName !== undefined && { representativeName }),
        ...(industry !== undefined && { industry }),
        ...(companySize !== undefined && { companySize }),
      },
    });

    res.status(200).json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error updating employer profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
