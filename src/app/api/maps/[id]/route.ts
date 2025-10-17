import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  const map = await prisma.maps.findUnique({ select: { id: true, name: true, geojson: true, color: true, warna: true, createdAt: true, updatedAt: true }, where: { id } })
  if (!map) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(map)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  try {
    const body = await req.json()
    const data: any = {}
    if (typeof body.name === 'string') data.name = body.name
    if (typeof body.geojson !== 'undefined') data.geojson = body.geojson
    if (typeof body.color === 'string') data.color = body.color
    if (typeof body.warna === 'string') data.warna = body.warna

    const updated = await prisma.maps.update({
      where: { id },
      data,
      select: { id: true, name: true, geojson: true, color: true, warna: true, createdAt: true, updatedAt: true },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'failed to update map' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  try {
    await prisma.maps.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'failed to delete map' }, { status: 500 })
  }
}

