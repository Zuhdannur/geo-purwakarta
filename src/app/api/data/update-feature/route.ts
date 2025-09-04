import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

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

    // Get the current data from KV storage
    const geoJsonData = await kv.get('rumah_komersil_data');
    
    if (!geoJsonData) {
      return NextResponse.json(
        { error: 'Data not found in storage' },
        { status: 404 }
      );
    }

    // Debug: Log available features
    console.log('GeoJSON Debug:', {
      totalFeatures: geoJsonData.features?.length || 0,
      firstFeatureProperties: geoJsonData.features?.[0]?.properties || {},
      featureIds: geoJsonData.features?.slice(0, 10).map((f: any) => ({
        OBJECTID: f.properties?.OBJECTID,
        Id: f.properties?.Id,
        id: f.properties?.id,
        OID_: f.properties?.OID_,
        ID: f.properties?.ID,
        allProps: Object.keys(f.properties || {})
      })) || []
    });

    // Debug: Search for features with specific OBJECTID values
    const featuresWithObjectId = geoJsonData.features
      .map((f: any, index: number) => ({ 
        index, 
        OBJECTID: f.properties?.OBJECTID,
        Id: f.properties?.Id 
      }))
      .filter((f: any) => f.OBJECTID !== undefined || f.Id !== undefined);
    
    console.log('Features with IDs:', featuresWithObjectId.slice(0, 20));
    
    // Debug: Look specifically for the featureId we're searching for
    const targetFeature = geoJsonData.features.find((f: any) => 
      f.properties?.OBJECTID === featureId || f.properties?.Id === featureId
    );
    
    if (targetFeature) {
      console.log(`Found feature with ID ${featureId}:`, {
        index: geoJsonData.features.indexOf(targetFeature),
        properties: targetFeature.properties
      });
    } else {
      console.log(`Feature with ID ${featureId} NOT FOUND in GeoJSON`);
      
      // Debug: Show what properties actually exist in the first few features
      console.log('Available properties in first 3 features:');
      geoJsonData.features.slice(0, 3).forEach((f: any, index: number) => {
        console.log(`Feature ${index}:`, Object.keys(f.properties || {}));
      });
    }

    // Debug: Log the specific featureId we're looking for
    console.log('Looking for featureId:', {
      featureId,
      featureIdType: typeof featureId,
      featureIdString: String(featureId)
    });

    // Find the feature to update
    let featureIndex = -1;
    let foundFeature = null;
    
    for (let i = 0; i < geoJsonData.features.length; i++) {
      const feature = geoJsonData.features[i];
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
    if (featureIndex === -1 && featureId >= 0 && featureId < geoJsonData.features.length) {
      console.log(`Trying to find feature by index: ${featureId}`);
      const featureByIndex = geoJsonData.features[featureId];
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

    // Update the feature properties
    const updatedFeature = {
      ...geoJsonData.features[featureIndex],
      properties: {
        ...geoJsonData.features[featureIndex].properties,
        ...properties
      }
    };

    // Replace the feature in the array
    geoJsonData.features[featureIndex] = updatedFeature;

    // Save the updated data back to KV storage
    await kv.set('rumah_komersil_data', geoJsonData);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Feature updated successfully',
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
