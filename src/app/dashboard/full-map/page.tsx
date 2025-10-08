"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, MapPin, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface MapData {
  id: number;
  name: string;
  geojson: any;
  sortOrder: number;
}

interface LayerConfig {
  id: string;
  name: string;
  color: string;
  outlineColor: string;
}

const layerConfigs: { [key: string]: LayerConfig } = {
  'layer-peta-administrasi': {
    id: 'layer-peta-administrasi',
    name: 'Administrative Boundaries',
    color: '#4a90e2',
    outlineColor: '#2c5aa0'
  },
  'layer-sebaran-rumah-komersil': {
    id: 'layer-sebaran-rumah-komersil',
    name: 'Sebaran Rumah Komersil',
    color: '#e67e22',
    outlineColor: '#a95a17'
  },
  'layer-kawasan-lahan-terbangun': {
    id: 'layer-kawasan-lahan-terbangun',
    name: 'Kawasan Lahan Terbangun',
    color: '#16a085',
    outlineColor: '#0e6f5c'
  },
  'layer-kawasan-rawan-bencana': {
    id: 'layer-kawasan-rawan-bencana',
    name: 'Kawasan Rawan Bencana',
    color: '#c0392b',
    outlineColor: '#7e261d'
  },
  'layer-kawasan-rencana-pola-ruang': {
    id: 'layer-kawasan-rencana-pola-ruang',
    name: 'Kawasan Rencana Pola Ruang',
    color: '#8e44ad',
    outlineColor: '#5e2e73'
  },
  'layer-kemiringan-lereng': {
    id: 'layer-kemiringan-lereng',
    name: 'Kemiringan Lereng',
    color: '#27ae60',
    outlineColor: '#1c7a43'
  }
};

