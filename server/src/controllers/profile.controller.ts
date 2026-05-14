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
        educations: { orderBy: { sortOrder: 'asc' } },
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
    const {
      firstName, lastName, headline, bio, location, linkedInUrl, avatarUrl, country, phone,
      openToShareCriticalInfo, ctcCurrency, currentCtc, expectedCtc, noticePeriod, buybackOption,
      skills, workExperiences, educations, certifications
    } = req.body;

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
          ...(phone !== undefined && { phone }),
          ...(openToShareCriticalInfo !== undefined && { openToShareCriticalInfo }),
          ...(ctcCurrency !== undefined && { ctcCurrency }),
          ...(currentCtc !== undefined && { currentCtc }),
          ...(expectedCtc !== undefined && { expectedCtc }),
          ...(noticePeriod !== undefined && { noticePeriod }),
          ...(buybackOption !== undefined && { buybackOption }),
        } as any,
      });

      if (workExperiences !== undefined) {
        await tx.workExperience.deleteMany({ where: { seekerId: profile.id } });
        if (workExperiences.length > 0) {
          interface WorkExperienceInput {
            title: string;
            company: string;
            location?: string;
            startDate: string;
            endDate?: string;
            current: boolean;
            description?: string;
          }
          await tx.workExperience.createMany({
            data: workExperiences.map((wx: WorkExperienceInput, idx: number) => ({
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

      if (educations !== undefined) {
        await tx.education.deleteMany({ where: { seekerId: profile.id } });
        if (educations.length > 0) {
          interface EducationInput {
            institution: string;
            degree?: string;
            field?: string;
            gpa?: string;
            startDate?: string;
            endDate?: string;
            description?: string;
          }
          await tx.education.createMany({
            data: educations.map((edu: EducationInput, idx: number) => ({
              seekerId: profile.id,
              institution: edu.institution,
              degree: edu.degree ?? null,
              field: edu.field ?? null,
              gpa: edu.gpa ?? null,
              startDate: edu.startDate ?? null,
              endDate: edu.endDate ?? null,
              description: edu.description ?? null,
              sortOrder: idx,
            })),
          });
        }
      }

      if (certifications !== undefined) {
        await tx.seekerCertification.deleteMany({ where: { seekerId: profile.id } });
        if (certifications.length > 0) {
          interface CertificationInput {
            name: string;
          }
          await tx.seekerCertification.createMany({
            data: certifications.map((cert: CertificationInput, idx: number) => ({
              seekerId: profile.id,
              name: cert.name,
              sortOrder: idx,
            })),
          });
        }
      }

      if (skills !== undefined) {
        await (tx.seekerProfile as any).update({
          where: { id: profile.id },
          data: {
            skills: {
              set: [],
              connectOrCreate: (skills as string[]).map((name: string) => ({
                where: { name },
                create: { name },
              })),
            },
          },
        });
      }
    });

    const updatedProfile = await prisma.seekerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, emailVerified: true, role: true } },
        skills: true,
        workExperiences: { orderBy: { sortOrder: 'asc' } },
        educations: { orderBy: { sortOrder: 'asc' } },
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
// ACCOUNT DELETION
// ==========================================

export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    // onDelete: Cascade on all relations means this removes everything tied to the user
    await prisma.user.delete({ where: { id: userId } });
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
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
    const {
      companyName, description, website, industry, companySize,
      tagline, foundedYear, logoUrl,
      phone, contactPhoneCode, contactName, contactEmail,
      address, city, state, country, countryCode,
      linkedInUrl, twitterUrl,
    } = req.body;

    const profile = await prisma.employerProfile.findUnique({ where: { userId } });
    if (!profile) {
      res.status(404).json({ error: 'Employer profile not found' });
      return;
    }

    const updatedProfile = await prisma.employerProfile.update({
      where: { userId },
      include: { user: { select: { email: true, emailVerified: true, role: true } } },
      data: {
        ...(companyName             !== undefined && { companyName }),
        ...(description             !== undefined && { description }),
        ...(website                 !== undefined && { website }),
        ...(industry                !== undefined && { industry }),
        ...(companySize             !== undefined && { companySize }),
        ...(tagline                 !== undefined && { tagline }),
        ...(foundedYear             !== undefined && { foundedYear }),
        ...(logoUrl                 !== undefined && { logoUrl }),
        ...(phone                   !== undefined && { phone }),
        ...(contactPhoneCode        !== undefined && { contactPhoneCode }),
        ...(contactName             !== undefined && { contactName }),
        ...(contactEmail            !== undefined && { contactEmail }),
        ...(address                 !== undefined && { address }),
        ...(city                    !== undefined && { city }),
        ...(state                   !== undefined && { state }),
        ...(country                 !== undefined && { country }),
        ...(countryCode             !== undefined && { countryCode }),
        ...(linkedInUrl             !== undefined && { linkedInUrl }),
        ...(twitterUrl              !== undefined && { twitterUrl }),
      } as any,
    });

    res.status(200).json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error updating employer profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
