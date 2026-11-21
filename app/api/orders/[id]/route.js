import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams?.id;

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Missing order ID parameter' }, { status: 400 });
    }

    const parsedOrderId = parseInt(orderId, 10);
    if (isNaN(parsedOrderId)) {
      return NextResponse.json({ success: false, message: 'Invalid order ID format' }, { status: 400 });
    }

    // 1. Fetch the exact items ordered
    const [items] = await pool.query(
      `SELECT m."MenuItemID", m."Name", m."Price", m."Item_Type", p."Quantity", (m."Price" * p."Quantity") as "Subtotal"
       FROM "PLACES_ITEM" p
       JOIN "MenuItem" m ON p."MenuItemID" = m."MenuItemID"
       WHERE p."OrderID" = $1`,
      [parsedOrderId]
    );

    // 2. Fetch the customer and order details
    const [orderDetails] = await pool.query(
      `SELECT o."OrderID", o."Order_Number", o."Total_Price", o."Order_Date", o."DeliveryManID",
              c."CustomerID", c."Name", c."Phone", c."Street", c."Road", c."House",
              p."Payment_Method", p."Payment_Status"
       FROM "Order" o
       JOIN "Customer" c ON o."CustomerID" = c."CustomerID"
       LEFT JOIN "Payment" p ON o."OrderID" = p."Order_ID"
       WHERE o."OrderID" = $1`,
      [parsedOrderId]
    );

    if (!orderDetails || orderDetails.length === 0) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // 3. Fetch the full status timeline
    const [timeline] = await pool.query(
      `SELECT "Status", "Status_Date"
       FROM "Order_History"
       WHERE "OrderID" = $1
       ORDER BY "Status_Date" ASC`,
      [parsedOrderId]
    );

    const order = orderDetails[0];

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.OrderID || order.orderid,
        orderNumber: order.Order_Number || order.order_number,
        totalPrice: order.Total_Price || order.total_price,
        orderDate: order.Order_Date || order.order_date,
        paymentMethod: order.Payment_Method || order.payment_method,
        paymentStatus: order.Payment_Status || order.payment_status
      },
      customer: {
        customerId: order.CustomerID || order.customerid,
        name: order.Name || order.name,
        phone: order.Phone || order.phone,
        street: order.Street || order.street,
        road: order.Road || order.road,
        house: order.House || order.house
      },
      items: items || [],
      timeline: timeline || []
    });
  } catch (error) {
    console.error('Order Details GET Error:', error);
    return NextResponse.json({ success: false, error: 'Database error fetching order details', details: error.message }, { status: 500 });
  }
}
