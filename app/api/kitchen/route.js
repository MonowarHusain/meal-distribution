import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const query = `
      SELECT o.OrderID, o.Order_Number, o.Total_Price, o.Order_Date, c.Name as CustomerName, 
             COALESCE((SELECT Status FROM Order_History WHERE OrderID = o.OrderID ORDER BY Status_Date DESC LIMIT 1), 'Pending') as LatestStatus
      FROM \`Order\` o
      JOIN Customer c ON o.CustomerID = c.CustomerID
      HAVING LatestStatus IN ('Pending', 'Kitchen_Accepted')
      ORDER BY o.Order_Date ASC
    `;
    const [rows] = await pool.query(query);
    return NextResponse.json({ success: true, data: rows || [] });
  } catch (error) {
    console.error('Kitchen GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch kitchen orders', details: error.message }, { status: 500 });
  }
}

// Update order status to 'Kitchen_Accepted' or 'Cooking_Done'
export async function PATCH(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON request payload' }, { status: 400 });
    }

    const { orderId, newStatus } = body || {};

    if (!orderId || !newStatus) {
      return NextResponse.json({ success: false, message: 'orderId and newStatus are required' }, { status: 400 });
    }

    const allowedStatuses = ['Kitchen_Accepted', 'Cooking_Done', 'Refused'];
    if (!allowedStatuses.includes(newStatus)) {
      return NextResponse.json({ success: false, message: 'Invalid status update for kitchen. Allowed: Kitchen_Accepted, Cooking_Done, Refused' }, { status: 400 });
    }

    const parsedOrderId = parseInt(orderId, 10);
    if (isNaN(parsedOrderId)) {
      return NextResponse.json({ success: false, message: 'Invalid order ID' }, { status: 400 });
    }

    // Verify order exists
    const [orderExists] = await pool.query('SELECT OrderID FROM `Order` WHERE OrderID = ?', [parsedOrderId]);
    if (!orderExists || orderExists.length === 0) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    await pool.query(
      'INSERT INTO Order_History (OrderID, Status, Status_Date) VALUES (?, ?, NOW())',
      [parsedOrderId, newStatus]
    );

    return NextResponse.json({ success: true, message: `Order status updated to ${newStatus}` });
  } catch (error) {
    console.error('Kitchen PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order status', details: error.message }, { status: 500 });
  }
}
