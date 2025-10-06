import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const maps = await prisma.maps.findMany({
    select: { id: true, name: true, geojson: true, sortOrder: true, createdAt: true, updatedAt: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  })
  return NextResponse.json(maps)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, geojson } = body || {}

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (typeof geojson === 'undefined') {
      return NextResponse.json({ error: 'geojson is required' }, { status: 400 })
    }

    const created = await prisma.maps.create({
      data: { name, geojson, sortOrder: Date.now() },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'failed to create map' }, { status: 500 })
  }
}

