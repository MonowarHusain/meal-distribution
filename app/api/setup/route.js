import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/schema';

export async function GET() {
  try {
    const result = await initializeDatabase(pool);
    return NextResponse.json({
      success: true,
      message: 'Neon PostgreSQL Database ready! All 3NF tables, indexes, views, and comprehensive demo seed data verified.',
      steps: result.steps,
      demoAccounts: [
        { role: 'Admin', email: 'admin@meal.com', password: 'admin123' },
        { role: 'Admin (Developer)', email: 'omi@bracu.edu.bd', password: 'admin123' },
        { role: 'Kitchen (Head Chef)', email: 'kitchen@meal.com', password: 'kitchen123' },
        { role: 'Kitchen (Sous Chef)', email: 'kitchen2@meal.com', password: 'kitchen123' },
        { role: 'Delivery (Rider Karim)', email: 'delivery@meal.com', password: 'delivery123' },
        { role: 'Delivery (Rider Sumon)', email: 'delivery2@meal.com', password: 'delivery123' },
        { role: 'Customer (Tanvir)', email: 'customer@meal.com', password: 'customer123' },
        { role: 'Customer (Anika)', email: 'anika@meal.com', password: 'customer123' },
        { role: 'Customer (Farhan)', email: 'farhan@meal.com', password: 'customer123' }
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
