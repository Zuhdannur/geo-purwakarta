import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory storage for demo purposes
// In production, you should use Vercel KV or a database
let inMemoryData: any = null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { featureId, layerId, properties } = body;

    // Debug logging
    console.log('API Update Feature Debug:', {
      receivedFeatureId: featureId,
      receivedLayerId: layerId,
      propertiesKeys: Object.keys(properties || {}),
      featureIdType: typeof featureId,
      featureIdValue: featureId
    });

    if (!featureId || !layerId || !properties) {
      return NextResponse.json(
        { error: 'Missing required fields: featureId, layerId, or properties' },
        { status: 400 }
      );
    }

    // Only allow updates to commercial buildings layer for security
    if (layerId !== 'layer-sebaran-rumah-komersil') {
      return NextResponse.json(
        { error: 'Only commercial buildings layer can be updated' },
        { status: 403 }
      );
    }

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

    // Find the feature to update
    let featureIndex = -1;
    let foundFeature = null;
    
    for (let i = 0; i < inMemoryData.features.length; i++) {
      const feature = inMemoryData.features[i];
      const props = feature.properties || {};
      
      // Check all possible ID matches (including string conversions)
      const matches = [
        props.feature_id === featureId,
        props.OBJECTID === featureId,
        props.Id === featureId,
        props.id === featureId,
        props.OID_ === featureId,
        props.ID === featureId,
        String(props.feature_id) === String(featureId),
        String(props.OBJECTID) === String(featureId),
        String(props.Id) === String(featureId),
        String(props.id) === String(featureId),
        String(props.OID_) === String(featureId),
        String(props.ID) === String(featureId)
      ];
      
      if (matches.some(match => match)) {
        featureIndex = i;
        foundFeature = feature;
        console.log(`Feature found at index ${i}:`, {
          featureProps: props,
          matchingId: featureId,
          matchType: matches.findIndex(match => match),
          feature_id: props.feature_id
        });
        break;
      }
    }
    
    // If still not found, try to find by index (featureId might be the array index)
    if (featureIndex === -1 && featureId >= 0 && featureId < inMemoryData.features.length) {
      console.log(`Trying to find feature by index: ${featureId}`);
      const featureByIndex = inMemoryData.features[featureId];
      if (featureByIndex) {
        featureIndex = featureId;
        foundFeature = featureByIndex;
        console.log(`Feature found by index ${featureId}:`, {
          featureProps: featureByIndex.properties
        });
      }
    }

    if (featureIndex === -1) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    // Update the feature properties in memory
    const updatedFeature = {
      ...inMemoryData.features[featureIndex],
      properties: {
        ...inMemoryData.features[featureIndex].properties,
        ...properties
      }
    };

    // Replace the feature in the array
    inMemoryData.features[featureIndex] = updatedFeature;

    // Note: In Vercel's serverless environment, we can't write to files
    // The data is stored in memory for the duration of this function execution
    // For persistent storage, you would need to use Vercel KV or a database

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Feature updated successfully (stored in memory)',
      featureId,
      updatedProperties: properties,
      note: 'Data is stored in memory. For persistent storage, consider using Vercel KV or a database.'
    });

  } catch (error) {
    console.error('Error updating feature:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
