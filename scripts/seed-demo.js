import fs from 'fs';
import dotenv from 'dotenv';

// 1. Ensure local environment variables are loaded
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

async function seedDemoData() {
  console.log('🌱 Starting Comprehensive Neon PostgreSQL Demo Data Seeding...\n');

  const hasDbConfig = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  if (!hasDbConfig) {
    console.error('❌ Error: DATABASE_URL not found in environment. Please set DATABASE_URL in .env or .env.local.');
    process.exit(1);
  }

  try {
    const result = await initializeDatabase(pool);
    console.log('✅ Database Schema & Demo Seeding Succeeded!');
    result.steps.forEach(step => console.log(`   - ${step}`));

    // Fetch and display row counts across all 8 tables
    console.log('\n📊 Database Table Verification:');
    const tables = [
      'Customer',
      'MenuItem',
      'Order',
      'PLACES_ITEM',
      'Order_History',
      'Payment',
      'Review'
    ];

    for (const table of tables) {
      const [rows] = await pool.query(`SELECT COUNT(*) as count FROM "${table}"`);
      const count = rows[0]?.count || rows[0]?.COUNT || 0;
      console.log(`   • "${table}": ${count} records`);
    }

    console.log('\n🔑 Demo Logins Ready for Instant Testing:');
    console.log('   ┌─────────────┬─────────────────────┬─────────────┐');
    console.log('   │ Role        │ Email               │ Password    │');
    console.log('   ├─────────────┼─────────────────────┼─────────────┤');
    console.log('   │ Admin       │ admin@meal.com      │ admin123    │');
    console.log('   │ Kitchen     │ kitchen@meal.com    │ kitchen123  │');
    console.log('   │ Delivery    │ delivery@meal.com   │ delivery123 │');
    console.log('   │ Customer    │ customer@meal.com   │ customer123 │');
    console.log('   └─────────────┴─────────────────────┴─────────────┘\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error?.message || String(error));
    if (error?.message?.includes('password authentication failed')) {
      console.error('\n💡 Note: Neon password authentication failed. Please verify that DATABASE_URL in .env or .env.local is current.');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
  process.exit(0);
}

seedDemoData();
