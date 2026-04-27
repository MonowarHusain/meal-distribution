import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

// Get all orders that are currently "Pending"
export async function GET() {
    try {
        const query = `
      SELECT o.OrderID, o.Order_Number, o.Total_Price, c.Name as CustomerName, h.Status
      FROM \`Order\` o
      JOIN Customer c ON o.CustomerID = c.CustomerID
      JOIN Order_History h ON o.OrderID = h.OrderID
      WHERE h.Status = 'Pending'
    `;
        const [rows] = await pool.query(query);
        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Update order status to 'Kitchen_Accepted'
export async function PATCH(request) {
    try {
        const { orderId } = await request.json();
        await pool.query(
            'UPDATE Order_History SET Status = ? WHERE OrderID = ?',
            ['Kitchen_Accepted', orderId]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}