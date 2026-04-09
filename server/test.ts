import { PrismaClient, Role } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { 
          email: "testemployer@acme.com", 
          passwordHash: "hash123", 
          role: Role.EMPLOYER, 
          emailVerified: true 
        },
      });

      await tx.employerProfile.create({
        data: { 
          userId: created.id, 
          companyName: "Acme", 
          representativeFirstName: "John", 
          representativeMiddleName: "D", 
          representativeLastName: "Doe", 
          industry: "tech", 
          companySize: "10", 
          website: undefined
        },
      });

      return created;
    });
    console.log("Success:", user);
  } catch (error) {
    console.error("Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}
test();
