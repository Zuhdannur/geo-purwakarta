'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import FeatureDrawer from './FeatureDrawer';
import Legend from './Legend';
import LayerSelector from './LayerSelector';

interface MapProps {
  activeMenu: string | null;
  selectedLayers: string[];
  setSelectedLayers: (layers: string[]) => void;
  showBaseMap: boolean;
  setShowBaseMap: (show: boolean) => void;
  selectedKecamatan: string;
  selectedKelurahan: string;
}

// Layer configurations based on the original index.html
const layerConfigs = {
  'layer-administrasi': {
    file: '/new data/layer_administrasi.geojson',
    color: '#4a90e2',
    name: 'Layer Administrasi',
    colorBy: 'WADMKC',
    colorScheme: {
      'Purwakarta': { fill: '#FF6B6B', outline: '#CC5555' },
      'Plered': { fill: '#4ECDC4', outline: '#3EA89F' },
      'Darangdan': { fill: '#45B7D1', outline: '#3692A8' },
      'Wanayasa': { fill: '#96CEB4', outline: '#7AB89A' },
      'Tegalwaru': { fill: '#FFEAA7', outline: '#E6D396' },
      'Jatiluhur': { fill: '#DDA0DD', outline: '#C88BC8' },
      'Sukatani': { fill: '#98D8C8', outline: '#7BC4B4' },
      'Maniis': { fill: '#F7DC6F', outline: '#E4C95C' },
      'Pasawahan': { fill: '#BB8FCE', outline: '#A67BB8' },
      'Bojong': { fill: '#85C1E9', outline: '#6BA8D0' },
      'Babakancikao': { fill: '#F8C471', outline: '#E5B15E' },
      'Bungursari': { fill: '#82E0AA', outline: '#6FCD97' },
      'Campaka': { fill: '#F1948A', outline: '#DE8177' },
      'Cibatu': { fill: '#85C1E9', outline: '#6BA8D0' },
      'Cikarang': { fill: '#F7DC6F', outline: '#E4C95C' },
      'Cipeundeuy': { fill: '#BB8FCE', outline: '#A67BB8' },
      'Cipicung': { fill: '#82E0AA', outline: '#6FCD97' },
      'Cisaat': { fill: '#F1948A', outline: '#DE8177' },
      'Cisarua': { fill: '#85C1E9', outline: '#6BA8D0' },
      'Ciwangi': { fill: '#F7DC6F', outline: '#E4C95C' },
      'Kiarapedes': { fill: '#BB8FCE', outline: '#A67BB8' },
      'Pondoksalam': { fill: '#82E0AA', outline: '#6FCD97' },
      'Sukasari': { fill: '#F1948A', outline: '#DE8177' },
      'default': { fill: '#4a90e2', outline: '#357abd' }
    }
  }
};

