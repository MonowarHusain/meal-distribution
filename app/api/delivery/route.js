import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Fetch orders that are 'Cooking_Done' (Ready for pickup) or 'Dispatched' (Out for delivery)
    const [rows] = await pool.query(`
      SELECT o.OrderID, o.Order_Number, c.Name as CustomerName, c.Phone, c.Street, c.Road, c.House,
             (SELECT Status FROM Order_History WHERE OrderID = o.OrderID ORDER BY Status_Date DESC LIMIT 1) as Status
      FROM \`Order\` o
      JOIN Customer c ON o.CustomerID = c.CustomerID
      WHERE EXISTS (
        SELECT 1 FROM Order_History oh 
        WHERE oh.OrderID = o.OrderID 
        AND oh.Status IN ('Cooking_Done', 'Dispatched')
        AND oh.Status = (SELECT Status FROM Order_History WHERE OrderID = o.OrderID ORDER BY Status_Date DESC LIMIT 1)
      )
      ORDER BY o.Order_Date ASC
    `);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Delivery API GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { orderId, deliverymanId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
    }

    // Get current status
    const [history] = await pool.query(
      'SELECT Status FROM Order_History WHERE OrderID = ? ORDER BY Status_Date DESC LIMIT 1',
      [orderId]
    );

    if (history.length === 0) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const currentStatus = history[0].Status;
    let nextStatus = '';

    if (currentStatus === 'Cooking_Done') {
      nextStatus = 'Dispatched';
    } else if (currentStatus === 'Dispatched') {
      nextStatus = 'Delivered';
    } else {
      return NextResponse.json({ success: false, message: 'Order is not in a deliverable state' }, { status: 400 });
    }

    // Update status in Order_History
    await pool.query(
      'INSERT INTO Order_History (OrderID, Status, Status_Date) VALUES (?, ?, NOW())',
      [orderId, nextStatus]
    );

    // If a deliveryman accepts the order, assign it to them
    if (nextStatus === 'Dispatched' && deliverymanId) {
      await pool.query(
        'UPDATE `Order` SET DeliveryManID = ? WHERE OrderID = ?',
        [deliverymanId, orderId]
      );
    }

    // Auto-confirm Cash On Delivery payments when delivery is completed
    if (nextStatus === 'Delivered') {
      await pool.query(
        `UPDATE Payment 
         SET Payment_Status = 'Completed' 
         WHERE Order_ID = ? AND Payment_Method = 'Cash On Delivery'`,
        [orderId]
      );
    }

    return NextResponse.json({ success: true, message: `Status updated to ${nextStatus}` });
  } catch (error) {
    console.error("Delivery API PATCH Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
