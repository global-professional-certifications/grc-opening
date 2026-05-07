import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@grcopenings.com';
const ADMIN_PASSWORD = 'Admin@GRC2026!';

async function main() {
  console.log('🔐 Seeding admin user...');

  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    if (existing.role !== 'ADMIN') {
      await prisma.user.update({ where: { email: ADMIN_EMAIL }, data: { role: 'ADMIN' } });
      console.log(`✅ Updated ${ADMIN_EMAIL} role to ADMIN`);
    } else {
      console.log(`ℹ️  Admin user already exists: ${ADMIN_EMAIL}`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash,
      emailVerified: true,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created!');
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('   ⚠️  Change the password after first login.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
