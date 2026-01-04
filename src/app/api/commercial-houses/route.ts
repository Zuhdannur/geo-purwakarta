import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeCoordinatesToString } from '@/lib/geometry-utils';

// GET - Fetch all commercial houses with pagination and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const kecamatan = searchParams.get('kecamatan') || '';

    const skip = (page - 1) * limit;

    // Build where clause for search and filter
    const where: any = {};
    
    if (search) {
      where.OR = [
        { alamat: { contains: search, mode: 'insensitive' } },
        { namaPerumahan: { contains: search, mode: 'insensitive' } },
        { namaPengembangan: { contains: search, mode: 'insensitive' } },
        { noIzin: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (kecamatan) {
      where.kecamatan = kecamatan;
    }

    const [commercialHouses, total] = await Promise.all([
      prisma.commercialHouse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.commercialHouse.count({ where }),
    ]);

    return NextResponse.json({
      data: commercialHouses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching commercial houses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commercial houses' },
      { status: 500 }
    );
  }
}

// POST - Create a new commercial house
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      idSrk,
      namaPerumahan,
      alamat,
      kelurahanDesa,
      kecamatan,
      namaPengembangan,
      noIzin,
      koordinat,
      serahTerimaPsu,
      rawanBanjir,
      gerakanTanah,
      gempaBumi,
      dataLainnya,
      geometry,
      foto = [],
    } = body;

    // Generate coordinate hash from geometry if provided
    const coordinateHash = geometry ? normalizeCoordinatesToString(geometry) : null;

    const commercialHouse = await prisma.commercialHouse.create({
      data: {
        idSrk,
        coordinateHash,
        namaPerumahan,
        alamat,
        kelurahanDesa,
        kecamatan,
        namaPengembangan,
        noIzin,
        koordinat,
        serahTerimaPsu,
        rawanBanjir,
        gerakanTanah,
        gempaBumi,
        dataLainnya,
        geometry,
        foto,
      },
    });

    return NextResponse.json(commercialHouse, { status: 201 });
  } catch (error) {
    console.error('Error creating commercial house:', error);
    return NextResponse.json(
      { error: 'Failed to create commercial house' },
      { status: 500 }
    );
  }
}
