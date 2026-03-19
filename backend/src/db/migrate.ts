import { initializeDatabase, closeDatabase } from '../db';

async function run(): Promise<void> {
  try {
    await initializeDatabase();
    console.log('Migrations completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

run();
