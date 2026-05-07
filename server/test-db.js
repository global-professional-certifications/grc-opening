const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.notification.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
  .then(n => console.log(JSON.stringify(n, null, 2)))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
