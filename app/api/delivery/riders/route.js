import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT c.CustomerID, c.Name,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM \`Order\` o 
            WHERE o.DeliveryManID = c.CustomerID 
            AND (SELECT Status FROM Order_History WHERE OrderID = o.OrderID ORDER BY Status_Date DESC LIMIT 1) = 'Dispatched'
          ) THEN 'Occupied'
          ELSE 'Free'
        END as Status
      FROM Customer c
      WHERE c.Role = 'Delivery'
    `);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Delivery Riders API GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
