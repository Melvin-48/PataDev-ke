import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7: connection URLs no longer live in schema.prisma. The CLI
// (migrate / studio / db *) connects through this datasource block.
//
// Use DIRECT_URL (port 5432) here, not the pooled DATABASE_URL: migrations
// need a direct connection - Supabase's PgBouncer pooler can't run DDL or
// shadow-database operations. This mirrors what `directUrl` did in v6.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Read via process.env instead of env() so `prisma generate` still works
    // in environments (e.g. CI type-checks) where no DATABASE_URL is set.
    url: process.env.DIRECT_URL ?? '',
  },
});
