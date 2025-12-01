import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadFile, getFileAsJson, ensureBucket } from '@/lib/minio'

export async function GET() {
  try {
    const maps = await prisma.maps.findMany({
      select: { 
        id: true, 
        name: true, 
        geojsonPath: true, 
        geojson: true, 
        color: true, 
        warna: true, 
        sortOrder: true, 
        createdAt: true, 
        updatedAt: true 
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    })

    // Fetch GeoJSON from MinIO for each map that has a geojsonPath
    const mapsWithGeojson = await Promise.all(
      maps.map(async (map) => {
        let geojson = map.geojson;
        
        // If geojsonPath exists, fetch from MinIO
        if (map.geojsonPath) {
          try {
            geojson = await getFileAsJson(map.geojsonPath);
          } catch (error) {
            console.error(`Failed to fetch GeoJSON from MinIO for map ${map.id}:`, error);
            // Fallback to stored geojson if available
            if (!geojson) {
              geojson = null;
            }
          }
        }

        return {
          id: map.id,
          name: map.name,
          geojson: geojson,
          color: map.color,
          warna: map.warna,
          sortOrder: map.sortOrder,
          createdAt: map.createdAt,
          updatedAt: map.updatedAt,
        };
      })
    );

    return NextResponse.json(mapsWithGeojson)
  } catch (error) {
    console.error('Failed to fetch maps:', error)
    return NextResponse.json({ 
      error: 'failed to fetch maps', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const name = formData.get('name') as string
    const color = (formData.get('color') as string) || '#3388ff'
    const warna = formData.get('warna') as string | null
    const file = formData.get('file') as File | null

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (!file) {
      return NextResponse.json({ error: 'GeoJSON file is required' }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith('.json') && file.type !== 'application/json' && file.type !== 'application/geo+json') {
      return NextResponse.json({ error: 'Invalid file type. Only JSON files are allowed.' }, { status: 400 })
    }

    // Read and parse the file
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileText = fileBuffer.toString('utf-8')
    let geojson: any;
    
    try {
      geojson = JSON.parse(fileText)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 })
    }

    // Validate it's a GeoJSON
    if (geojson.type !== 'FeatureCollection' && geojson.type !== 'Feature' && geojson.type !== 'GeometryCollection') {
      return NextResponse.json({ error: 'Invalid GeoJSON format' }, { status: 400 })
    }

    // Ensure MinIO bucket exists
    await ensureBucket()

    // Generate unique file path
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const filePath = `maps/map-${timestamp}-${randomString}.json`

    // Upload to MinIO
    await uploadFile(filePath, fileBuffer, 'application/geo+json')

    // Get the current max sortOrder and increment it
    const maxSortOrder = await prisma.maps.aggregate({
      _max: { sortOrder: true }
    })
    const nextSortOrder = (maxSortOrder._max.sortOrder || 0) + 1

    // Store in database
    const created = await prisma.maps.create({
      data: { 
        name, 
        geojsonPath: filePath,
        geojson: geojson, // Keep for backward compatibility
        sortOrder: nextSortOrder,
        color,
        ...(warna && { warna })
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

