import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const kecamatan = searchParams.get('kecamatan')

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
    
    // Extract unique desa values from WADMKD property
    const desaSet = new Set<string>()
    
    if (geojson.features && Array.isArray(geojson.features)) {
      geojson.features.forEach((feature: any) => {
        if (feature.properties && feature.properties.WADMKD) {
          // If kecamatan filter is provided, only include desa from that kecamatan
          if (kecamatan) {
            if (feature.properties.WADMKC === kecamatan) {
              desaSet.add(feature.properties.WADMKD)
            }
          } else {
            desaSet.add(feature.properties.WADMKD)
          }
        }
      })
    }

    // Convert Set to sorted array
    const desaList = Array.from(desaSet).sort()

    return NextResponse.json({
      desa: desaList,
      kecamatan: kecamatan || 'all'
    })
  } catch (error) {
    console.error('Failed to fetch desa data:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch desa data', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

