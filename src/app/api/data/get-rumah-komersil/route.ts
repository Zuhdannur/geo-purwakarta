import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    // Get the data from KV storage
    const geoJsonData = await kv.get('rumah_komersil_data');
    
    if (!geoJsonData) {
      // If no data in KV storage, return the static file data
      // This ensures backward compatibility
      const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/new data/rumah_komersil.geojson`);
      
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Data not found' },
          { status: 404 }
        );
      }

      const staticData = await response.json();
      
      // Store it in KV for future use
      await kv.set('rumah_komersil_data', staticData);
      
      return NextResponse.json(staticData);
    }
    
    return NextResponse.json(geoJsonData);

  } catch (error) {
    console.error('Error getting data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
