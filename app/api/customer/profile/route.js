import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ success: false, message: 'Missing customerId' }, { status: 400 });
    }

    const [rows] = await pool.query(`
      SELECT Name, Email, Phone, Street, Road, House 
      FROM Customer 
      WHERE CustomerID = ?
    `, [customerId]);

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: rows[0] });
  } catch (error) {
    console.error("Profile GET Error:", error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { customerId, name, phone, street, road, house } = body;

    if (!customerId) {
      return NextResponse.json({ success: false, message: 'Missing customerId' }, { status: 400 });
    }

    await pool.query(`
      UPDATE Customer 
      SET Name = ?, Phone = ?, Street = ?, Road = ?, House = ?
      WHERE CustomerID = ?
    `, [name, phone, street, road, house, customerId]);

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error("Profile PATCH Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
