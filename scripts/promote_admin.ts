import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Please provide an email address to promote.');
    console.error('Usage: npx ts-node scripts/promote_admin.ts <email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User with email ${email} not found in the local database.`);
    console.error('Make sure you have registered and completed onboarding first!');
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { role: 'SUPER_ADMIN' },
  });

  console.log(`Successfully promoted ${email} to SUPER_ADMIN!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
