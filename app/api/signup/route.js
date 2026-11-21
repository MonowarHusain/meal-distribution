import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON request payload' }, { status: 400 });
    }

    const { name, email, password, phone, street, road, house } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Name, email, and password are required' }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedName = String(name).trim();

    // Check if email already registered
    const [existing] = await pool.query('SELECT "CustomerID" FROM "Customer" WHERE LOWER("Email") = $1', [trimmedEmail]);
    if (existing && existing.length > 0) {
      return NextResponse.json({ success: false, message: 'An account with this email is already registered.' }, { status: 409 });
    }

    // Secure password hashing with bcryptjs
    const hashedPassword = await bcrypt.hash(String(password), 10);

    // Insert new customer using PostgreSQL RETURNING syntax
    const [rows] = await pool.query(
      `INSERT INTO "Customer" ("Name", "Email", "Password", "Phone", "Street", "Road", "House", "Role") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Customer')
       RETURNING "CustomerID", "Name", "Email", "Role"`,
      [
        trimmedName,
        trimmedEmail,
        hashedPassword,
        phone ? String(phone).trim() : '',
        street ? String(street).trim() : '',
        road ? String(road).trim() : '',
        house ? String(house).trim() : ''
      ]
    );

    const customerId = rows[0]?.CustomerID || rows[0]?.customerid;

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully! You can now log in.',
        customerId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Registration failed', details: error.message },
      { status: 500 }
    );
  }
}
