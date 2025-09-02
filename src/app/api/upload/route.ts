import { NextRequest, NextResponse } from 'next/server';
import shp from 'shpjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.zip')) {
      return NextResponse.json({ error: 'Please upload a zipped shapefile (.zip)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // shpjs expects a zip buffer for multi-file shapefile
    const geojson = await shp(buffer);

    // Normalize to FeatureCollection
    let featureCollection: any;
    if (geojson && geojson.type === 'FeatureCollection') {
      featureCollection = geojson;
    } else if (Array.isArray(geojson)) {
      featureCollection = {
        type: 'FeatureCollection',
        features: geojson.flatMap((g: any) => (g?.features || []))
      };
    } else if (geojson && geojson.type && geojson.geometry) {
      featureCollection = { type: 'FeatureCollection', features: [geojson] };
    } else {
      featureCollection = { type: 'FeatureCollection', features: [] };
    }

    return NextResponse.json({ geojson: featureCollection });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to parse shapefile' }, { status: 500 });
  }
}


