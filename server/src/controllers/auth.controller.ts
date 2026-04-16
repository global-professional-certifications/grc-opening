import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { createClerkClient } from '@clerk/clerk-sdk-node';

const prisma = new PrismaClient();
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// ─────────────────────────────────────────────────────────
// POST /auth/sync   { clerkId, email, role, ...profileData }
// ─────────────────────────────────────────────────────────
export const syncClerkUser = async (req: any, res: Response): Promise<void> => {
  try {
    const clerkId = req.auth?.userId;
    const { 
      role, 
      firstName, middleName, lastName, country, professionalTitle,
      companyName, representativeFirstName, representativeMiddleName, representativeLastName, industry, companySize, website
    } = req.body;

    if (!clerkId || !role) {
      res.status(400).json({ error: 'Missing required fields (authenticated clerkId and role are required)' });
      return;
    }

    // Fetch the latest user data from Clerk to get the email
    const clerkUser = await clerkClient.users.getUser(clerkId);
    const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();

    if (!email) {
      res.status(400).json({ error: 'User email not found in Clerk' });
      return;
    }

    const requestedRole = role as Role;

    // Atomic upsert of User and Profile
    const user = await prisma.$transaction(async (tx) => {
      let u = await tx.user.findUnique({ where: { clerkId } });
      
      if (!u) {
        // Check if a user with this email already exists (legacy account)
        const legacyUser = await tx.user.findUnique({ where: { email } });
        
        if (legacyUser) {
          // Link Clerk account to existing legacy user
          u = await tx.user.update({
            where: { id: legacyUser.id },
            data: { clerkId, emailVerified: true }
          });
        } else {
          // Create brand new user
          u = await tx.user.create({
            data: { 
              email, 
              clerkId, 
              role: requestedRole, 
              emailVerified: true 
            },
          });
        }
      }

      if (requestedRole === Role.EMPLOYER) {
        const existingProfile = await tx.employerProfile.findUnique({ where: { userId: u.id } });
        if (!existingProfile) {
          await tx.employerProfile.create({
            data: { 
              userId: u.id, 
              companyName: companyName || "New Company", 
              representativeFirstName: representativeFirstName || "Representative", 
              representativeMiddleName, 
              representativeLastName: representativeLastName || "Name", 
              industry, 
              companySize, 
              website 
            },
          });
        }
      } else if (requestedRole === Role.JOB_SEEKER) {
        const existingProfile = await tx.seekerProfile.findUnique({ where: { userId: u.id } });
        if (!existingProfile) {
          await tx.seekerProfile.create({
            data: { 
              userId: u.id, 
              firstName: firstName || "First", 
              middleName: middleName || "", 
              lastName: lastName || "Last", 
              country: country || "", 
              headline: professionalTitle || "" 
            },
          });
        }
      }

      return u;
    });

    res.status(200).json({
      message: 'User synced successfully',
      user: { id: user.id, email: user.email, role: user.role, emailVerified: user.emailVerified }
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Internal server error during sync' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /auth/me
// ─────────────────────────────────────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.user is set by the authenticateClerk middleware
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    res.status(200).json({ 
      user: {
        id: req.user.id,
        clerkId: req.user.clerkId,
        role: req.user.role,
        email_verified: req.user.email_verified,
        needsSync: req.user.needsSync || false
      }
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