// Component to handle layer updates
function LayerController({ 
  selectedLayers, 
  onFeatureClick,
  selectedKecamatan,
  selectedKelurahan
}: { 
  selectedLayers: string[];
  onFeatureClick: (featureData: any, layerName: string) => void;
  selectedKecamatan: string;
  selectedKelurahan: string;
}) {
  const map = useMap();
  const [layers, setLayers] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [L, setL] = useState<any>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [administrativeData, setAdministrativeData] = useState<any>(null);

  useEffect(() => {
    // Import Leaflet only on client side
    if (typeof window !== 'undefined') {
      const Leaflet = require('leaflet');
      setL(Leaflet);
    }
  }, []);

  useEffect(() => {
    if (!L || !map) return;

    // Load administrative data for camera movement
    if (!administrativeData) {
      loadAdministrativeData();
    }

    // Load new layers
    selectedLayers.forEach(layerId => {
      if (!layers[layerId] && !loading[layerId] && layerConfigs[layerId as keyof typeof layerConfigs]) {
        loadLayer(layerId);
      }
    });

    // Remove unselected layers
    Object.keys(layers).forEach(layerId => {
      if (!selectedLayers.includes(layerId)) {
        if (layers[layerId]) {
          // Clean up label markers
          if (layers[layerId].labelMarkers) {
            layers[layerId].labelMarkers.forEach((marker: any) => {
              map.removeLayer(marker);
            });
          }
          
          // Reset selected feature if it's being removed
          if (selectedFeature === layers[layerId]) {
            setSelectedFeature(null);
          }
          
          map.removeLayer(layers[layerId]);
          setLayers(prev => {
            const newLayers = { ...prev };
            delete newLayers[layerId];
            return newLayers;
          });
        }
      }
    });
  }, [selectedLayers, layers, loading, map, L, onFeatureClick, administrativeData]);

  // Effect to handle administrative area selection and camera movement
  useEffect(() => {
    if (!map || !administrativeData) return;

    // Handle Kecamatan selection
    if (selectedKecamatan && selectedKecamatan !== 'All Kecamatan') {
      const kecamatanFeatures = administrativeData.features.filter((feature: any) => 
        feature.properties.WADMKC === selectedKecamatan
      );
      
      if (kecamatanFeatures.length > 0) {
        moveCameraToFeatures(kecamatanFeatures);
      }
    }
    // Handle Kelurahan selection
    else if (selectedKelurahan && selectedKelurahan !== 'All Kelurahan/Desa') {
      const kelurahanFeatures = administrativeData.features.filter((feature: any) => 
        feature.properties.WADMKD === selectedKelurahan
      );
      
      if (kelurahanFeatures.length > 0) {
        moveCameraToFeatures(kelurahanFeatures);
      }
    }
  }, [selectedKecamatan, selectedKelurahan, map, administrativeData]);

  const loadAdministrativeData = async () => {
    try {
      const response = await fetch('/new data/layer_administrasi.geojson');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const transformedData = transformCoordinates(data);
      setAdministrativeData(transformedData);
    } catch (error) {
      console.error('Error loading administrative data:', error);
    }
  };

  const moveCameraToFeatures = (features: any[]) => {
    if (!map || !L || features.length === 0) return;

    try {
      // Create a temporary layer to calculate bounds
      const tempLayer = L.geoJSON({ type: 'FeatureCollection', features });
      const bounds = tempLayer.getBounds();
      
      // Check if bounds are valid
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [20, 20],
          maxZoom: 15,
          animate: true,
          duration: 1
        });
      }
    } catch (error) {
      console.error('Error moving camera to features:', error);
    }
  };

  const loadLayer = async (layerId: string) => {
    if (!L || !map) return;
    
    const config = layerConfigs[layerId as keyof typeof layerConfigs];
    if (!config) return;

    setLoading(prev => ({ ...prev, [layerId]: true }));

    try {
      const response = await fetch(config.file);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const transformedData = transformCoordinates(data);

      // Create individual feature layers for proper isolation
      const featureLayers: any[] = [];
      
      transformedData.features.forEach((feature: any) => {
        const propertyValue = feature.properties[config.colorBy];
        const colorScheme = config.colorScheme[propertyValue as keyof typeof config.colorScheme] || config.colorScheme.default;
        
        // Make administrative layer more transparent to show other layers
        const fillOpacity = layerId === 'layer-administrasi' ? 0.3 : 0.8;
        
        const featureLayer = L.geoJSON(feature, {
          style: {
            fillColor: colorScheme.fill,
            weight: layerId === 'layer-administrasi' ? 1 : 2,
            opacity: 1,
            color: colorScheme.outline,
            fillOpacity: fillOpacity
          }
        });
        
        // Store layerId and original color with the feature layer
        featureLayer.layerId = layerId;
        featureLayer.originalColor = colorScheme.fill;
        featureLayer.featureProperties = feature.properties;
        
        // Add center labels to the polygon for administrative layer
        if (feature.geometry && feature.geometry.coordinates && layerId === 'layer-administrasi') {
          const center = getPolygonCenter(feature.geometry.coordinates);
          
          if (center && Array.isArray(center) && center.length === 2 && 
              !isNaN(center[0]) && !isNaN(center[1]) && 
              isFinite(center[0]) && isFinite(center[1])) {
            
            // Create labels for both Kecamatan (WADMKC) and Kelurahan/Desa (WADMKD)
            const kecamatanName = feature.properties.WADMKC || '';
            const kelurahanName = feature.properties.WADMKD || '';
            
            // Create Kecamatan label (larger, more prominent)
            if (kecamatanName) {
              const kecamatanLabelIcon = L.divIcon({
                className: 'kecamatan-label',
                html: `<div style="background: rgba(255, 255, 255, 0.95); padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; color: #1a1a1a; border: 2px solid #4a90e2; box-shadow: 0 3px 6px rgba(0,0,0,0.3); white-space: nowrap; text-align: center; pointer-events: none; text-shadow: 1px 1px 2px rgba(255,255,255,0.8);">${kecamatanName}</div>`,
                iconSize: [150, 30],
                iconAnchor: [75, 15]
              });
              
              const kecamatanLabelMarker = L.marker(center, {
                icon: kecamatanLabelIcon,
                interactive: false,
                zIndexOffset: 9999
              });
              
              // Force the label to be on top
              kecamatanLabelMarker.setZIndexOffset(9999);
              map.addLayer(kecamatanLabelMarker);
              
              // Store the label marker with the feature layer for cleanup
              if (!featureLayer.labelMarkers) featureLayer.labelMarkers = [];
              featureLayer.labelMarkers.push(kecamatanLabelMarker);
            }
            
            // Create Kelurahan/Desa label (smaller, positioned slightly below Kecamatan)
            if (kelurahanName && kelurahanName !== kecamatanName) {
              // Calculate offset position for Kelurahan label (slightly below center)
              const kelurahanCenter = [center[0], center[1] - 0.002]; // Small offset
              
              const kelurahanLabelIcon = L.divIcon({
                className: 'kelurahan-label',
                html: `<div style="background: rgba(255, 255, 255, 0.9); padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; color: #666; border: 1px solid #ccc; box-shadow: 0 2px 4px rgba(0,0,0,0.2); white-space: nowrap; text-align: center; pointer-events: none;">${kelurahanName}</div>`,
                iconSize: [120, 24],
                iconAnchor: [60, 12]
              });
              
              const kelurahanLabelMarker = L.marker(kelurahanCenter, {
                icon: kelurahanLabelIcon,
                interactive: false,
                zIndexOffset: 9998
              });
              
              // Force the label to be on top
              kelurahanLabelMarker.setZIndexOffset(9998);
              map.addLayer(kelurahanLabelMarker);
              
              // Store the label marker with the feature layer for cleanup
              if (!featureLayer.labelMarkers) featureLayer.labelMarkers = [];
              featureLayer.labelMarkers.push(kelurahanLabelMarker);
            }
          }
        }

        // Add click event for this individual feature
        featureLayer.on('click', () => {
          console.log(`${config.name} feature clicked:`, feature.properties);
          onFeatureClick(feature.properties, config.name);
          
          // Add center labels to the polygon for administrative layer
          if (feature.geometry && feature.geometry.coordinates && layerId === 'layer-administrasi') {
            const center = getPolygonCenter(feature.geometry.coordinates);
            
            // Debug: Log the feature properties and calculated center
            console.log('Feature:', feature.properties.WADMKC || feature.properties.WADMKD, 'Center:', center, 'Coords structure:', feature.geometry.coordinates.length, 'First coord sample:', feature.geometry.coordinates[0]?.[0]?.slice(0, 3));
            
            if (center && Array.isArray(center) && center.length === 2 && 
                !isNaN(center[0]) && !isNaN(center[1]) && 
                isFinite(center[0]) && isFinite(center[1])) {
              
              // Create labels for both Kecamatan (WADMKC) and Kelurahan/Desa (WADMKD)
              const kecamatanName = feature.properties.WADMKC || '';
              const kelurahanName = feature.properties.WADMKD || '';
              

              
              // Create Kecamatan label (larger, more prominent)
              if (kecamatanName) {
                const kecamatanLabelIcon = L.divIcon({
                  className: 'kecamatan-label',
                  html: `<div style="background: rgba(255, 255, 255, 0.95); padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; color: #1a1a1a; border: 2px solid #4a90e2; box-shadow: 0 3px 6px rgba(0,0,0,0.3); white-space: nowrap; text-align: center; pointer-events: none; text-shadow: 1px 1px 2px rgba(255,255,255,0.8);">${kecamatanName}</div>`,
                  iconSize: [150, 30],
                  iconAnchor: [75, 15]
                });
                
                const kecamatanLabelMarker = L.marker(center, {
                  icon: kecamatanLabelIcon,
                  interactive: false,
                  zIndexOffset: 9999
                });
                
                // Force the label to be on top
                kecamatanLabelMarker.setZIndexOffset(9999);
                map.addLayer(kecamatanLabelMarker);
                
                // Store the label marker with the feature layer for cleanup
                if (!featureLayer.labelMarkers) featureLayer.labelMarkers = [];
                featureLayer.labelMarkers.push(kecamatanLabelMarker);
              }
              
              // Create Kelurahan/Desa label (smaller, positioned slightly below Kecamatan)
              if (kelurahanName && kelurahanName !== kecamatanName) {
                // Calculate offset position for Kelurahan label (slightly below center)
                const kelurahanCenter = [center[0], center[1] - 0.002]; // Small offset
                
                const kelurahanLabelIcon = L.divIcon({
                  className: 'kelurahan-label',
                  html: `<div style="background: rgba(255, 255, 255, 0.9); padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; color: #666; border: 1px solid #ccc; box-shadow: 0 2px 4px rgba(0,0,0,0.2); white-space: nowrap; text-align: center; pointer-events: none;">${kelurahanName}</div>`,
                  iconSize: [120, 24],
                  iconAnchor: [60, 12]
                });
                
                const kelurahanLabelMarker = L.marker(kelurahanCenter, {
                  icon: kelurahanLabelIcon,
                  interactive: false,
                  zIndexOffset: 9998
                });
                
                // Force the label to be on top
                kelurahanLabelMarker.setZIndexOffset(9998);
                map.addLayer(kelurahanLabelMarker);
                
                // Store the label marker with the feature layer for cleanup
                if (!featureLayer.labelMarkers) featureLayer.labelMarkers = [];
                featureLayer.labelMarkers.push(kelurahanLabelMarker);
              }
            }
          }

          featureLayer.on('click', () => {
            console.log(`${config.name} feature clicked:`, feature.properties);
            onFeatureClick(feature.properties, config.name);
            
            // Reset previously selected feature to normal style
            if (selectedFeature && selectedFeature !== featureLayer) {
              const originalColor = selectedFeature.originalColor || selectedFeature.options.fillColor;
              const isAdminLayer = selectedFeature.layerId === 'layer-administrasi';
              selectedFeature.setStyle({ 
                fillColor: originalColor,
                weight: isAdminLayer ? 1 : 2,
                fillOpacity: isAdminLayer ? 0.3 : 0.8
              });
              
              // Reset label styling for previously selected feature
              if (selectedFeature.labelMarkers) {
                selectedFeature.labelMarkers.forEach((marker: any) => {
                  const labelDiv = marker.getElement();
                  if (labelDiv) {
                    const isAdminLayer = selectedFeature.layerId === 'layer-administrasi';
                    labelDiv.style.opacity = isAdminLayer ? '0.9' : '0.7';
                    labelDiv.style.transform = 'scale(1)';
                    labelDiv.style.transition = 'all 0.3s ease';
                    // Reset label styling to default
                    if (marker.getElement().classList.contains('kecamatan-label')) {
                      labelDiv.style.border = '2px solid #4a90e2';
                      labelDiv.style.background = 'rgba(255, 255, 255, 0.95)';
                    }
                  }
                });
              }
            }
            
            // Store original color if not already stored
            if (!featureLayer.originalColor) {
              featureLayer.originalColor = featureLayer.options.fillColor;
            }
            
            // Make selected feature darker (reduce brightness by 30%)
            const originalColor = featureLayer.originalColor;
            const darkerColor = makeColorDarker(originalColor, 0.3);
            const isAdminLayer = layerId === 'layer-administrasi';
            
            featureLayer.setStyle({ 
              fillColor: darkerColor,
              fillOpacity: isAdminLayer ? 0.8 : 0.9,
              weight: isAdminLayer ? 3 : 4
            });
            
            // Highlight the labels for clicked feature
            if (featureLayer.labelMarkers) {
              featureLayer.labelMarkers.forEach((marker: any) => {
                const labelDiv = marker.getElement();
                if (labelDiv) {
                  labelDiv.style.opacity = '1';
                  labelDiv.style.transform = 'scale(1.1)';
                  labelDiv.style.transition = 'all 0.3s ease';
                  // Add highlight effect for selected feature
                  if (marker.getElement().classList.contains('kecamatan-label')) {
                    labelDiv.style.border = '2px solid #ff6b6b';
                    labelDiv.style.background = 'rgba(255, 255, 255, 1)';
                  }
                }
              });
            }
            
            // Update selected feature
            setSelectedFeature(featureLayer);
          });

          featureLayer.on('mouseover', () => {
            // Only apply hover effect if this feature is not currently selected
            if (selectedFeature !== featureLayer) {
              const originalColor = featureLayer.originalColor || featureLayer.options.fillColor;
              const isAdminLayer = layerId === 'layer-administrasi';
              featureLayer.setStyle({ 
                weight: isAdminLayer ? 2 : 4,
                fillOpacity: isAdminLayer ? 0.6 : 0.9,
                fillColor: originalColor
              });
            }
            
            // Highlight labels on hover
            if (featureLayer.labelMarkers) {
              featureLayer.labelMarkers.forEach((marker: any) => {
                const labelDiv = marker.getElement();
                if (labelDiv) {
                  labelDiv.style.opacity = '1';
                  labelDiv.style.transform = 'scale(1.05)';
                  labelDiv.style.transition = 'all 0.2s ease';
                  // Add hover effect for labels
                  if (marker.getElement().classList.contains('kecamatan-label')) {
                    labelDiv.style.border = '2px solid #4a90e2';
                    labelDiv.style.background = 'rgba(255, 255, 255, 1)';
                  }
                }
              });
            }
          });

          featureLayer.on('mouseout', () => {
            // Only reset if this feature is not currently selected
            if (selectedFeature !== featureLayer) {
              const originalColor = featureLayer.originalColor || featureLayer.options.fillColor;
              const isAdminLayer = layerId === 'layer-administrasi';
              featureLayer.setStyle({ 
                weight: isAdminLayer ? 1 : 2,
                fillOpacity: isAdminLayer ? 0.3 : 0.8,
                fillColor: originalColor
              });
            }
            
            // Reset labels on mouseout
            if (featureLayer.labelMarkers) {
              featureLayer.labelMarkers.forEach((marker: any) => {
                const labelDiv = marker.getElement();
                if (labelDiv) {
                  const isAdminLayer = layerId === 'layer-administrasi';
                  labelDiv.style.opacity = isAdminLayer ? '0.9' : '0.7';
                  labelDiv.style.transform = 'scale(1)';
                  labelDiv.style.transition = 'all 0.2s ease';
                  // Reset label styling
                  if (marker.getElement().classList.contains('kecamatan-label')) {
                    labelDiv.style.border = '2px solid #4a90e2';
                    labelDiv.style.background = 'rgba(255, 255, 255, 0.95)';
                  }
                }
              });
            }
          });

          // Add this individual feature layer to the map
          map.addLayer(featureLayer);
          featureLayers.push(featureLayer);
        });

        // Store all feature layers for this layer ID
        setLayers(prev => ({ ...prev, [layerId]: featureLayers }));
    } catch (error) {
      console.error(`Error loading ${config.name}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [layerId]: false }));
    }
  };

  return null;
}

// No transformation needed - coordinates are already in WGS84 format
function transformCoordinates(data: any) {
  // Your GeoJSON data is already in WGS84 format (longitude/latitude)
  // No transformation needed, just return the data as-is
  return data;
}

// Helper to make a color darker
function makeColorDarker(color: string, factor: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    
    const darkerR = Math.max(0, Math.floor(r * (1 - factor)));
    const darkerG = Math.max(0, Math.floor(g * (1 - factor)));
    const darkerB = Math.max(0, Math.floor(b * (1 - factor)));
    
    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
  }
  
  // Handle rgb colors
  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      const r = parseInt(matches[0]);
      const g = parseInt(matches[1]);
      const b = parseInt(matches[2]);
      
      const darkerR = Math.max(0, Math.floor(r * (1 - factor)));
      const darkerG = Math.max(0, Math.floor(g * (1 - factor)));
      const darkerB = Math.max(0, Math.floor(b * (1 - factor)));
      
      return `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
    }
  }
  
  // Fallback to original color
  return color;
}

// Helper to get the center of a polygon (handles both Polygon and MultiPolygon)
function getPolygonCenter(coordinates: any) {
  if (!coordinates || coordinates.length === 0) return null;

  // Handle MultiPolygon coordinates (extra nesting level)
  const polygons = Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0]) ? coordinates : [coordinates];
  
  let totalArea = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (const polygon of polygons) {
    // Use the first ring (exterior boundary) for centroid calculation
    const ring = polygon[0];
    if (!ring || ring.length < 3) continue;

    // Calculate centroid using shoelace formula
    let area = 0;
    let centroidX = 0;
    let centroidY = 0;

    for (let i = 0; i < ring.length - 1; i++) {
      const coord1 = ring[i];
      const coord2 = ring[i + 1];
      
      // Extract longitude and latitude (first two values)
      const x1 = coord1[0]; // longitude
      const y1 = coord1[1]; // latitude
      const x2 = coord2[0]; // longitude
      const y2 = coord2[1]; // latitude
      
      if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2) || 
          !isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) {
        continue;
      }

      const cross = x1 * y2 - x2 * y1;
      area += cross;
      centroidX += (x1 + x2) * cross;
      centroidY += (y1 + y2) * cross;
    }

    if (Math.abs(area) > 1e-10) {
      area /= 2;
      centroidX /= (6 * area);
      centroidY /= (6 * area);
      
      totalArea += Math.abs(area);
      weightedX += centroidX * Math.abs(area);
      weightedY += centroidY * Math.abs(area);
    }
  }

  if (totalArea > 0) {
    const finalX = weightedX / totalArea;
    const finalY = weightedY / totalArea;
    
    // Validate the result
    if (!isNaN(finalX) && !isNaN(finalY) && isFinite(finalX) && isFinite(finalY)) {
      return [finalX, finalY];
    }
  }

  // Fallback to bounding box center if centroid calculation fails
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let validCoords = 0;

  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (const coord of ring) {
        if (Array.isArray(coord) && coord.length >= 2) {
          const x = coord[0]; // longitude
          const y = coord[1]; // latitude
          
          if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            validCoords++;
          }
        }
      }
    }
  }

  if (validCoords > 0 && isFinite(minX) && isFinite(maxX) && isFinite(minY) && isFinite(maxY)) {
    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;
    
    if (!isNaN(centerX) && !isNaN(centerY) && isFinite(centerX) && isFinite(centerY)) {
      return [centerX, centerY];
    }
  }

  return null;
}

