import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
    try {
        const query = `
      SELECT o.OrderID, o.Order_Number, o.Total_Price, c.Name as CustomerName, 
             (SELECT Status FROM Order_History WHERE OrderID = o.OrderID ORDER BY Status_Date DESC LIMIT 1) as LatestStatus
      FROM \`Order\` o
      JOIN Customer c ON o.CustomerID = c.CustomerID
      HAVING LatestStatus IN ('Pending', 'Kitchen_Accepted')
      ORDER BY o.Order_Date ASC
    `;
        const [rows] = await pool.query(query);
        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Update order status to 'Kitchen_Accepted' or 'Cooking_Done'
export async function PATCH(request) {
    try {
        const { orderId, newStatus } = await request.json(); // Accept newStatus from frontend
        
        if (!['Kitchen_Accepted', 'Cooking_Done'].includes(newStatus)) {
           return NextResponse.json({ success: false, error: 'Invalid status update for kitchen' }, { status: 400 });
        }

        await pool.query(
            'INSERT INTO Order_History (OrderID, Status) VALUES (?, ?)',
            [orderId, newStatus]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}