import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch a single commercial house by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const commercialHouse = await prisma.commercialHouse.findUnique({
      where: { id },
    });

    if (!commercialHouse) {
      return NextResponse.json(
        { error: 'Commercial house not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(commercialHouse);
  } catch (error) {
    console.error('Error fetching commercial house:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commercial house' },
      { status: 500 }
    );
  }
}

// PUT - Update a commercial house
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      idSrk,
      kawasanPerumahan,
      alamat,
      kecamatan,
      kelurahanDesa,
      namaPengembang,
      noIzin,
      penutupLahan,
      rawanBencana,
      rencanaPolaRuang,
      koordinat,
      geometry,
      foto,
    } = body;

    // Check if commercial house exists
    const existingHouse = await prisma.commercialHouse.findUnique({
      where: { id },
    });

    if (!existingHouse) {
      return NextResponse.json(
        { error: 'Commercial house not found' },
        { status: 404 }
      );
    }

    const updatedHouse = await prisma.commercialHouse.update({
      where: { id },
      data: {
        idSrk,
        kawasanPerumahan,
        alamat,
        kecamatan,
        kelurahanDesa,
        namaPengembang,
        noIzin,
        penutupLahan,
        rawanBencana,
        rencanaPolaRuang,
        koordinat,
        geometry,
        foto,
      },
    });

    return NextResponse.json(updatedHouse);
  } catch (error) {
    console.error('Error updating commercial house:', error);
    return NextResponse.json(
      { error: 'Failed to update commercial house' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a commercial house
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if commercial house exists
    const existingHouse = await prisma.commercialHouse.findUnique({
      where: { id },
    });

    if (!existingHouse) {
      return NextResponse.json(
        { error: 'Commercial house not found' },
        { status: 404 }
      );
    }

    await prisma.commercialHouse.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Commercial house deleted successfully' });
  } catch (error) {
    console.error('Error deleting commercial house:', error);
    return NextResponse.json(
      { error: 'Failed to delete commercial house' },
      { status: 500 }
    );
  }
}
