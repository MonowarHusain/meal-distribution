import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Missing orderId parameter' }, { status: 400 });
    }

    // 1. Fetch the exact items ordered
    const [items] = await pool.query(`
      SELECT m.Name, m.Price, m.Item_Type, p.Quantity, (m.Price * p.Quantity) as Subtotal
      FROM PLACES_ITEM p
      JOIN MenuItem m ON p.MenuItemID = m.MenuItemID
      WHERE p.OrderID = ?
    `, [orderId]);

    // 2. Fetch the customer details for this order (Useful for Delivery/Kitchen/Admin)
    const [customerDetails] = await pool.query(`
      SELECT c.Name, c.Phone, c.Street, c.Road, c.House
      FROM \`Order\` o
      JOIN Customer c ON o.CustomerID = c.CustomerID
      WHERE o.OrderID = ?
    `, [orderId]);

    // 3. Fetch the full status timeline
    const [timeline] = await pool.query(`
      SELECT Status, Status_Date
      FROM Order_History
      WHERE OrderID = ?
      ORDER BY Status_Date ASC
    `, [orderId]);

    return NextResponse.json({ 
      success: true, 
      items,
      customer: customerDetails[0] || null,
      timeline
    });
  } catch (error) {
    console.error("Order Details GET Error:", error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
