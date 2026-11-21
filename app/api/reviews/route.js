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

    // Insert review record in PostgreSQL
    await pool.query(
      `INSERT INTO "Review" ("CustomerID", "MenuItemID", "OrderID", "Rating", "Comment", "CreatedAt") 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
       RETURNING "ReviewID"`,
      [customerId, menuItemId, orderId, parsedRating, comment ? String(comment).trim() : null]
    );

    return NextResponse.json({ success: true, message: 'Review submitted successfully!' }, { status: 201 });
  } catch (error) {
    console.error('Add Review POST Error:', error);
    // 23505 is PostgreSQL unique_violation error code
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ success: false, message: 'You have already reviewed this item for this order.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Database error submitting review', details: error.message }, { status: 500 });
  }
}
