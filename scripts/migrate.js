import 'dotenv/config';
import fs from 'fs';
import pool from '../lib/db.js';
import { initializeDatabase } from '../lib/schema.js';

// Try native env loader if available
try {
  if (typeof process.loadEnvFile === 'function') {
    if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');
    else if (fs.existsSync('.env')) process.loadEnvFile('.env');
  }
} catch {
  // Ignore missing local env file
}

async function migrate() {
  console.log('🔄 Starting Meal Distribution database migration & setup...');
  
  const hasDbConfig = !!(process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.DB_HOST || process.env.MYSQL_HOST);
  if (!hasDbConfig) {
    console.warn('⚠️ Warning: No DATABASE_URL or DB_HOST found in environment. Using default fallback configuration.');
  }

  try {
    const result = await initializeDatabase(pool);
    console.log('✅ Migration completed successfully!');
    result.steps.forEach(step => console.log(`   - ${step}`));
    console.log('\nDemo Logins Available:');
    console.log('   👑 Admin:    admin@meal.com    / admin123');
    console.log('   🍳 Kitchen:  kitchen@meal.com  / kitchen123');
    console.log('   🛵 Delivery: delivery@meal.com / delivery123');
    console.log('   🍱 Customer: customer@meal.com / customer123\n');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
  process.exit(0);
}

migrate();
