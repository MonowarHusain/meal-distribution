import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT 1 as connected, CURRENT_TIMESTAMP as server_time');
    return NextResponse.json({
      success: true,
      message: 'Neon PostgreSQL database connection verified successfully',
      data: rows[0] || null
    });
  } catch (error) {
    console.error('Test DB Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error.message
    }, { status: 500 });
  }
}
