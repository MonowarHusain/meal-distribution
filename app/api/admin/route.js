import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // 1. Fetch all users
    const [users] = await pool.query(
      'SELECT CustomerID, Name, Email, Phone, Role, Street, Road, House FROM Customer ORDER BY CustomerID DESC'
    );

    // 2. Fetch all orders globally with their latest status
    const [orders] = await pool.query(`
      SELECT o.OrderID, o.Order_Number, o.Total_Price, o.Order_Date, c.Name as CustomerName,
             COALESCE((SELECT Status FROM Order_History WHERE OrderID = o.OrderID ORDER BY Status_Date DESC LIMIT 1), 'Pending') as Status
      FROM \`Order\` o
      JOIN Customer c ON o.CustomerID = c.CustomerID
      ORDER BY o.Order_Date DESC
    `);

    // 3. Fetch all payments
    const [payments] = await pool.query(`
      SELECT p.Payment_ID, p.Payment_Method, p.Payment_Status, p.Amount, p.Payment_Date, o.Order_Number, c.Name as CustomerName
      FROM Payment p
      JOIN \`Order\` o ON p.Order_ID = o.OrderID
      JOIN Customer c ON o.CustomerID = c.CustomerID
      ORDER BY p.Payment_Date DESC
    `);

    // Calculate revenue based only on Completed payments
    const totalRevenue = payments
      .filter(p => p.Payment_Status === 'Completed')
      .reduce((sum, p) => sum + parseFloat(p.Amount), 0);

    return NextResponse.json({ 
      success: true, 
      users, 
      orders,
      payments,
      stats: {
        totalRevenue: totalRevenue.toFixed(2),
        totalOrders: orders.length,
        totalUsers: users.length
      }
    });
  } catch (error) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch admin data' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    
    // Check if this is a role update
    if (body.customerId && body.newRole) {
      await pool.query(
        'UPDATE Customer SET Role = ? WHERE CustomerID = ?',
        [body.newRole, body.customerId]
      );
      return NextResponse.json({ success: true, message: 'Role updated successfully' });
    }
    
    // Check if this is a payment status update
    if (body.paymentId && body.newPaymentStatus) {
      await pool.query(
        'UPDATE Payment SET Payment_Status = ? WHERE Payment_ID = ?',
        [body.newPaymentStatus, body.paymentId]
      );
      return NextResponse.json({ success: true, message: 'Payment status updated' });
    }

    return NextResponse.json({ success: false, message: 'Invalid patch request' }, { status: 400 });
  } catch (error) {
    console.error("Admin PATCH Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, email, password, phone, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const [existing] = await pool.query('SELECT CustomerID FROM Customer WHERE Email = ?', [email]);
    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 409 });
    }

    await pool.query(
      'INSERT INTO Customer (Name, Email, Password, Phone, Role) VALUES (?, ?, ?, ?, ?)',
      [name, email, password, phone || '', role]
    );

    return NextResponse.json({ success: true, message: 'User added successfully' });
  } catch (error) {
    console.error("Admin POST Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}
