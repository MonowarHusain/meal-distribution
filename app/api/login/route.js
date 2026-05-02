import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // 1. Check database (Sample logic - adapt to your specific table structure)
    const [rows] = await pool.query(
      'SELECT * FROM Customer WHERE Email = ? AND Password = ?',
      [email, password]
    );

    if (rows.length > 0) {
      const user = rows[0];
      
      // Read the Role directly from the database column we added earlier
      // If for some reason it's missing, fallback to 'customer'
      const role = (user.Role || 'customer').toLowerCase();

      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        role: role,
        id: user.CustomerID
      });

      // Set cookie named 'role' so proxy.js can read it correctly
      response.cookies.set('role', role, { 
        httpOnly: true, 
        path: '/',
        maxAge: 60 * 60 * 24 // 1 day
      });

      return response;
    }

    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}