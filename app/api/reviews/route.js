import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST: Add a new review
export async function POST(request) {
  try {
    const { customerId, menuItemId, orderId, rating, comment } = await request.json();

    if (!customerId || !menuItemId || !orderId || !rating) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, message: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    await pool.query(
      'INSERT INTO Review (CustomerID, MenuItemID, OrderID, Rating, Comment) VALUES (?, ?, ?, ?, ?)',
      [customerId, menuItemId, orderId, rating, comment || null]
    );

    return NextResponse.json({ success: true, message: 'Review added successfully' });
  } catch (error) {
    console.error("Failed to add review:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ success: false, message: 'You have already reviewed this item for this order.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
