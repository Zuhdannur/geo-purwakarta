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
}

// Layer configurations based on the original index.html
const layerConfigs = {
  'sebaran-rumah-komersil': {
    file: '/data/data.geojson', // Using existing data file for commercial houses
    color: '#ff4444',
    name: 'Sebaran Rumah Komersil',
    colorBy: 'JENIS',
    colorScheme: {
      'Sawah': { fill: '#90EE90', outline: '#228B22' },
      'Ladang': { fill: '#8B4513', outline: '#654321' },
      'Tegalan': { fill: '#D2B48C', outline: '#A0522D' },
      'Kebun': { fill: '#6B8E23', outline: '#556B2F' },
      'Hutan': { fill: '#006400', outline: '#004000' },
      'Pemukiman': { fill: '#FA8072', outline: '#E9967A' },
      'Industri': { fill: '#FFD700', outline: '#DAA520' },
      'Perkantoran': { fill: '#4169E1', outline: '#191970' },
      'Pertokoan': { fill: '#FF69B4', outline: '#DC143C' },
      'default': { fill: '#ff4444', outline: '#cc0000' }
    }
  },
  'kawasan-lahan-terbangun': {
    file: '/data/kawasan_terbangun.geojson',
    color: '#0088ff',
    name: 'Kawasan Lahan Terbangun (Peta Tutupan Lahan)',
    colorBy: 'JENIS',
    colorScheme: {
      'Sawah': { fill: '#90EE90', outline: '#228B22' },
      'Ladang': { fill: '#8B4513', outline: '#654321' },
      'Tegalan': { fill: '#D2B48C', outline: '#A0522D' },
      'Kebun': { fill: '#6B8E23', outline: '#556B2F' },
      'Hutan': { fill: '#006400', outline: '#004000' },
      'Pemukiman': { fill: '#FA8072', outline: '#E9967A' },
      'Industri': { fill: '#FFD700', outline: '#DAA520' },
      'Perkantoran': { fill: '#4169E1', outline: '#191970' },
      'Pertokoan': { fill: '#FF69B4', outline: '#DC143C' },
      'default': { fill: '#0088ff', outline: '#0066cc' }
    }
  },
  'kawasan-rawan-bencana': {
    file: '/data/krb_gempa_bumi.geojson',
    color: '#ff8800',
    name: 'Kawasan Rawan Bencana Banjir, Gempa Bumi, Gerakan Tanah',
    colorBy: 'UNSUR',
    colorScheme: {
      'Kawasan Rawan Bencana Rendah': { fill: '#00FF00', outline: '#008000' },
      'Kawasan Rawan Bencana Menengah': { fill: '#FFFF00', outline: '#DAA520' },
      'Kawasan Rawan Bencana Tinggi': { fill: '#FF0000', outline: '#8B0000' },
      'Kawasan Rawan Bencana Sangat Tinggi': { fill: '#8B0000', outline: '#4B0000' },
      'default': { fill: '#ff8800', outline: '#cc6600' }
    }
  },
  'peta-izin-perumahan': {
    file: '/data/kemiringan_lereng.geojson', // Using existing file as placeholder
    color: '#00aa00',
    name: 'Peta Izin Perumahan',
    colorBy: 'KETERANGAN',
    colorScheme: {
      '0% - 8%': { fill: '#90EE90', outline: '#228B22' },
      '8% - 15%': { fill: '#FFFF00', outline: '#DAA520' },
      '15% - 25%': { fill: '#FFA500', outline: '#FF8C00' },
      '25% - 45%': { fill: '#FF4500', outline: '#DC143C' },
      '> 45%': { fill: '#8B0000', outline: '#4B0000' },
      'default': { fill: '#00aa00', outline: '#006600' }
    }
  },
  'kawasan-rencana-pola-ruang': {
    file: '/data/rencana_pola_ruang.geojson',
    color: '#aa00aa',
    name: 'Kawasan Rencana Pola Ruang',
    colorBy: 'NAMOBJ',
    colorScheme: {
      'Badan Air': { fill: '#4169E1', outline: '#191970' },
      'Hutan Lindung': { fill: '#006400', outline: '#004000' },
      'Hutan Produksi': { fill: '#228B22', outline: '#006400' },
      'Pertanian': { fill: '#90EE90', outline: '#228B22' },
      'Pemukiman': { fill: '#FA8072', outline: '#E9967A' },
      'Industri': { fill: '#FFD700', outline: '#DAA520' },
      'Pariwisata': { fill: '#FF69B4', outline: '#DC143C' },
      'Infrastruktur': { fill: '#808080', outline: '#696969' },
      'default': { fill: '#aa00aa', outline: '#660066' }
    }
  }
};

