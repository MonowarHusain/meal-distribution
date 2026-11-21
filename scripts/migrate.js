import fs from 'fs';
import dotenv from 'dotenv';

// 1. Ensure local environment variables are loaded first
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
}

try {
  if (typeof process.loadEnvFile === 'function') {
    if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');
    else if (fs.existsSync('.env')) process.loadEnvFile('.env');
  }
} catch {
  // Ignore missing local env file
}

import pool from '../lib/db.js';
import { initializeDatabase } from '../lib/schema.js';

async function migrate() {
  console.log('🔄 Starting Meal Distribution Neon PostgreSQL migration & setup...');

  const hasDbConfig = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  if (!hasDbConfig) {
    console.error('❌ Error: DATABASE_URL not found in environment. Please set DATABASE_URL in .env or .env.local.');
    process.exit(1);
  }

  try {
    const result = await initializeDatabase(pool);
    console.log('✅ PostgreSQL Migration completed successfully!');
    result.steps.forEach(step => console.log(`   - ${step}`));
    console.log('\nDemo Logins Available (bcrypt hashed & verified):');
    console.log('   👑 Admin:    admin@meal.com    / admin123');
    console.log('   🍳 Kitchen:  kitchen@meal.com  / kitchen123');
    console.log('   🛵 Delivery: delivery@meal.com / delivery123');
    console.log('   🍱 Customer: customer@meal.com / customer123\n');
  } catch (error) {
    console.error('❌ Migration failed:', error?.message || error?.code || String(error));
    process.exit(1);
  } finally {
    await pool.end();
  }
  process.exit(0);
}

migrate();
