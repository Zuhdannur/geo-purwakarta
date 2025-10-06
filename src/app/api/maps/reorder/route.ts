import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { order: Array<{ id: number; sortOrder: number }> }
    if (!body?.order || !Array.isArray(body.order)) {
      return NextResponse.json({ error: 'order array required' }, { status: 400 })
    }
    await prisma.$transaction(
      body.order.map(item => prisma.maps.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }))
    )
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'failed to reorder' }, { status: 500 })
  }
}


