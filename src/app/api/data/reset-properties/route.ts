import { NextResponse } from 'next/server';
import { createClient } from 'redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Create Redis client
const redis = createClient({
  url: process.env.REDIS_URL
});

// Connect to Redis
redis.on('error', (err) => console.log('Redis Client Error', err));

export async function POST() {
  try {
    // Connect to Redis if not already connected
    if (!redis.isOpen) {
      await redis.connect();
    }

    // Get data from Redis
    let geoJsonData = await redis.get('rumah_komersil_data');
    
    // If no data in Redis, load from static file and store it
    if (!geoJsonData) {
      try {
        const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/new data/rumah_komersil.geojson`);
        if (response.ok) {
          geoJsonData = await response.json();
          // Store the initial data in Redis
          await redis.set('rumah_komersil_data', JSON.stringify(geoJsonData));
        } else {
          return NextResponse.json(
            { error: 'Unable to load GeoJSON data' },
            { status: 500 }
          );
        }
      } catch (fetchError) {
        return NextResponse.json(
          { error: 'Failed to load GeoJSON data' },
          { status: 500 }
        );
      }
    } else {
      // Parse the JSON string from Redis
      geoJsonData = JSON.parse(geoJsonData);
    }
    
    // Type guard to ensure geoJsonData has the expected structure
    if (!geoJsonData || typeof geoJsonData !== 'object' || !('features' in geoJsonData) || !Array.isArray((geoJsonData as any).features)) {
      return NextResponse.json(
        { error: 'Invalid GeoJSON data structure' },
        { status: 500 }
      );
    }
    
    // Reset all features to have only basic properties
    (geoJsonData as any).features = (geoJsonData as any).features.map((feature: any, index: number) => {
      // Keep only essential properties
      const resetProperties = {
        feature_id: index + 1, // Keep incremental feature_id
        // Add any other essential properties you want to keep
      };
      
      return {
        ...feature,
        properties: resetProperties
      };
    });

    // Save the reset data back to Redis
    await redis.set('rumah_komersil_data', JSON.stringify(geoJsonData));

    return NextResponse.json({
      success: true,
      message: 'All properties reset successfully and saved to Redis Cloud',
      totalFeatures: (geoJsonData as any).features.length
    });

  } catch (error) {
    console.error('Error resetting properties:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
