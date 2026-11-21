import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/schema';

export async function GET() {
  try {
    const result = await initializeDatabase(pool);
    return NextResponse.json({
      success: true,
      message: 'Neon PostgreSQL Database ready! All tables, indexes, views, and demo seed data verified.',
      steps: result.steps,
      demoAccounts: [
        { role: 'Admin', email: 'admin@meal.com', password: 'admin123' },
        { role: 'Admin (Developer)', email: 'omi@bracu.edu.bd', password: 'admin123' },
        { role: 'Kitchen', email: 'kitchen@meal.com', password: 'kitchen123' },
        { role: 'Delivery', email: 'delivery@meal.com', password: 'delivery123' },
        { role: 'Customer', email: 'customer@meal.com', password: 'customer123' }
      ]
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to initialize Neon PostgreSQL database',
        error: 'Failed to initialize Neon PostgreSQL database',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
