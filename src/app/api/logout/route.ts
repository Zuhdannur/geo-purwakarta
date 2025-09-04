import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Just return success - the client will handle localStorage clearing
    return NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: 'Logout failed' 
    }, { status: 500 });
  }
}