export default function FullMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapData, setMapData] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [showBaseMap, setShowBaseMap] = useState(true);
  const router = useRouter();

  // Load map data from API
  const loadMapData = async () => {
    try {
      setLoading(true);
      console.log('Loading map data from API...');
      const response = await fetch('/api/maps', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load map data');
      const data = await response.json();
      console.log('Map data loaded:', data);
      setMapData(data);
      
      // Auto-select all layers
      const allLayerIds = data.map((map: MapData) => {
        return `layer-${map.name.toLowerCase().replace(/\s+/g, '-')}`;
      });
      console.log('Auto-selected layers:', allLayerIds);
      setSelectedLayers(allLayerIds);
    } catch (err: any) {
      console.error('Error loading map data:', err);
      setError(err?.message || 'Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    console.log('Initializing map...');
    if (mapContainer.current) {
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: showBaseMap 
            ? 'mapbox://styles/mapbox/streets-v12'
            : 'mapbox://styles/mapbox/light-v11',
          center: [107.4439, -6.5569], // Purwakarta center
          zoom: 10,
          attributionControl: false
        });

        map.current.on('load', () => {
          setMapReady(true);
          console.log('Map loaded successfully');
        });

        map.current.on('error', (e) => {
          // console.error('Map error:', e);
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        console.log('Map initialized successfully');
      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Failed to initialize map');
      }
    }

    return () => {
      if (map.current) {
        console.log('Cleaning up map...');
        map.current.remove();
        map.current = null;
      }
    };
  }, [showBaseMap]);

  // Helper to get the center of a polygon
  const getPolygonCenter = useCallback((coordinates: any) => {
    if (!coordinates || coordinates.length === 0) return null;

    let ring = null;
    
    if (coordinates[0] && Array.isArray(coordinates[0])) {
      if (coordinates[0][0] && Array.isArray(coordinates[0][0]) && coordinates[0][0].length > 0) {
        if (Array.isArray(coordinates[0][0][0]) && coordinates[0][0][0].length >= 2) {
          ring = coordinates[0][0];
        } else {
          ring = coordinates[0];
        }
      } else {
        ring = coordinates[0];
      }
    }
    
    if (!ring || ring.length < 3) return null;

    // Calculate centroid using shoelace formula
    let area = 0;
    let centroidX = 0;
    let centroidY = 0;

    for (let i = 0; i < ring.length - 1; i++) {
      const coord1 = ring[i];
      const coord2 = ring[i + 1];
      
      const x1 = coord1[0];
      const y1 = coord1[1];
      const x2 = coord2[0];
      const y2 = coord2[1];
      
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
      return [centroidX, centroidY];
    }

    // Fallback to bounding box center
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let validCoords = 0;

    for (const coord of ring) {
      if (Array.isArray(coord) && coord.length >= 2) {
        const x = coord[0];
        const y = coord[1];
        
        if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          validCoords++;
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
  }, []);

  // Helper to calculate polygon area in square meters
  const calculatePolygonArea = useCallback((coordinates: any): number | null => {
    if (!coordinates || coordinates.length === 0) return null;

    try {
      const ring = coordinates[0];
      if (!ring || ring.length < 3) return null;

      let area = 0;
      
      for (let i = 0; i < ring.length - 1; i++) {
        const coord1 = ring[i];
        const coord2 = ring[i + 1];
        
        if (Array.isArray(coord1) && Array.isArray(coord2) && 
            coord1.length >= 2 && coord2.length >= 2) {
          const x1 = coord1[0];
          const y1 = coord1[1];
          const x2 = coord2[0];
          const y2 = coord2[1];
          
          if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2) && 
              isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2)) {
            const cross = x1 * y2 - x2 * y1;
            area += cross;
          }
        }
      }

      // Close the polygon
      if (ring.length > 0) {
        const firstCoord = ring[0];
        const lastCoord = ring[ring.length - 1];
        
        if (Array.isArray(firstCoord) && Array.isArray(lastCoord) && 
            firstCoord.length >= 2 && lastCoord.length >= 2) {
          const x1 = lastCoord[0];
          const y1 = lastCoord[1];
          const x2 = firstCoord[0];
          const y2 = firstCoord[1];
          
          if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2) && 
              isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2)) {
            const cross = x1 * y2 - x2 * y1;
            area += cross;
          }
        }
      }

      const areaInDegrees = Math.abs(area) / 2;
      const metersPerDegree = 111000;
      const areaInSquareMeters = areaInDegrees * metersPerDegree * metersPerDegree;
      
      return areaInSquareMeters;
    } catch (error) {
      console.error('Error calculating polygon area:', error);
      return null;
    }
  }, []);

  // Add labels for commercial building features
  const addCommercialBuildingLabels = useCallback((layerId: string, data: any) => {
    if (!map.current) return;

    const labelData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: data.features.map((feature: any) => {
        const center = getPolygonCenter(feature.geometry.coordinates);
        if (center) {
          const labelText = feature.properties.namaKawasanPerumahan || feature.properties.nama_kawasan || 'Unnamed';
          const area = calculatePolygonArea(feature.geometry.coordinates);
          const areaText = area ? `${Math.round(area)} m²` : '';
          const combinedLabel = areaText ? `${labelText}\n${areaText}` : labelText;
          
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: center
            },
            properties: {
              combinedLabel: combinedLabel,
              featureId: feature.properties.feature_id || feature.properties.OBJECTID || feature.properties.Id
            }
          } as GeoJSON.Feature;
        }
        return null;
      }).filter(Boolean) as GeoJSON.Feature[]
    };

    const labelSourceId = `${layerId}-labels`;
    if (!map.current.getSource(labelSourceId)) {
      map.current.addSource(labelSourceId, {
        type: 'geojson',
        data: labelData
      });
    }

    if (!map.current.getLayer(`${layerId}-labels-commercial`)) {
      map.current.addLayer({
        id: `${layerId}-labels-commercial`,
        type: 'symbol',
        source: labelSourceId,
        filter: ['has', 'combinedLabel'],
        layout: {
          'text-field': ['get', 'combinedLabel'],
          'text-font': ['Open Sans Bold'],
          'text-size': 11,
          'text-anchor': 'center',
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': '#8B4513',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });
    }
  }, [getPolygonCenter, calculatePolygonArea]);

  // Add labels for administrative features
  const addAdministrativeLabels = useCallback((layerId: string, data: any) => {
    if (!map.current) return;

    const labelData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: data.features.map((feature: any) => {
        const center = getPolygonCenter(feature.geometry.coordinates);
        if (center) {
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: center
            },
            properties: {
              kecamatan: feature.properties.WADMKC || '',
              kelurahan: feature.properties.WADMKD || '',
              featureId: feature.properties.OBJECTID
            }
          } as GeoJSON.Feature;
        }
        return null;
      }).filter(Boolean) as GeoJSON.Feature[]
    };

    const labelSourceId = `${layerId}-labels`;
    if (!map.current.getSource(labelSourceId)) {
      map.current.addSource(labelSourceId, {
        type: 'geojson',
        data: labelData
      });
    }

    // Add Kecamatan labels
    if (!map.current.getLayer(`${layerId}-labels-kecamatan`)) {
      map.current.addLayer({
        id: `${layerId}-labels-kecamatan`,
        type: 'symbol',
        source: labelSourceId,
        filter: ['has', 'kecamatan'],
        layout: {
          'text-field': ['get', 'kecamatan'],
          'text-font': ['Open Sans Bold'],
          'text-size': 12,
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#1a1a1a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });
    }

    // Add Kelurahan labels
    if (!map.current.getLayer(`${layerId}-labels-kelurahan`)) {
      map.current.addLayer({
        id: `${layerId}-labels-kelurahan`,
        type: 'symbol',
        source: labelSourceId,
        filter: ['has', 'kelurahan'],
        layout: {
          'text-field': ['get', 'kelurahan'],
          'text-font': ['Open Sans Regular'],
          'text-size': 10,
          'text-anchor': 'center',
          'text-offset': [0, -0.002]
        },
        paint: {
          'text-color': '#666666',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });
    }
  }, [getPolygonCenter]);

  // Load a single layer
  const loadLayer = useCallback((layerId: string, geojsonData: any, config: LayerConfig, order: number) => {
    if (!map.current) {
      console.log('Map not ready, skipping layer:', layerId);
      return;
    }

    try {
      console.log(`Loading layer: ${layerId} with order: ${order}`);
      console.log('GeoJSON data:', geojsonData);
      console.log('Config:', config);
      
      // Add source
      if (map.current.getSource(layerId)) {
        console.log(`Removing existing source: ${layerId}`);
        map.current.removeSource(layerId);
      }
      
      console.log(`Adding source: ${layerId}`);
      map.current.addSource(layerId, {
        type: 'geojson',
        data: geojsonData
      });

      // Ensure interactive identifier exists for hover/click filters
      if (geojsonData && Array.isArray(geojsonData.features)) {
        geojsonData.features = geojsonData.features.map((f: any, idx: number) => {
          if (!f.properties) f.properties = {};
          if (typeof f.properties.OBJECTID === 'undefined' || f.properties.OBJECTID === null) {
            f.properties.OBJECTID = idx + 1;
          }
          return f;
        });
      }

      // Add fill layer
      if (!map.current.getLayer(`${layerId}-fill`)) {
        map.current.addLayer({
          id: `${layerId}-fill`,
          type: 'fill',
          source: layerId,
          paint: {
            'fill-color': config.color,
            'fill-opacity': 0.3
          }
        });
      }

      // Add outline layer
      if (!map.current.getLayer(`${layerId}-outline`)) {
        map.current.addLayer({
          id: `${layerId}-outline`,
          type: 'line',
          source: layerId,
          paint: {
            'line-color': config.outlineColor,
            'line-width': 1
          }
        });
      }

      // Add highlighted layer (initially hidden)
      if (!map.current.getLayer(`${layerId}-highlighted`)) {
        map.current.addLayer({
          id: `${layerId}-highlighted`,
          type: 'fill',
          source: layerId,
          paint: {
            'fill-color': config.color,
            'fill-opacity': 0.8
          },
          filter: ['==', 'OBJECTID', ''] // Initially no features shown
        });
      }

      // Add highlighted outline layer
      if (!map.current.getLayer(`${layerId}-highlighted-outline`)) {
        map.current.addLayer({
          id: `${layerId}-highlighted-outline`,
          type: 'line',
          source: layerId,
          paint: {
            'line-color': config.outlineColor,
            'line-width': 3
          },
          filter: ['==', 'OBJECTID', ''] // Initially no features shown
        });
      }

      // Add labels for commercial buildings layer
      if (layerId === 'layer-sebaran-rumah-komersil') {
        addCommercialBuildingLabels(layerId, geojsonData);
      }

      // Add labels for administrative layer
      if (layerId === 'layer-administrasi') {
        addAdministrativeLabels(layerId, geojsonData);
      }

      // Set up click events
      map.current.on('click', `${layerId}-fill`, (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const featureId = feature.properties?.OBJECTID;
          
          if (featureId) {
            // Highlight the clicked feature
            map.current!.setFilter(`${layerId}-highlighted`, ['==', 'OBJECTID', featureId]);
            map.current!.setFilter(`${layerId}-highlighted-outline`, ['==', 'OBJECTID', featureId]);
            
            console.log('Feature clicked:', feature.properties);
          }
        }
      });

      // Add hover effects
      map.current.on('mouseenter', `${layerId}-fill`, () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', `${layerId}-fill`, () => {
        map.current!.getCanvas().style.cursor = '';
      });

      console.log(`Layer ${layerId} loaded successfully`);
    } catch (error) {
      console.error(`Error loading layer ${layerId}:`, error);
    }
  }, [addCommercialBuildingLabels, addAdministrativeLabels]);

  // Load layers when map is ready and data is available
  useEffect(() => {
    if (!mapReady || !map.current || mapData.length === 0) return;

    console.log('Loading layers for full map...');
    console.log('Map data:', mapData);
    console.log('Selected layers:', selectedLayers);

    // Sort map data by sortOrder
    const sortedMapData = [...mapData].sort((a, b) => a.sortOrder - b.sortOrder);
    
    // Load each layer in order
    sortedMapData.forEach((mapItem, index) => {
      const layerId = `layer-${mapItem.name.toLowerCase().replace(/\s+/g, '-')}`;
      const config = layerConfigs[layerId];
      
      if (config && mapItem.geojson) {
        console.log(`Loading layer: ${layerId} (${mapItem.name})`);
        loadLayer(layerId, mapItem.geojson, config, index + 1);
      } else {
        console.log(`No config found for layer: ${layerId} (${mapItem.name})`);
      }
    });
  }, [mapReady, mapData, selectedLayers, loadLayer]);

  const handleAddCommercialHouse = () => {
    router.push('/dashboard/commercil-houses/form');
  };

  const toggleBaseMap = () => {
    setShowBaseMap(!showBaseMap);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadMapData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Full Map View
          </h1>
          <div className="text-sm text-gray-500">
            {mapData.length} layers loaded
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleBaseMap}
            className="flex items-center"
          >
            <Layers className="mr-2 h-4 w-4" />
            {showBaseMap ? 'Hide' : 'Show'} Base Map
          </Button>
          
          <Button
            onClick={handleAddCommercialHouse}
            className="flex items-center bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Rumah Komersil
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="w-full h-full" />
        
        {/* Map Controls */}
        <div className="absolute top-4 left-4 space-y-2">
          <Card className="p-3 bg-white/90 backdrop-blur-sm">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Layers</div>
              {mapData.map((mapItem) => {
                const layerId = `layer-${mapItem.name.toLowerCase().replace(/\s+/g, '-')}`;
                const config = layerConfigs[layerId];
                return (
                  <div key={mapItem.id} className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: config?.color || '#ccc' }}
                    />
                    <span className="text-xs text-gray-600">{mapItem.name}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Loading indicator */}
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
