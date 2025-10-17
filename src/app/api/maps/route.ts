import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const maps = await prisma.maps.findMany({
    select: { id: true, name: true, geojson: true, color: true, warna: true, sortOrder: true, createdAt: true, updatedAt: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  })
  return NextResponse.json(maps)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, geojson, color, warna } = body || {}

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (typeof geojson === 'undefined') {
      return NextResponse.json({ error: 'geojson is required' }, { status: 400 })
    }

    // Get the current max sortOrder and increment it
    const maxSortOrder = await prisma.maps.aggregate({
      _max: { sortOrder: true }
    })
    const nextSortOrder = (maxSortOrder._max.sortOrder || 0) + 1

    const created = await prisma.maps.create({
      data: { 
        name, 
        geojson, 
        sortOrder: nextSortOrder,
        ...(color && { color }), // Include color if provided, otherwise use default
        ...(warna && { warna }) // Include warna if provided
      },
      select: { id: true, name: true, color: true, warna: true, createdAt: true, updatedAt: true },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Failed to create map:', error)
    return NextResponse.json({ 
      error: 'failed to create map', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

