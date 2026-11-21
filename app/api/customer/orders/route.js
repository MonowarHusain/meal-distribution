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
      `SELECT o.OrderID, o.Order_Number, o.Total_Price, o.Order_Date,
              COALESCE((SELECT Status FROM Order_History WHERE OrderID = o.OrderID ORDER BY Status_Date DESC LIMIT 1), 'Pending') as Status
       FROM \`Order\` o
       WHERE o.CustomerID = ?
       ORDER BY o.Order_Date DESC`,
      [parsedCustomerId]
    );

    return NextResponse.json({ success: true, orders: rows || [] });
  } catch (error) {
    console.error('Customer Orders GET Error:', error);
    return NextResponse.json({ success: false, error: 'Database error fetching order history', details: error.message }, { status: 500 });
  }
}
