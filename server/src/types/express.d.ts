export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: string;          // Our internal DB UUID (optional if needsSync=true)
        clerkId?: string;     // Clerk's external ID
        clerkEmail?: string;  // Clerk's email
        role: string;
        email_verified: boolean;
        needsSync?: boolean;  // Flag if user exists in Clerk but not yet in our DB
      };
    }
  }
}
