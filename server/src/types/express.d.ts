export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email_verified: boolean;
      };
    }
  }
}
