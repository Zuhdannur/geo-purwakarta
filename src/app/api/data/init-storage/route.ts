import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST() {
  try {
    // Fetch the static GeoJSON data from the public directory
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/new data/rumah_komersil.geojson`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch GeoJSON data' },
        { status: 500 }
      );
    }

    const geoJsonData = await response.json();
    
    // Store the data in KV storage
    await kv.set('rumah_komersil_data', geoJsonData);
    
    return NextResponse.json({
      success: true,
      message: 'Data initialized in storage successfully',
      totalFeatures: geoJsonData.features?.length || 0
    });

  } catch (error) {
    console.error('Error initializing storage:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