// Component to handle layer updates
function LayerController({ 
  selectedLayers, 
  onFeatureClick 
}: { 
  selectedLayers: string[];
  onFeatureClick: (featureData: any, layerName: string) => void;
}) {
  const map = useMap();
  const [layers, setLayers] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [L, setL] = useState<any>(null);
  const [selectedLayer, setSelectedLayer] = useState<any>(null);

  useEffect(() => {
    // Import Leaflet only on client side
    if (typeof window !== 'undefined') {
      const Leaflet = require('leaflet');
      setL(Leaflet);
    }
  }, []);

  useEffect(() => {
    if (!L || !map) return;

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
          
          // Reset selected layer if it's being removed
          if (selectedLayer === layers[layerId]) {
            setSelectedLayer(null);
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
  }, [selectedLayers, layers, loading, map, L, onFeatureClick]);

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

      const geoJsonLayer = L.geoJSON(transformedData, {
        style: (feature: any) => {
          const propertyValue = feature.properties[config.colorBy];
          const colorScheme = config.colorScheme[propertyValue as keyof typeof config.colorScheme] || config.colorScheme.default;
          
          return {
            fillColor: colorScheme.fill,
            weight: 2,
            opacity: 1,
            color: colorScheme.outline,
            fillOpacity: 0.8
          };
        },
        onEachFeature: (feature: any, layer: any) => {
          // Add center label to the polygon
          if (feature.geometry && feature.geometry.coordinates) {
            const center = getPolygonCenter(feature.geometry.coordinates);
            if (center && Array.isArray(center) && center.length === 2 && 
                !isNaN(center[0]) && !isNaN(center[1]) && 
                isFinite(center[0]) && isFinite(center[1])) {
              
              const propertyValue = feature.properties[config.colorBy] || 'Feature';
              const labelText = propertyValue.length > 15 ? propertyValue.substring(0, 15) + '...' : propertyValue;
              
              const label = L.divIcon({
                className: 'polygon-label',
                html: `<div class="bg-white bg-opacity-95 px-2 py-1 rounded text-xs font-medium text-gray-800 border border-gray-300 shadow-sm cursor-pointer hover:bg-opacity-100">${labelText}</div>`,
                iconSize: [120, 24],
                iconAnchor: [60, 12]
              });
              
              try {
                const labelMarker = L.marker(center, { 
                  icon: label,
                  interactive: false // Make label non-interactive so clicks pass through to polygon
                });
                map.addLayer(labelMarker);
                
                // Store the label marker with the layer for cleanup
                if (!layer.labelMarkers) layer.labelMarkers = [];
                layer.labelMarkers.push(labelMarker);
              } catch (error) {
                console.warn('Failed to create label marker for feature:', feature.properties, error);
              }
            }
          }

          layer.on('click', () => {
            console.log(`${config.name} feature clicked:`, feature.properties);
            onFeatureClick(feature.properties, config.name);
            
            // Reset previously selected layer to normal style
            if (selectedLayer && selectedLayer !== layer) {
              const originalColor = selectedLayer.originalColor || selectedLayer.options.fillColor;
              selectedLayer.setStyle({ 
                fillColor: originalColor,
                weight: 2,
                fillOpacity: 0.8
              });
              
              // Reset label opacity for previously selected layer
              if (selectedLayer.labelMarkers) {
                selectedLayer.labelMarkers.forEach((marker: any) => {
                  const labelDiv = marker.getElement();
                  if (labelDiv) {
                    labelDiv.style.opacity = '0.7';
                    labelDiv.style.transform = 'scale(1)';
                    labelDiv.style.transition = 'all 0.3s ease';
                  }
                });
              }
            }
            
            // Store original color if not already stored
            if (!layer.originalColor) {
              layer.originalColor = layer.options.fillColor;
            }
            
            // Make selected feature darker (reduce brightness by 30%)
            const originalColor = layer.originalColor;
            const darkerColor = makeColorDarker(originalColor, 0.3);
            
            layer.setStyle({ 
              fillColor: darkerColor,
              fillOpacity: 0.9,
              weight: 4
            });
            
            // Highlight the label for clicked feature
            if (layer.labelMarkers) {
              layer.labelMarkers.forEach((marker: any) => {
                const labelDiv = marker.getElement();
                if (labelDiv) {
                  labelDiv.style.opacity = '1';
                  labelDiv.style.transform = 'scale(1.1)';
                  labelDiv.style.transition = 'all 0.3s ease';
                }
              });
            }
            
            // Update selected layer
            setSelectedLayer(layer);
          });

          layer.on('mouseover', () => {
            // Only apply hover effect if this layer is not currently selected
            if (selectedLayer !== layer) {
              const originalColor = layer.originalColor || layer.options.fillColor;
              layer.setStyle({ 
                weight: 4,
                fillOpacity: 0.9,
                fillColor: originalColor
              });
            }
            
            // Highlight label on hover
            if (layer.labelMarkers) {
              layer.labelMarkers.forEach((marker: any) => {
                const labelDiv = marker.getElement();
                if (labelDiv) {
                  labelDiv.style.opacity = '1';
                  labelDiv.style.transform = 'scale(1.05)';
                  labelDiv.style.transition = 'all 0.2s ease';
                }
              });
            }
          });

          layer.on('mouseout', () => {
            // Only reset if this layer is not currently selected
            if (selectedLayer !== layer) {
              const originalColor = layer.originalColor || layer.options.fillColor;
              layer.setStyle({ 
                weight: 2,
                fillOpacity: 0.8,
                fillColor: originalColor
              });
            }
            
            // Reset label on mouseout
            if (layer.labelMarkers) {
              layer.labelMarkers.forEach((marker: any) => {
                const labelDiv = marker.getElement();
                if (labelDiv) {
                  labelDiv.style.opacity = '0.7';
                  labelDiv.style.transform = 'scale(1)';
                  labelDiv.style.transition = 'all 0.2s ease';
                }
              });
            }
          });
        }
      });

      map.addLayer(geoJsonLayer);
      setLayers(prev => ({ ...prev, [layerId]: geoJsonLayer }));
    } catch (error) {
      console.error(`Error loading ${config.name}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [layerId]: false }));
    }
  };

  return null;
}

// Transform coordinates from projected to WGS84
function transformCoordinates(data: any) {
  return {
    type: 'FeatureCollection',
    features: data.features.map((feature: any) => {
      const transformedFeature = JSON.parse(JSON.stringify(feature));
      
      if (transformedFeature.geometry && transformedFeature.geometry.coordinates) {
        transformedFeature.geometry.coordinates = transformedFeature.geometry.coordinates.map((polygon: any) => 
          polygon.map((ring: any) => 
            ring.map((coord: any) => {
              // Validate input coordinates
              if (!Array.isArray(coord) || coord.length < 2) {
                console.warn('Invalid coordinate format:', coord);
                return [0, 0]; // Fallback to origin
              }
              
              const [x, y] = coord;
              
              // Check if coordinates are already in WGS84 format
              if (x >= -180 && x <= 180 && y >= -90 && y <= 90) {
                // Already in WGS84, return as is
                return [x, y];
              } else {
                // Convert from projected coordinates to WGS84
                // For UTM Zone 48S coordinates (around 762144, 9259865)
                // Better approximation for Purwakarta area
                const lng = (x - 500000) / 1000000 + 107.5;
                const lat = y / 10000000 - 6.5;
                
                // Validate transformed coordinates
                if (isNaN(lng) || isNaN(lat) || !isFinite(lng) || !isFinite(lat)) {
                  console.warn('Invalid transformed coordinates:', { x, y, lng, lat });
                  return [107.4439, -6.5569]; // Fallback to Purwakarta center
                }
                
                return [lng, lat];
              }
            })
          )
        );
      }
      
      return transformedFeature;
    })
  };
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

// Helper to get the center of a polygon
function getPolygonCenter(coordinates: any) {
  if (!coordinates || coordinates.length === 0) return null;

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let validCoords = 0;

  for (const ring of coordinates) {
    for (const coord of ring) {
      // Check if coordinates are valid numbers
      if (Array.isArray(coord) && coord.length >= 2 && 
          !isNaN(coord[0]) && !isNaN(coord[1]) && 
          isFinite(coord[0]) && isFinite(coord[1])) {
        
        minX = Math.min(minX, coord[0]);
        maxX = Math.max(maxX, coord[0]);
        minY = Math.min(minY, coord[1]);
        maxY = Math.max(maxY, coord[1]);
        validCoords++;
      }
    }
  }

  // Only return center if we have valid coordinates
  if (validCoords > 0 && isFinite(minX) && isFinite(maxX) && isFinite(minY) && isFinite(maxY)) {
    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;
    
    // Final validation
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
function ClientMap({ activeMenu, selectedLayers, setSelectedLayers, showBaseMap, setShowBaseMap }: MapProps) {
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