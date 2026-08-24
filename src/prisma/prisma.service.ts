import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
<<<<<<< HEAD

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Prisma 7 is Rust-free: every connection goes through a driver adapter.
    // Runtime traffic uses the pooled DATABASE_URL (Supabase PgBouncer);
    // migrations use DIRECT_URL via prisma.config.ts instead.
    //
    // ssl.rejectUnauthorized=false keeps v6 behaviour with Supabase's certs -
    // node-pg validates strictly by default and fails with P1010 otherwise.
    super({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }),
    });
=======
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
>>>>>>> 5f0a84f3d104d70afc5217d280a67f7b83c2e86a
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
