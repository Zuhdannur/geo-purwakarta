import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Username and password are required'
      }, { status: 400 });
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    // Generate a simple token (you can use JWT for production)
    const token = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token: token,
      user: { 
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Login failed'
    }, { status: 500 });
  }
}


