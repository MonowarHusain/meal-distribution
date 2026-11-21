import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // 1. Fetch all users
    const [users] = await pool.query(
      'SELECT CustomerID, Name, Email, Phone, Role, Street, Road, House, CreatedAt FROM Customer ORDER BY CustomerID DESC'
    );

    // 2. Fetch all orders globally with their latest status
    const [orders] = await pool.query(`
      SELECT o.OrderID, o.Order_Number, o.Total_Price, o.Order_Date, c.Name as CustomerName, c.Phone as CustomerPhone,
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
    const totalRevenue = (payments || [])
      .filter(p => p.Payment_Status === 'Completed')
      .reduce((sum, p) => sum + parseFloat(p.Amount || 0), 0);

    return NextResponse.json({
      success: true,
      users: users || [],
      orders: orders || [],
      payments: payments || [],
      stats: {
        totalRevenue: totalRevenue.toFixed(2),
        totalOrders: (orders || []).length,
        totalUsers: (users || []).length
      }
    });
  } catch (error) {
    console.error('Admin API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch admin data', details: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON payload' }, { status: 400 });
    }

    const { customerId, newRole, paymentId, newPaymentStatus } = body || {};

    // 1. Handle Role Update
    if (customerId && newRole) {
      const allowedRoles = ['Admin', 'Kitchen', 'Delivery', 'Customer'];
      if (!allowedRoles.includes(newRole)) {
        return NextResponse.json({ success: false, message: 'Invalid user role' }, { status: 400 });
      }

      const [res] = await pool.query('UPDATE Customer SET Role = ? WHERE CustomerID = ?', [newRole, customerId]);
      if (res.affectedRows === 0) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Role updated successfully' });
    }

    // 2. Handle Payment Status Update
    if (paymentId && newPaymentStatus) {
      const allowedPaymentStatuses = ['Pending', 'Completed', 'Failed'];
      if (!allowedPaymentStatuses.includes(newPaymentStatus)) {
        return NextResponse.json({ success: false, message: 'Invalid payment status' }, { status: 400 });
      }

      const [res] = await pool.query('UPDATE Payment SET Payment_Status = ? WHERE Payment_ID = ?', [newPaymentStatus, paymentId]);
      if (res.affectedRows === 0) {
        return NextResponse.json({ success: false, message: 'Payment record not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Payment status updated' });
    }

    return NextResponse.json({ success: false, message: 'Invalid patch parameters' }, { status: 400 });
  } catch (error) {
    console.error('Admin PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update admin data', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON payload' }, { status: 400 });
    }

    const { name, email, password, phone, role } = body || {};

    if (!name || !email || !password || !role) {
      return NextResponse.json({ success: false, message: 'Name, email, password, and role are required' }, { status: 400 });
    }

    const allowedRoles = ['Admin', 'Kitchen', 'Delivery', 'Customer'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ success: false, message: 'Invalid role specified' }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    const [existing] = await pool.query('SELECT CustomerID FROM Customer WHERE LOWER(Email) = ?', [trimmedEmail]);
    if (existing && existing.length > 0) {
      return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 409 });
    }

    const [result] = await pool.query(
      'INSERT INTO Customer (Name, Email, Password, Phone, Role) VALUES (?, ?, ?, ?, ?)',
      [String(name).trim(), trimmedEmail, String(password), phone ? String(phone).trim() : '', role]
    );

    return NextResponse.json(
      { success: true, message: 'User added successfully', customerId: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin POST Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create user', details: error.message }, { status: 500 });
  }
}
