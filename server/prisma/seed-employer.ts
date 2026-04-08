import { PrismaClient, JobStatus, WorkMode, ApplicationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const APPLICANT_NAMES = [
  "Marcus Thorne", "Sarah Jenkins", "David Chen", "Amara Rivera",
  "James Wilson", "Elena Rodriguez", "Michael Chang", "Sophie Dubois",
  "Robert Taylor", "Emma Schmidt"
];

const JOB_TITLES = [
  "Senior GRC Lead", "Compliance Auditor", "Data Privacy Officer",
  "Risk Management Specialist", "Information Security Analyst",
  "Corporate Governance Manager"
];

const CERTIFICATIONS = [
  "CISA", "CRISC", "CISM", "CISSP", "ISO 27001", "GDPR", "CIA"
];

async function main() {
  console.log('🌱 Starting database seed for Employer Dashboard Dummy Data...');

  // 1. Ensure the user's employer profile exists
  const USER_EMAIL = 'lalitmohan.singh@riskman.in';
  
  let employerUser = await prisma.user.findUnique({
    where: { email: USER_EMAIL }
  });

  if (!employerUser) {
     console.error(`User ${USER_EMAIL} not found! Please register the user first.`);
     process.exit(1);
  }

  // Check if they have a profile, if not, create it
  let employerProfile = await prisma.employerProfile.findUnique({
    where: { userId: employerUser.id }
  });

  if (!employerProfile) {
    employerProfile = await prisma.employerProfile.create({
      data: {
        userId: employerUser.id,
        companyName: 'Lalit Corp',
        representativeFirstName: 'Lalit',
        representativeLastName: 'Singh',
        industry: 'Technology',
        companySize: '50-100',
        description: 'Pioneering GRC solutions worldwide.'
      }
    });
    console.log(`✅ Created employer profile for ${USER_EMAIL}`);
  } else {
    console.log(`✅ Found existing employer profile for ${USER_EMAIL}`);
  }

  // 2. Create 10 dummy Job Seekers
  const seekers = [];
  for (let i = 0; i < 10; i++) {
    const email = `seeker${i}@example.com`;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const passwordHash = await bcrypt.hash('password123', 10);
      const names = APPLICANT_NAMES[i].split(" ");
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          emailVerified: true,
          role: 'JOB_SEEKER',
          seekerProfile: {
            create: {
              firstName: names[0],
              lastName: names[1],
              headline: 'GRC Professional',
              resumeUrl: 'https://example.com/resume.pdf',
              certifications: {
                create: [
                  { name: CERTIFICATIONS[i % CERTIFICATIONS.length], sortOrder: 1 },
                  { name: CERTIFICATIONS[(i + 1) % CERTIFICATIONS.length], sortOrder: 2 }
                ]
              }
            }
          }
        }
      });
    }

    const profile = await prisma.seekerProfile.findUnique({ where: { userId: user.id } });
    if (profile) seekers.push(profile);
  }
  console.log('✅ Prepared 10 job seekers.');

  // 3. Create Jobs for the Employer (5 active, 2 closed)
  const currentJobs = await prisma.job.findMany({ where: { employerId: employerProfile.id } });
  
  if (currentJobs.length === 0) {
    for (let i = 0; i < 7; i++) {
      const isClosed = i >= 5;
      await prisma.job.create({
        data: {
          employerId: employerProfile.id,
          title: JOB_TITLES[i % JOB_TITLES.length] + (i > 3 ? ` (${i+1})` : ""),
          description: "We are looking for an experienced GRC professional to join our fast-paced team and help drive compliance and security.",
          location: i % 2 === 0 ? "New York, NY" : "London, UK",
          workMode: i % 3 === 0 ? WorkMode.REMOTE : (i % 2 === 0 ? WorkMode.HYBRID : WorkMode.ON_SITE),
          status: isClosed ? JobStatus.CLOSED : JobStatus.PUBLISHED,
          salaryMin: 90000 + (10000 * i),
          salaryMax: 120000 + (10000 * i),
          certifications: {
            create: [
              { name: CERTIFICATIONS[i % CERTIFICATIONS.length] }
            ]
          }
        }
      });
    }
    console.log('✅ Created 7 job listings (5 active, 2 closed).');
  } else {
    console.log('💡 Jobs already exist, skipping job creation.');
  }

  // 4. Create Applications (Simulating 15-20 dummy applications)
  const jobs = await prisma.job.findMany({ where: { employerId: employerProfile.id } });
  
  let applicationCount = 0;
  for (const job of jobs) {
    // Each job gets between 1 and 4 applicants
    const applicantsCount = Math.floor(Math.random() * 4) + 1;
    
    // Pick random unique seekers
    const shuffledSeekers = [...seekers].sort(() => 0.5 - Math.random());
    const selectedSeekers = shuffledSeekers.slice(0, applicantsCount);

    for (const seeker of selectedSeekers) {
      // Check if application already exists
      const existing = await prisma.application.findFirst({
        where: { jobId: job.id, seekerId: seeker.id }
      });

      if (!existing) {
        // Randomize status for shortlisted stats
        const rand = Math.random();
        let status: ApplicationStatus = ApplicationStatus.PENDING;
        if (rand > 0.8) status = ApplicationStatus.INTERVIEWING;
        else if (rand > 0.6) status = ApplicationStatus.REVIEWING;

        // Spread out the dates over the last few days
        const appliedAt = new Date();
        appliedAt.setHours(appliedAt.getHours() - (Math.random() * 72));

        await prisma.application.create({
          data: {
            jobId: job.id,
            seekerId: seeker.id,
            status,
            appliedAt
          }
        });
        applicationCount++;
      }
    }
  }

  console.log(`✅ Created ${applicationCount} new dummy applications.`);
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
