import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
    orderBy: { id: 'asc' },
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, password, role } = body || {}

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'password must be at least 6 chars' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const created = await prisma.user.create({
      data: {
        username: email, // Use email as username
        email,
        name: name ?? null,
        passwordHash,
        role: role === 'ADMIN' ? 'ADMIN' : 'USER',
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'failed to create user' }, { status: 500 })
  }
}


