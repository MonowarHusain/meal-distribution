import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT m.*, 
             COALESCE(AVG(r.Rating), 0) AS AvgRating, 
             COUNT(r.ReviewID) AS ReviewCount
      FROM MenuItem m
      LEFT JOIN Review r ON m.MenuItemID = r.MenuItemID
      GROUP BY m.MenuItemID
      ORDER BY m.MenuItemID ASC
    `);
    return NextResponse.json({ success: true, data: rows || [] });
  } catch (error) {
    console.error('Menu GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch menu items', details: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON request payload' }, { status: 400 });
    }

    const { name, price, type, image_url } = body || {};

    if (!name || price === undefined || !type) {
      return NextResponse.json({ success: false, message: 'Item name, price, and type are required' }, { status: 400 });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ success: false, message: 'Price must be a valid positive number' }, { status: 400 });
    }

    const itemType = type === 'Premium' ? 'Premium' : 'Regular';
    const imageUrl = image_url ? String(image_url).trim() : '';

    const [result] = await pool.query(
      'INSERT INTO MenuItem (Name, Price, Image_URL, Item_Type) VALUES (?, ?, ?, ?)',
      [String(name).trim(), parsedPrice, imageUrl, itemType]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Menu item created successfully',
        menuItemId: result.insertId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Menu POST Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create menu item', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Menu item ID parameter is required' }, { status: 400 });
    }

    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return NextResponse.json({ success: false, message: 'Invalid item ID' }, { status: 400 });
    }

    const [result] = await pool.query('DELETE FROM MenuItem WHERE MenuItemID = ?', [parsedId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Menu DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete menu item', details: error.message }, { status: 500 });
  }
}
