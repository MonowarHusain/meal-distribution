import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const type = searchParams.get('type') || 'pending'; // 'pending' or 'history'

    if (!customerId) {
      return NextResponse.json({ success: false, message: 'Missing customerId parameter' }, { status: 400 });
    }

    const parsedCustomerId = parseInt(customerId, 10);
    if (isNaN(parsedCustomerId)) {
      return NextResponse.json({ success: false, message: 'Invalid customerId parameter' }, { status: 400 });
    }

    if (type === 'pending') {
      // Find delivered items that haven't been reviewed yet by this customer
      const [rows] = await pool.query(
        `SELECT o."OrderID", pi."MenuItemID", m."Name", m."Image_URL", o."Order_Date"
         FROM "Order" o
         JOIN "PLACES_ITEM" pi ON o."OrderID" = pi."OrderID"
         JOIN "MenuItem" m ON pi."MenuItemID" = m."MenuItemID"
         WHERE o."CustomerID" = $1
         AND (SELECT "Status" FROM "Order_History" WHERE "OrderID" = o."OrderID" ORDER BY "Status_Date" DESC LIMIT 1) = 'Delivered'
         AND NOT EXISTS (
           SELECT 1 FROM "Review" r WHERE r."OrderID" = o."OrderID" AND r."MenuItemID" = pi."MenuItemID"
         )
         ORDER BY o."Order_Date" DESC`,
        [parsedCustomerId]
      );
      return NextResponse.json({ success: true, data: rows || [] });
    } else if (type === 'history') {
      // Find reviews submitted by this customer
      const [rows] = await pool.query(
        `SELECT r."ReviewID", r."Rating", r."Comment", r."CreatedAt", m."Name", m."Image_URL", o."Order_Number"
         FROM "Review" r
         JOIN "MenuItem" m ON r."MenuItemID" = m."MenuItemID"
         JOIN "Order" o ON r."OrderID" = o."OrderID"
         WHERE r."CustomerID" = $1
         ORDER BY r."CreatedAt" DESC`,
        [parsedCustomerId]
      );
      return NextResponse.json({ success: true, data: rows || [] });
    }

    return NextResponse.json({ success: false, message: "Invalid type parameter. Use 'pending' or 'history'." }, { status: 400 });
  } catch (error) {
    console.error('Customer Reviews GET Error:', error);
    return NextResponse.json({ success: false, error: 'Database error fetching reviews', details: error.message }, { status: 500 });
  }
}
