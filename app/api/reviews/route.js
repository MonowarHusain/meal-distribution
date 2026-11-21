import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON payload' }, { status: 400 });
    }

    const { customerId, menuItemId, orderId, rating, comment } = body || {};

    if (!customerId || !menuItemId || !orderId || rating === undefined) {
      return NextResponse.json({ success: false, message: 'customerId, menuItemId, orderId, and rating are required' }, { status: 400 });
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ success: false, message: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    // Insert review record
    await pool.query(
      'INSERT INTO Review (CustomerID, MenuItemID, OrderID, Rating, Comment, CreatedAt) VALUES (?, ?, ?, ?, ?, NOW())',
      [customerId, menuItemId, orderId, parsedRating, comment ? String(comment).trim() : null]
    );

    return NextResponse.json({ success: true, message: 'Review submitted successfully!' }, { status: 201 });
  } catch (error) {
    console.error('Add Review POST Error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ success: false, message: 'You have already reviewed this item for this order.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Database error submitting review', details: error.message }, { status: 500 });
  }
}
