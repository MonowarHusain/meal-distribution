import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const [existing] = await pool.query('SELECT CustomerID FROM Customer WHERE Email = ?', [email]);
    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 409 });
    }

    // Insert new customer (default role 'Customer')
    const [result] = await pool.query(
      'INSERT INTO Customer (Name, Email, Password, Phone, Role) VALUES (?, ?, ?, ?, ?)',
      [name, email, password, phone || '', 'Customer']
    );

    return NextResponse.json({ success: true, message: 'Registration successful' });
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to register' }, { status: 500 });
  }
}
