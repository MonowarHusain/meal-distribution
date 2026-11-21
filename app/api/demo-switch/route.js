import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const DEMO_FALLBACKS = {
  admin: {
    id: 1,
    name: 'System Admin',
    email: 'admin@meal.com',
    phone: '01711111111',
    role: 'Admin',
    street: 'Banani 11',
    road: 'Block B',
    house: 'House 1',
    redirectUrl: '/admin'
  },
  kitchen: {
    id: 3,
    name: 'Head Chef Rahat',
    email: 'kitchen@meal.com',
    phone: '01722222222',
    role: 'Kitchen',
    street: 'Gulshan 1',
    road: 'Road 5',
    house: 'Kitchen Hub',
    redirectUrl: '/kitchen'
  },
  delivery: {
    id: 4,
    name: 'Rider Karim',
    email: 'delivery@meal.com',
    phone: '01733333333',
    role: 'Delivery',
    street: 'Badda',
    road: 'Link Road',
    house: 'Station 3',
    redirectUrl: '/delivery'
  },
  customer: {
    id: 5,
    name: 'Tanvir Customer',
    email: 'customer@meal.com',
    phone: '01744444444',
    role: 'Customer',
    street: 'Dhanmondi 27',
    road: 'Road 8A',
    house: 'Flat 4B',
    redirectUrl: '/customer'
  }
};

function normalizeRoleKey(rawRole) {
  if (!rawRole) return 'customer';
  const cleaned = String(rawRole).trim().toLowerCase();
  if (cleaned === 'deliveryman' || cleaned === 'delivery_man' || cleaned === 'rider') {
    return 'delivery';
  }
  if (DEMO_FALLBACKS[cleaned]) {
    return cleaned;
  }
  return 'customer';
}

async function performRoleSwitch(targetRoleKey, req) {
  const fallback = DEMO_FALLBACKS[targetRoleKey] || DEMO_FALLBACKS.customer;
  let userData = { ...fallback };

  // Attempt to load latest user profile directly from database if available
  try {
    const roleVariants = targetRoleKey === 'delivery' 
      ? ['delivery', 'deliveryman'] 
      : [targetRoleKey, targetRoleKey];

    const [rows] = await pool.query(
      `SELECT "CustomerID", "Name", "Email", "Phone", "Role", "Street", "Road", "House" 
       FROM "Customer" 
       WHERE LOWER("Role") = $1 OR LOWER("Role") = $2 OR LOWER("Email") = $3
       ORDER BY "CustomerID" ASC 
       LIMIT 1`,
      [roleVariants[0], roleVariants[1], fallback.email.toLowerCase()]
    );

    if (rows && rows.length > 0) {
      const u = rows[0];
      userData = {
        id: u.CustomerID || u.customerid || fallback.id,
        name: u.Name || u.name || fallback.name,
        email: u.Email || u.email || fallback.email,
        phone: u.Phone || u.phone || fallback.phone,
        role: u.Role || u.role || fallback.role,
        street: u.Street || u.street || fallback.street,
        road: u.Road || u.road || fallback.road,
        house: u.House || u.house || fallback.house,
        redirectUrl: fallback.redirectUrl
      };
    }
  } catch (dbErr) {
    console.warn('[Demo Switch] Database lookup warning, using demo fallback:', dbErr.message);
  }

  const role = targetRoleKey; // 'admin' | 'kitchen' | 'delivery' | 'customer'
  const isProduction = process.env.NODE_ENV === 'production';

  const response = NextResponse.json({
    success: true,
    message: `Switched to demo role: ${userData.role}`,
    role: role,
    redirectUrl: fallback.redirectUrl,
    id: userData.id,
    user: {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      street: userData.street,
      road: userData.road,
      house: userData.house
    }
  });

  // Set identical session cookies as app/api/login/route.js
  response.cookies.set('role', role, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: 'lax',
    secure: isProduction
  });

  response.cookies.set('userId', String(userData.id), {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
    secure: isProduction
  });

  // Set client-accessible active_role cookie for instant UI hydration
  response.cookies.set('active_role', role, {
    httpOnly: false,
    path: '/',
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
    secure: isProduction
  });

  return response;
}

export async function POST(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      // Empty or invalid body is accepted; will default to customer
    }

    const requestedRole = body.role || 'customer';
    const normalizedKey = normalizeRoleKey(requestedRole);

    return await performRoleSwitch(normalizedKey, req);
  } catch (error) {
    console.error('[Demo Switch Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to switch demo role' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedRole = searchParams.get('role');

    // If role query parameter is passed (e.g. /api/demo-switch?role=admin), perform the switch
    if (requestedRole) {
      const normalizedKey = normalizeRoleKey(requestedRole);
      return await performRoleSwitch(normalizedKey, req);
    }

    // Otherwise, return available demo accounts and current active role
    const currentRoleCookie = req.cookies.get('role')?.value || '';
    const currentUserIdCookie = req.cookies.get('userId')?.value || '';

    return NextResponse.json({
      success: true,
      currentRole: currentRoleCookie,
      currentUserId: currentUserIdCookie,
      availableRoles: [
        { key: 'customer', title: 'Customer', path: '/customer', email: 'customer@meal.com' },
        { key: 'kitchen', title: 'Kitchen', path: '/kitchen', email: 'kitchen@meal.com' },
        { key: 'delivery', title: 'DeliveryMan', path: '/delivery', email: 'delivery@meal.com' },
        { key: 'admin', title: 'Admin', path: '/admin', email: 'admin@meal.com' }
      ]
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error processing request' },
      { status: 500 }
    );
  }
}
