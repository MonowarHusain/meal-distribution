import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function POST(request) {
    // Getting a connection from the database for the Transaction
    const connection = await pool.getConnection();

    try {
        const body = await request.json();
        const { customerId, items, totalPrice } = body;

        // items will come in this format: [{ menuItemId: 1, quantity: 2 }]

        await connection.beginTransaction();

        // 1. Insert into the Order table
        const [countRows] = await connection.query('SELECT COUNT(*) as total FROM `Order`');
        const nextCount = countRows[0].total + 1;
        const orderNumber = `26-${String(nextCount).padStart(3, '0')}`;
        const [orderResult] = await connection.query(
            'INSERT INTO `Order` (CustomerID, Total_Price, Order_Number) VALUES (?, ?, ?)',
            [customerId, totalPrice, orderNumber]
        );
        const orderId = orderResult.insertId; // Getting the newly created OrderID

        // 2. Insert the items into PLACES_ITEM (Bridge Table)
        for (const item of items) {
            await connection.query(
                'INSERT INTO PLACES_ITEM (OrderID, MenuItemID, Quantity) VALUES (?, ?, ?)',
                [orderId, item.menuItemId, item.quantity]
            );
        }

        // 3. Insert into Order_History table with 'Pending' status
        await connection.query(
            'INSERT INTO Order_History (OrderID, Status) VALUES (?, ?)',
            [orderId, 'Pending']
        );

        // If everything is fine, commit the transaction to save it to the database
        await connection.commit();
        connection.release();

        return NextResponse.json({ success: true, message: 'Order Placed Successfully!', orderNumber });

    } catch (error) {
        // If there is any error, no data will be saved in any table (Rollback)
        await connection.rollback();
        connection.release();
        console.error('Order creation failed:', error);
        return NextResponse.json({ success: false, error: 'Database error while placing order' }, { status: 500 });
    }
}
