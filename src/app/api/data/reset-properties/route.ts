import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory storage for demo purposes
// In production, you should use Vercel KV or a database
let inMemoryData: any = null;

export async function POST() {
  try {
    // If we don't have data in memory, try to fetch it from the static file
    if (!inMemoryData) {
      try {
        const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/new data/rumah_komersil.geojson`);
        if (response.ok) {
          inMemoryData = await response.json();
        } else {
          return NextResponse.json(
            { error: 'Unable to load GeoJSON data' },
            { status: 500 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to load GeoJSON data' },
          { status: 500 }
        );
      }
    }
    
    // Reset all features to have only basic properties
    inMemoryData.features = inMemoryData.features.map((feature: any, index: number) => {
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

    // Note: In Vercel's serverless environment, we can't write to files
    // The data is stored in memory for the duration of this function execution
    // For persistent storage, you would need to use Vercel KV or a database

    return NextResponse.json({
      success: true,
      message: 'All properties reset successfully (stored in memory)',
      totalFeatures: inMemoryData.features.length,
      note: 'Data is stored in memory. For persistent storage, consider using Vercel KV or a database.'
    });

  } catch (error) {
    console.error('Error resetting properties:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
