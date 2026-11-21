import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  let connection;
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON request payload' }, { status: 400 });
    }

    const { customerId, items, totalPrice, paymentMethod } = body || {};

    // Validate customer
    if (!customerId) {
      return NextResponse.json({ success: false, message: 'Customer ID is required' }, { status: 400 });
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Order must include at least one item' }, { status: 400 });
    }

    for (const item of items) {
      if (!item.menuItemId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json({ success: false, message: 'Each item must have a valid menuItemId and positive quantity' }, { status: 400 });
      }
    }

    // Validate total price
    const parsedTotal = parseFloat(totalPrice);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      return NextResponse.json({ success: false, message: 'Total price must be a valid positive amount' }, { status: 400 });
    }

    // Validate payment method
    const allowedPaymentMethods = ['Cash On Delivery', 'bKash', 'Card'];
    const selectedMethod = allowedPaymentMethods.includes(paymentMethod) ? paymentMethod : 'Cash On Delivery';

    // Acquire dedicated connection from pool for atomic transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verify customer exists
    const [customerRows] = await connection.query('SELECT CustomerID FROM Customer WHERE CustomerID = ?', [customerId]);
    if (!customerRows || customerRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ success: false, message: 'Customer account not found' }, { status: 404 });
    }

    // Generate unique order number safely
    const [countRows] = await connection.query('SELECT COUNT(*) as total FROM `Order`');
    const nextCount = (countRows[0]?.total || 0) + 1;
    let orderNumber = `26-${String(nextCount).padStart(3, '0')}`;

    // Check collision and adjust if necessary
    const [existingOrder] = await connection.query('SELECT OrderID FROM `Order` WHERE Order_Number = ?', [orderNumber]);
    if (existingOrder && existingOrder.length > 0) {
      orderNumber = `26-${String(nextCount).padStart(3, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // 1. Insert into Order table
    const [orderResult] = await connection.query(
      'INSERT INTO `Order` (CustomerID, Total_Price, Order_Number) VALUES (?, ?, ?)',
      [customerId, parsedTotal, orderNumber]
    );
    const orderId = orderResult.insertId;

    // 2. Insert items into PLACES_ITEM
    for (const item of items) {
      await connection.query(
        'INSERT INTO PLACES_ITEM (OrderID, MenuItemID, Quantity) VALUES (?, ?, ?)',
        [orderId, item.menuItemId, item.quantity]
      );
    }

    // 3. Insert initial status in Order_History
    await connection.query(
      'INSERT INTO Order_History (OrderID, Status, Status_Date) VALUES (?, ?, NOW())',
      [orderId, 'Pending']
    );

    // 4. Insert Payment record
    const paymentStatus = selectedMethod === 'Cash On Delivery' ? 'Pending' : 'Completed';
    await connection.query(
      'INSERT INTO Payment (Order_ID, Payment_Method, Payment_Status, Amount, Payment_Date) VALUES (?, ?, ?, ?, NOW())',
      [orderId, selectedMethod, paymentStatus, parsedTotal]
    );

    await connection.commit();

    return NextResponse.json(
      {
        success: true,
        message: 'Order Placed Successfully!',
        orderId,
        orderNumber
      },
      { status: 201 }
    );
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rbErr) {
        console.error('Transaction rollback error:', rbErr);
      }
    }
    console.error('Order creation error:', error);
    return NextResponse.json({ success: false, error: 'Database error while placing order', details: error.message }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
