import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFileAsJson } from '@/lib/minio'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const kecamatan = searchParams.get('kecamatan')

    // Fetch the map with name "Peta Administrasi"
    const map = await prisma.maps.findFirst({
      where: {
        name: 'Peta Administrasi'
      }
    })

    if (!map) {
      return NextResponse.json({ error: 'Peta Administrasi not found' }, { status: 404 })
    }

    // Fetch GeoJSON from MinIO
    let geojson: any;

    console.log('map.geojsonPath', map.geojsonPath);
    if (map.geojsonPath) {
      try {
        geojson = await getFileAsJson(map.geojsonPath);
      } catch (error) {
        console.error(`Failed to fetch GeoJSON from MinIO for Peta Administrasi:`, error);
        return NextResponse.json({
          error: 'Failed to fetch GeoJSON from storage',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'GeoJSON path not configured' }, { status: 404 });
    }
    
    // Extract unique desa values from nama_desa property
    const desaSet = new Set<string>()
    
    if (geojson.features && Array.isArray(geojson.features)) {
      geojson.features.forEach((feature: any) => {
        if (feature.properties && feature.properties.nama_desa) {
          // If kecamatan filter is provided, only include desa from that kecamatan
          if (kecamatan) {
            if (feature.properties.nama_kec === kecamatan) {
              desaSet.add(feature.properties.nama_desa)
            }
          } else {
            desaSet.add(feature.properties.nama_desa)
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

