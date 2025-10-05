import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  // We allow boot without DB, but the health route will reflect status
  console.warn('DATABASE_URL is not set. DB operations will fail until configured.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;
export * from './schema';


