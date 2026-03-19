import { Pool } from 'pg';
import config from './config';
import fs from 'fs';
import path from 'path';

export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
});

export async function initializeDatabase(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (file.endsWith('.sql')) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      console.log(`Running migration: ${file}`);
      try {
        await pool.query(sql);
      } catch (error: any) {
        // Skip if table already exists (migration already ran)
        if (!error.message.includes('already exists')) {
          throw error;
        }
        console.log(`  Skipped (already exists): ${file}`);
      }
    }
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
