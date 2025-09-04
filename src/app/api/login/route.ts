import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Simple authentication check (you can enhance this)
    if (username === 'admin' && password === 'admin') {
      // Generate a simple token (you can use JWT for production)
      const token = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        token: token,
        user: { username: username }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Login failed'
    }, { status: 500 });
  }
}


