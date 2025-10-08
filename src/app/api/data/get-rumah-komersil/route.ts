import { NextResponse } from 'next/server';
import { createClient } from 'redis';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Create Redis client
const redis = createClient({
  url: process.env.REDIS_URL
});

// Connect to Redis
redis.on('error', (err) => console.log('Redis Client Error', err));

export async function GET() {
  try {
    // Connect to Redis if not already connected
    if (!redis.isOpen) {
      await redis.connect();
    }

    // Get the data from Redis
    let geoJsonData = await redis.get('rumah_komersil_data');
    
    if (!geoJsonData) {
      // If no data in Redis, return the static file data
      // This ensures backward compatibility
      try {
        const filePath = join(process.cwd(), 'public', 'new data', 'rumah_komersil.geojson');
        const fileContent = await readFile(filePath, 'utf-8');
        const staticData = JSON.parse(fileContent);
        
        // Store it in Redis for future use
        await redis.set('rumah_komersil_data', JSON.stringify(staticData));
        
        return NextResponse.json(staticData);
      } catch (fileError) {
        return NextResponse.json(
          { error: 'Data file not found' },
          { status: 404 }
        );
      }
    }
    
    // Parse the JSON string from Redis
    geoJsonData = JSON.parse(geoJsonData);
    
    // Type guard to ensure geoJsonData has the expected structure
    if (!geoJsonData || typeof geoJsonData !== 'object' || !('features' in geoJsonData) || !Array.isArray((geoJsonData as any).features)) {
      return NextResponse.json(
        { error: 'Invalid GeoJSON data structure in Redis' },
        { status: 500 }
      );
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
