import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  try {
    // Query 1: Count how many people are in each role (Admin, Kitchen, etc.)
    const [userCounts] = await pool.query(
      'SELECT Role, COUNT(*) as total FROM Customer GROUP BY Role'
    );

    // Query 2: Get a simple list of all orders to show the total number
    const [orderCounts] = await pool.query('SELECT COUNT(*) as total FROM `Order`');

    return NextResponse.json({ 
      success: true, 
      users: userCounts, 
      orders: orderCounts[0].total 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
