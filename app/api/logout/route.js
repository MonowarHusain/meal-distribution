import { NextResponse } from 'next/server';

export async function POST(req) {
  const response = NextResponse.json({ success: true });
  
  response.cookies.set({
    name: 'role',
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0 // Expire immediately
  });
  
  return response;
}
