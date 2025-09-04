import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Create Redis client
const redis = createClient({
  url: process.env.REDIS_URL
});

// Connect to Redis
redis.on('error', (err) => console.log('Redis Client Error', err));

export async function POST(request: NextRequest) {
  try {
    // Connect to Redis if not already connected
    if (!redis.isOpen) {
      await redis.connect();
    }

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

    // Find the feature to update
    let featureIndex = -1;
    
    for (let i = 0; i < (geoJsonData as any).features.length; i++) {
      const feature = (geoJsonData as any).features[i];
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
    if (featureIndex === -1 && featureId >= 0 && featureId < (geoJsonData as any).features.length) {
      console.log(`Trying to find feature by index: ${featureId}`);
      const featureByIndex = (geoJsonData as any).features[featureId];
      if (featureByIndex) {
        featureIndex = featureId;
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

    // Update the feature properties
    const updatedFeature = {
      ...(geoJsonData as any).features[featureIndex],
      properties: {
        ...(geoJsonData as any).features[featureIndex].properties,
        ...properties
      }
    };

    // Replace the feature in the array
    (geoJsonData as any).features[featureIndex] = updatedFeature;

    // Save the updated data back to Redis
    await redis.set('rumah_komersil_data', JSON.stringify(geoJsonData));

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Feature updated successfully and saved to Redis Cloud',
      featureId,
      updatedProperties: properties
    });

  } catch (error) {
    console.error('Error updating feature:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
