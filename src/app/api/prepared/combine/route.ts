import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import shp from 'shpjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const paths: unknown = body?.paths;
    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: 'paths must be a non-empty array' }, { status: 400 });
    }

    const basePublic = path.join(process.cwd(), 'public');
    const allFeatures: any[] = [];

    for (const rel of paths) {
      if (typeof rel !== 'string') continue;
      const absPath = path.join(basePublic, rel.replace(/^\/+/, ''));
      if (!absPath.startsWith(basePublic)) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
      }
      if (!fs.existsSync(absPath) || !absPath.toLowerCase().endsWith('.zip')) {
        return NextResponse.json({ error: `Zip not found: ${rel}` }, { status: 404 });
      }

      const buffer = fs.readFileSync(absPath);
      const gj = await shp(buffer);

      if (gj?.type === 'FeatureCollection') {
        allFeatures.push(...(gj.features || []));
      } else if (Array.isArray(gj)) {
        for (const part of gj) {
          if (part?.type === 'FeatureCollection') {
            allFeatures.push(...(part.features || []));
          } else if (part && part.type && part.geometry) {
            allFeatures.push(part);
          }
        }
      } else if (gj && gj.type && gj.geometry) {
        allFeatures.push(gj);
      }
    }

    const combined = {
      type: 'FeatureCollection',
      features: allFeatures
    };

    return NextResponse.json({ geojson: combined });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to combine' }, { status: 500 });
  }
}


