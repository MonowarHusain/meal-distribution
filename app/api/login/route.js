import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON request payload' }, { status: 400 });
    }

    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    // Authenticate user against Customer table
    const [rows] = await pool.query(
      'SELECT CustomerID, Name, Email, Phone, Role, Street, Road, House FROM Customer WHERE LOWER(Email) = ? AND Password = ?',
      [trimmedEmail, String(password)]
    );

    if (rows && rows.length > 0) {
      const user = rows[0];
      const role = (user.Role || 'Customer').toLowerCase();

      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        role: role,
        id: user.CustomerID,
        user: {
          id: user.CustomerID,
          name: user.Name,
          email: user.Email,
          phone: user.Phone,
          role: user.Role,
          street: user.Street,
          road: user.Road,
          house: user.House
        }
      });

      // Set auth role cookie
      response.cookies.set('role', role, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });

      return response;
    }

    return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
