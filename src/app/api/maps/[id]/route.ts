import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadFile, getFileAsJson, deleteFile, ensureBucket } from '@/lib/minio'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  
  try {
    const map = await prisma.maps.findUnique({ 
      select: { 
        id: true, 
        name: true, 
        geojsonPath: true, 
        color: true, 
        warna: true, 
        createdAt: true, 
        updatedAt: true 
      }, 
      where: { id } 
    })
    
    if (!map) return NextResponse.json({ error: 'not found' }, { status: 404 })

    // Fetch GeoJSON from MinIO if geojsonPath exists
    let geojson = null;
    if (map.geojsonPath) {
      try {
        geojson = await getFileAsJson(map.geojsonPath);
      } catch (error) {
        console.error(`Failed to fetch GeoJSON from MinIO for map ${id}:`, error);
        return NextResponse.json({ error: 'GeoJSON file not found in storage' }, { status: 404 })
      }
    } else {
      return NextResponse.json({ error: 'GeoJSON path not configured' }, { status: 404 })
    }

    return NextResponse.json({
      id: map.id,
      name: map.name,
      geojson: geojson,
      color: map.color,
      warna: map.warna,
      createdAt: map.createdAt,
      updatedAt: map.updatedAt,
    })
  } catch (error) {
    console.error('Failed to fetch map:', error)
    return NextResponse.json({ 
      error: 'failed to fetch map', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  
  try {
    // Check if it's FormData (file upload) or JSON
    const contentType = req.headers.get('content-type') || ''
    let name: string | undefined
    let color: string | undefined
    let warna: string | undefined
    let file: File | null = null
    let geojson: any | undefined

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      name = formData.get('name') as string | undefined
      color = formData.get('color') as string | undefined
      warna = formData.get('warna') as string | undefined
      file = formData.get('file') as File | null
    } else {
      const body = await req.json()
      name = body.name
      color = body.color
      warna = body.warna
    }

    const data: any = {}
    
    if (typeof name === 'string') data.name = name
    if (typeof color === 'string') data.color = color
    if (typeof warna === 'string') data.warna = warna
    else if (warna === null) data.warna = null

    // Handle file upload
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.json') && file.type !== 'application/json' && file.type !== 'application/geo+json') {
        return NextResponse.json({ error: 'Invalid file type. Only JSON files are allowed.' }, { status: 400 })
      }

      // Read and parse the file
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const fileText = fileBuffer.toString('utf-8')
      
      try {
        geojson = JSON.parse(fileText)
      } catch (error) {
        return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 })
      }

      // Validate it's a GeoJSON
      if (geojson.type !== 'FeatureCollection' && geojson.type !== 'Feature' && geojson.type !== 'GeometryCollection') {
        return NextResponse.json({ error: 'Invalid GeoJSON format' }, { status: 400 })
      }

      // Get existing map to delete old file
      const existingMap = await prisma.maps.findUnique({ 
        where: { id },
        select: { geojsonPath: true }
      })

      // Ensure MinIO bucket exists
      await ensureBucket()

      // Generate new file path
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const filePath = `maps/map-${timestamp}-${randomString}.json`

      // Upload to MinIO
      await uploadFile(filePath, fileBuffer, 'application/geo+json')

      // Delete old file from MinIO if it exists
      if (existingMap?.geojsonPath) {
        try {
          await deleteFile(existingMap.geojsonPath)
        } catch (error) {
          console.error(`Failed to delete old file ${existingMap.geojsonPath}:`, error)
          // Continue even if deletion fails
        }
      }

      data.geojsonPath = filePath
    }

    const updated = await prisma.maps.update({
      where: { id },
      data,
      select: { id: true, name: true, color: true, warna: true, createdAt: true, updatedAt: true },
    })
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update map:', error)
    return NextResponse.json({ 
      error: 'failed to update map',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  
  try {
    // Get the map to find the file path
    const map = await prisma.maps.findUnique({ 
      where: { id },
      select: { geojsonPath: true }
    })

    // Delete from database
    await prisma.maps.delete({ where: { id } })

    // Delete file from MinIO if it exists
    if (map?.geojsonPath) {
      try {
        await deleteFile(map.geojsonPath)
      } catch (error) {
        console.error(`Failed to delete file ${map.geojsonPath} from MinIO:`, error)
        // Continue even if deletion fails
      }
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete map:', error)
    return NextResponse.json({ 
      error: 'failed to delete map',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

