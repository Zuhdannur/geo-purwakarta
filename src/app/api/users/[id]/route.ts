import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
  })
  if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  try {
    const body = await req.json()
    const data: any = {}
    if (typeof body.email === 'string') data.email = body.email
    if (typeof body.name === 'string' || body.name === null) data.name = body.name ?? null
    if (typeof body.role === 'string') data.role = body.role === 'ADMIN' ? 'ADMIN' : 'USER'
    if (typeof body.password === 'string' && body.password.length >= 6) {
      data.passwordHash = await bcrypt.hash(body.password, 10)
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
    })
    return NextResponse.json(updated)
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'email already exists' }, { status: 409 })
    }
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'failed to update user' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  try {
    await prisma.user.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'failed to delete user' }, { status: 500 })
  }
}


