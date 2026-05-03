import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  const [rows] = await pool.query(`
    SELECT m.*, 
           COALESCE(AVG(r.Rating), 0) AS AvgRating, 
           COUNT(r.ReviewID) AS ReviewCount
    FROM MenuItem m
    LEFT JOIN Review r ON m.MenuItemID = r.MenuItemID
    GROUP BY m.MenuItemID
  `);
  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req) {
  const { name, price, type } = await req.json();
  await pool.query('INSERT INTO MenuItem (Name, Price, Item_Type) VALUES (?, ?, ?)', [name, price, type]);
  return NextResponse.json({ success: true });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await pool.query('DELETE FROM MenuItem WHERE MenuItemID = ?', [id]);
  return NextResponse.json({ success: true });
}