// Main Map component with SSR handling
export default function Map(props: MapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="w-full h-full bg-gray-100 flex items-center justify-center">Loading map...</div>;
  }

  return <ClientMap {...props} />;
}

// Client-only map component
function ClientMap({ activeMenu, selectedLayers, setSelectedLayers, showBaseMap, setShowBaseMap, selectedKecamatan, selectedKelurahan }: MapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [featureDrawer, setFeatureDrawer] = useState<{
    isOpen: boolean;
    featureData: any;
    layerName: string;
  }>({
    isOpen: false,
    featureData: null,
    layerName: ''
  });

  const handleFeatureClick = (featureData: any, layerName: string) => {
    setFeatureDrawer({
      isOpen: true,
      featureData,
      layerName
    });
  };

  const closeFeatureDrawer = () => {
    setFeatureDrawer({
      isOpen: false,
      featureData: null,
      layerName: ''
    });
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[-6.5569, 107.4439]}
        zoom={10}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={true}
        whenReady={() => setMapReady(true)}
      >
        {showBaseMap && (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap contributors'
          />
        )}
        
        {mapReady && (
          <LayerController 
            selectedLayers={selectedLayers} 
            onFeatureClick={handleFeatureClick}
            selectedKecamatan={selectedKecamatan}
            selectedKelurahan={selectedKelurahan}
          />
        )}
      </MapContainer>

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm">
        <div>Selected Layers: {selectedLayers.length}</div>
        <div>Active Menu: {activeMenu || 'None'}</div>
        {featureDrawer.isOpen && (
          <div className="mt-1 text-blue-300">
            Feature selected: {featureDrawer.layerName}
          </div>
        )}
        {featureDrawer.isOpen && (
          <div className="mt-1 text-green-300 text-xs">
            💡 Map remains interactive - click features to view details
          </div>
        )}
      </div>

      {/* Layer Selector */}
      <LayerSelector 
        selectedLayers={selectedLayers}
        setSelectedLayers={setSelectedLayers}
        showBaseMap={showBaseMap}
        setShowBaseMap={setShowBaseMap}
      />

      {/* Legend */}
      <Legend 
        selectedLayers={selectedLayers} 
        selectedFeature={featureDrawer.isOpen ? {
          layerName: featureDrawer.layerName,
          properties: featureDrawer.featureData
        } : null}
      />

      {/* Map Overlay Indicator when drawer is open */}
      {featureDrawer.isOpen && (
        <div className="absolute inset-0 pointer-events-none z-[9997]">
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Map is interactive</span>
            </div>
          </div>
        </div>
      )}

      {/* Feature Drawer */}
      <FeatureDrawer
        isOpen={featureDrawer.isOpen}
        onClose={closeFeatureDrawer}
        featureData={featureDrawer.featureData}
        layerName={featureDrawer.layerName}
      />
    </div>
  );
} 