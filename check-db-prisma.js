const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function run() {
  console.log('Connecting to Prisma via Adapter...');
  const pool = new Pool({ connectionString: "postgresql://postgres.fktbarvbbnlftzkpaywg:cSPDlUNBBzBVvjKF@aws-0-eu-central-1.pooler.supabase.com:5432/postgres" });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  await prisma.$connect();
  console.log('Connected!');

  // 1. Get recent users
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      clientProfile: true,
      developerProfile: true,
    }
  });
  
  console.log('Recent Users and Profiles:');
  console.log(JSON.stringify(users, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

run().catch(console.error);
