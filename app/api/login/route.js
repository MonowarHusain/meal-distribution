import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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

    // Authenticate user against "Customer" table in PostgreSQL
    const [rows] = await pool.query(
      `SELECT "CustomerID", "Name", "Email", "Password", "Phone", "Role", "Street", "Road", "House" 
       FROM "Customer" 
       WHERE LOWER("Email") = $1`,
      [trimmedEmail]
    );

    if (!rows || rows.length === 0) {
      console.warn(`[Login] Authentication failed: email "${trimmedEmail}" not found in database.`);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. Please verify your email and password.' },
        { status: 401 }
      );
    }

    const user = rows[0];
    const storedPassword = user.Password || user.password;

    // Verify password: support bcryptjs hash and direct plain text fallback
    let isMatch = false;
    if (storedPassword) {
      if (storedPassword === String(password)) {
        isMatch = true;
      } else {
        try {
          isMatch = await bcrypt.compare(String(password), storedPassword);
        } catch (bcryptErr) {
          console.warn('[Login] bcrypt compare error:', bcryptErr.message);
          isMatch = false;
        }
      }
    }

    if (!isMatch) {
      console.warn(`[Login] Authentication failed: invalid password for email "${trimmedEmail}".`);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. Please verify your email and password.' },
        { status: 401 }
      );
    }

    const rawRole = user.Role || user.role || 'Customer';
    const role = rawRole.toLowerCase();
    const customerId = user.CustomerID || user.customerid || user.id || 1;
    const name = user.Name || user.name || trimmedEmail.split('@')[0];
    const emailVal = user.Email || user.email || trimmedEmail;
    const phone = user.Phone || user.phone || '';
    const street = user.Street || user.street || '';
    const road = user.Road || user.road || '';
    const house = user.House || user.house || '';

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      role: role,
      id: customerId,
      user: {
        id: customerId,
        name: name,
        email: emailVal,
        phone: phone,
        role: rawRole,
        street: street,
        road: road,
        house: house
      }
    });

    // Set auth role and session cookies for Vercel HTTPS production
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('role', role, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'lax',
      secure: isProduction
    });

    response.cookies.set('userId', String(customerId), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
      secure: isProduction
    });

    return response;
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Database error occurred. Please verify database connection.',
        details: error.message
      },
      { status: 500 }
    );
  }
}
