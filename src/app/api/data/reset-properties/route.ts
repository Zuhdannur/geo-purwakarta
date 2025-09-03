import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'new data', 'rumah_komersil.geojson');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read the current GeoJSON file
    const geoJsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
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

    // Write the reset data back to the file
    fs.writeFileSync(filePath, JSON.stringify(geoJsonData, null, 2), 'utf-8');

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
