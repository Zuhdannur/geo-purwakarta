import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFileAsJson } from '@/lib/minio'

export async function GET() {
  try {
    // Fetch the map with name "Peta Administrasi"

    const map = await prisma.maps.findFirst({
      where: {
        name: 'Peta Adminsitrasi'
      }
    })

    if (!map) {
      return NextResponse.json({ error: 'Peta Administrasi not found' }, { status: 404 })
    }

    // Fetch GeoJSON from MinIO
    let geojson: any;

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

    // Extract unique kecamatan values from nama_kec property
    const kecamatanSet = new Set<string>()
    if (geojson && geojson.features && Array.isArray(geojson.features)) {
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
