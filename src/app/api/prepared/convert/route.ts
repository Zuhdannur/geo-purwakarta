import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import shp from 'shpjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const relPath: string | undefined = body?.path;
    if (!relPath || typeof relPath !== 'string') {
      return NextResponse.json({ error: 'path is required' }, { status: 400 });
    }

    // Ensure it points under public
    const basePublic = path.join(process.cwd(), 'public');
    const absPath = path.join(basePublic, relPath.replace(/^\/+/, ''));
    if (!absPath.startsWith(basePublic)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
    if (!fs.existsSync(absPath) || !absPath.toLowerCase().endsWith('.zip')) {
      return NextResponse.json({ error: 'Zip not found' }, { status: 404 });
    }

    const buffer = fs.readFileSync(absPath);
    const geojson = await shp(buffer);

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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to convert' }, { status: 500 });
  }
}


