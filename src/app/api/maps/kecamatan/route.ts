import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch the map with name "Peta Administrasi"
    const map = await prisma.maps.findFirst({
      where: {
        name: 'Peta Administrasi'
      },
      select: {
        geojson: true
      }
    })


    if (!map) {
      return NextResponse.json({ error: 'Peta Administrasi not found' }, { status: 404 })
    }

    const geojson = map.geojson as any
    
    // Extract unique kecamatan values from nama_kec property
    const kecamatanSet = new Set<string>()
    
    if (geojson.features && Array.isArray(geojson.features)) {
      geojson.features.forEach((feature: any) => {
        if (feature.properties && feature.properties.nama_kec) {
          kecamatanSet.add(feature.properties.nama_kec)
        }
      })
    }

    // Convert Set to sorted array
    const kecamatanList = Array.from(kecamatanSet).sort()

    return NextResponse.json({
      kecamatan: kecamatanList
    })
  } catch (error) {
    console.error('Failed to fetch kecamatan data:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch kecamatan data', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
