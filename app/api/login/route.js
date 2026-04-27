import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    
    // Dummy login validation based on the frontend hint
    let role = 'Customer';
    if (email.includes('admin')) role = 'Admin';
    else if (email.includes('kitchen')) role = 'Kitchen';
    else if (email.includes('del')) role = 'Delivery';

    if (password === 'pass123') {
        return NextResponse.json({
            success: true,
            user: { Email: email, Role: role }
        });
    } else {
        return NextResponse.json({ success: false, message: 'Invalid credentials' });
    }
  } catch(e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
