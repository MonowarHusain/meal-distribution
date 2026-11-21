import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ success: false, message: 'Missing customerId parameter' }, { status: 400 });
    }

    const parsedCustomerId = parseInt(customerId, 10);
    if (isNaN(parsedCustomerId)) {
      return NextResponse.json({ success: false, message: 'Invalid customerId parameter' }, { status: 400 });
    }

    const [rows] = await pool.query(
      `SELECT CustomerID, Name, Email, Phone, Street, Road, House, Role 
       FROM Customer 
       WHERE CustomerID = ?`,
      [parsedCustomerId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: rows[0] });
  } catch (error) {
    console.error('Customer Profile GET Error:', error);
    return NextResponse.json({ success: false, error: 'Database error fetching profile', details: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON payload' }, { status: 400 });
    }

    const { customerId, name, phone, street, road, house } = body || {};

    if (!customerId) {
      return NextResponse.json({ success: false, message: 'Missing customerId in request body' }, { status: 400 });
    }

    const parsedCustomerId = parseInt(customerId, 10);
    if (isNaN(parsedCustomerId)) {
      return NextResponse.json({ success: false, message: 'Invalid customerId' }, { status: 400 });
    }

    const [result] = await pool.query(
      `UPDATE Customer 
       SET Name = COALESCE(?, Name), 
           Phone = COALESCE(?, Phone), 
           Street = COALESCE(?, Street), 
           Road = COALESCE(?, Road), 
           House = COALESCE(?, House)
       WHERE CustomerID = ?`,
      [name?.trim(), phone?.trim(), street?.trim(), road?.trim(), house?.trim(), parsedCustomerId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Customer Profile PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile', details: error.message }, { status: 500 });
  }
}
