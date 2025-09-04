import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST() {
  try {
    // Get the current data from KV storage
    const geoJsonData = await kv.get('rumah_komersil_data');
    
    if (!geoJsonData) {
      return NextResponse.json(
        { error: 'Data not found in storage' },
        { status: 404 }
      );
    }
    
    // Reset all features to have only basic properties
    geoJsonData.features = geoJsonData.features.map((feature: any, index: number) => {
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

    // Save the reset data back to KV storage
    await kv.set('rumah_komersil_data', geoJsonData);

    return NextResponse.json({
      success: true,
      message: 'All properties reset successfully',
      totalFeatures: geoJsonData.features.length
    });

  } catch (error) {
    console.error('Error resetting properties:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
