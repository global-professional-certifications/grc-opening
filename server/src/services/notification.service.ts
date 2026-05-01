import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

const getTTL = () => new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // +10 days

/**
 * Purges all expired notifications from the database.
 * Designed to be called lazily, e.g., on every GET request.
 */
export const purgeExpiredNotifications = async (): Promise<void> => {
  try {
    await prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
  } catch (error) {
    console.error('[NotificationService] Error purging expired notifications:', error);
  }
};

export const notifyAccountStatusChange = async (
  userId: string,
  newStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED',
  adminReason?: string,
): Promise<void> => {
  try {
    let type: NotificationType;
    let title: string;
    let messageBase: string;

    if (newStatus === 'ACTIVE') {
      type = NotificationType.ACCOUNT_REINSTATED;
      title = 'Account Reactivated';
      messageBase = 'Your account has been reactivated. You can now log in and use the platform normally.';
    } else if (newStatus === 'SUSPENDED') {
      type = NotificationType.ACCOUNT_SUSPENDED;
      title = 'Account Temporarily Suspended';
      messageBase = 'Your account has been temporarily suspended by an administrator. You will not be able to log in until it is reinstated.';
    } else {
      type = NotificationType.ACCOUNT_BANNED;
      title = 'Account Permanently Banned';
      messageBase = 'Your account has been permanently banned for policy violations. Contact support if you believe this is an error.';
    }

    const trimmedReason = typeof adminReason === 'string' ? adminReason.trim() : '';
    const message = trimmedReason ? `${messageBase} Reason: ${trimmedReason}` : messageBase;

    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: trimmedReason ? { newStatus, adminReason: trimmedReason } : { newStatus },
        expiresAt: getTTL()
      }
    });
  } catch (error) {
    console.error('[NotificationService] Error creating account status notification:', error);
  }
};

export const notifyCompanyVerificationChange = async (
  userId: string,
  isVerified: boolean,
  adminReason?: string,
): Promise<void> => {
  try {
    const type = isVerified ? NotificationType.COMPANY_VERIFIED : NotificationType.COMPANY_VERIFICATION_REVOKED;
    const title = isVerified ? 'Company Profile Verified \u2713' : 'Verification Revoked';
    const messageBase = isVerified 
      ? 'Congratulations! Your company profile has been officially verified by GRC Openings.'
      : 'Your company\'s verified status has been revoked. Please contact support for more information.';
    const trimmedReason = typeof adminReason === 'string' ? adminReason.trim() : '';
    const message = trimmedReason ? `${messageBase} Reason: ${trimmedReason}` : messageBase;

    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: trimmedReason
          ? { isVerified, adminReason: trimmedReason }
          : { isVerified },
        expiresAt: getTTL()
      }
    });
  } catch (error) {
    console.error('[NotificationService] Error creating company verification notification:', error);
  }
};

export const notifyJobForceClosed = async (
  employerUserId: string,
  jobId: string,
  jobTitle: string,
  adminReason: string,
): Promise<void> => {
  try {
    await prisma.notification.create({
      data: {
        userId: employerUserId,
        type: NotificationType.JOB_FORCE_CLOSED,
        title: 'Job Posting Closed by Admin',
        message: `Your job posting "${jobTitle}" has been closed by an administrator. Reason: ${adminReason}`,
        metadata: { jobId, jobTitle, adminReason },
        expiresAt: getTTL()
      }
    });
  } catch (error) {
    console.error('[NotificationService] Error creating job force closed notification:', error);
  }
};

export const notifyJobClosedToApplicants = async (jobId: string, jobTitle: string): Promise<void> => {
  try {
    // Find all users who applied to or saved this job
    const [applications, savedJobs] = await Promise.all([
      prisma.application.findMany({
        where: { jobId },
        select: { seeker: { select: { userId: true } } }
      }),
      prisma.savedJob.findMany({
        where: { jobId },
        select: { seeker: { select: { userId: true } } }
      })
    ]);

    const userIds = new Set([
      ...applications.map(a => a.seeker.userId),
      ...savedJobs.map(s => s.seeker.userId)
    ]);

    if (userIds.size === 0) return;

    // Bulk create
    const notifications = Array.from(userIds).map(userId => ({
      userId,
      type: NotificationType.JOB_CLOSED,
      title: 'Job Posting No Longer Available',
      message: `A job you were tracking \u2014 "${jobTitle}" \u2014 has been closed.`,
      metadata: { jobId, jobTitle },
      expiresAt: getTTL()
    }));

    await prisma.notification.createMany({
      data: notifications,
      skipDuplicates: true
    });
  } catch (error) {
    console.error('[NotificationService] Error notifying applicants about closed job:', error);
  }
};

export const notifyApplicationStatusChange = async (
  seekerUserId: string, 
  applicationId: string, 
  jobId: string,
  jobTitle: string, 
  companyName: string, 
  newStatus: string
): Promise<void> => {
  try {
    let type: NotificationType;
    let title: string;
    let message: string;

    switch (newStatus) {
      case 'REVIEWING':
        type = NotificationType.APPLICATION_REVIEWING;
        title = 'Application Under Review';
        message = `${companyName} is reviewing your application for ${jobTitle}.`;
        break;
      case 'INTERVIEWING':
        type = NotificationType.APPLICATION_INTERVIEWING;
        title = 'Interview Stage Reached \uD83C\uDF89';
        message = `Congratulations! ${companyName} has moved your application to the interview stage for ${jobTitle}.`;
        break;
      case 'HIRED':
        type = NotificationType.APPLICATION_HIRED;
        title = 'You\'ve Been Hired! \uD83C\uDF8A';
        message = `${companyName} has selected you for ${jobTitle}. Congratulations on your new role!`;
        break;
      case 'REJECTED':
        type = NotificationType.APPLICATION_REJECTED;
        title = 'Application Update';
        message = `${companyName} has reviewed your application for ${jobTitle} and decided not to proceed at this time.`;
        break;
      default:
        // Ignore other statuses like PENDING or WITHDRAWN
        return;
    }

    await prisma.notification.create({
      data: {
        userId: seekerUserId,
        type,
        title,
        message,
        metadata: { applicationId, jobId, jobTitle, companyName },
        expiresAt: getTTL()
      }
    });
  } catch (error) {
    console.error('[NotificationService] Error notifying application status change:', error);
  }
};

export const notifyNewApplication = async (
  employerUserId: string, 
  seekerName: string, 
  jobId: string, 
  jobTitle: string
): Promise<void> => {
  try {
    await prisma.notification.create({
      data: {
        userId: employerUserId,
        type: NotificationType.NEW_APPLICATION,
        title: 'New Application Received',
        message: `${seekerName} has applied for your "${jobTitle}" posting.`,
        metadata: { jobId, jobTitle, seekerName },
        expiresAt: getTTL()
      }
    });
  } catch (error) {
    console.error('[NotificationService] Error notifying employer about new application:', error);
  }
};
