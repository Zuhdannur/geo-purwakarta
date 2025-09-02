'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import FeatureDrawer from './FeatureDrawer';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface MapboxMapProps {
  activeMenu: string | null;
  selectedLayers: string[];
  setSelectedLayers: (layers: string[]) => void;
  showBaseMap: boolean;
  setShowBaseMap: (show: boolean) => void;
  selectedKecamatan: string;
  selectedKelurahan: string;
}

interface LayerConfig {
  id: string;
  name: string;
  url: string;
  color: string;
  outlineColor: string;
}

const layerConfigs: { [key: string]: LayerConfig } = {
  'layer-administrasi': {
    id: 'layer-administrasi',
    name: 'Administrative Boundaries',
    url: '/new data/layer_administrasi.geojson',
    color: '#4a90e2',
    outlineColor: '#2c5aa0'
  }
};

export default function MapboxMap({
  activeMenu,
  selectedLayers,
  setSelectedLayers,
  showBaseMap,
  setShowBaseMap,
  selectedKecamatan,
  selectedKelurahan
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const hoveredRef = useRef<{ layerId: string; featureId: any } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapReadyRef = useRef(false);
  const [layers, setLayers] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [featureDrawer, setFeatureDrawer] = useState<{
    isOpen: boolean;
    featureData: any;
    layerName: string;
  }>({
    isOpen: false,
    featureData: null,
    layerName: ''
  });

  // Initialize map
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    if (mapContainer.current) {
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
        mapReadyRef.current = true;
        console.log('map loaded');
      });

      // Add click event for feature selection
      map.current.on('click', (e) => {
        console.log('map clicked', e);
        console.log('isStyleLoaded', map.current?.isStyleLoaded());
        // Only handle clicks if style is loaded and layers are selected
        if (map.current?.isStyleLoaded() && selectedLayers.length > 0) {
          handleFeatureClick(e);
        }
      });

      // Add hover effects (cursor change + per-feature hover highlight) with safe layer checks
      map.current.on('mousemove', (e) => {
        if (!map.current || !map.current.isStyleLoaded()) return;

        try {
          const availableLayers = selectedLayers
            .map(layerId => `${layerId}-fill`)
            .filter(layerName => map.current!.getLayer(layerName));

          if (availableLayers.length === 0) {
            // Clear previous hover highlight if any
            if (hoveredRef.current) {
              const prev = hoveredRef.current;
              if (map.current.getLayer(`${prev.layerId}-hovered`)) {
                map.current.setFilter(`${prev.layerId}-hovered`, ['==', 'OBJECTID', '']);
              }
              if (map.current.getLayer(`${prev.layerId}-hovered-outline`)) {
                map.current.setFilter(`${prev.layerId}-hovered-outline`, ['==', 'OBJECTID', '']);
              }
              hoveredRef.current = null;
            }
            map.current!.getCanvas().style.cursor = '';
            return;
          }

          const features = map.current!.queryRenderedFeatures(e.point, {
            layers: availableLayers
          });

          if (features.length > 0) {
            const hovered = features[0] as any;
            if (!hovered || !hovered.layer || !hovered.properties) {
              return;
            }

            // Determine base layer id
            let layerId = hovered.layer.id as string;
            if (layerId.includes('-fill')) layerId = layerId.replace('-fill', '');
            else if (layerId.includes('-outline')) layerId = layerId.replace('-outline', '');
            else if (layerId.includes('-highlighted')) layerId = layerId.replace('-highlighted', '');
            else if (layerId.includes('-hovered')) layerId = layerId.replace('-hovered', '');

            const props = hovered.properties as Record<string, any>;
            const featureId = props.OBJECTID || `${props.WADMKC}-${props.WADMKD}`;

            // Skip if this feature is the same as currently hovered
            if (!hoveredRef.current || hoveredRef.current.layerId !== layerId || hoveredRef.current.featureId !== featureId) {
              // Clear previous hover if different
              if (hoveredRef.current) {
                const prev = hoveredRef.current;
                if (map.current.getLayer(`${prev.layerId}-hovered`)) {
                  map.current.setFilter(`${prev.layerId}-hovered`, ['==', 'OBJECTID', '']);
                }
                if (map.current.getLayer(`${prev.layerId}-hovered-outline`)) {
                  map.current.setFilter(`${prev.layerId}-hovered-outline`, ['==', 'OBJECTID', '']);
                }
              }

              // Apply hover filters on current layer if present
              if (map.current.getLayer(`${layerId}-hovered`)) {
                map.current.setFilter(`${layerId}-hovered`, ['==', 'OBJECTID', featureId]);
              }
              if (map.current.getLayer(`${layerId}-hovered-outline`)) {
                map.current.setFilter(`${layerId}-hovered-outline`, ['==', 'OBJECTID', featureId]);
              }

              hoveredRef.current = { layerId, featureId };
            }

            map.current!.getCanvas().style.cursor = 'pointer';
          } else {
            // Clear previous hover highlight when no feature under cursor
            if (hoveredRef.current) {
              const prev = hoveredRef.current;
              if (map.current.getLayer(`${prev.layerId}-hovered`)) {
                map.current.setFilter(`${prev.layerId}-hovered`, ['==', 'OBJECTID', '']);
              }
              if (map.current.getLayer(`${prev.layerId}-hovered-outline`)) {
                map.current.setFilter(`${prev.layerId}-hovered-outline`, ['==', 'OBJECTID', '']);
              }
              hoveredRef.current = null;
            }
            map.current!.getCanvas().style.cursor = '';
          }
        } catch (err) {
          // If querying fails for any reason, ensure cursor resets and don't throw
          map.current!.getCanvas().style.cursor = '';
        }
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [showBaseMap]);

  // Handle base map toggle
  useEffect(() => {
    if (map.current && mapReady) {
      const style = showBaseMap 
        ? 'mapbox://styles/mapbox/streets-v12'
        : 'mapbox://styles/mapbox/light-v11';
      map.current.setStyle(style);
    }
  }, [showBaseMap, mapReady]);

  // Handle feature click and highlighting using Mapbox filters
  const handleFeatureClick = (e: any) => {
    if (!map.current || !map.current.isStyleLoaded() || selectedLayers.length === 0) {
      console.log('Map not ready or no layers selected');
      return;
    }

    try {
      // Set bbox as 5px rectangle area around clicked point
      const bbox: [[number, number], [number, number]] = [
        [e.point.x - 5, e.point.y - 5],
        [e.point.x + 5, e.point.y + 5]
      ];

      // Get available layers that actually exist in the map
      const availableLayers = selectedLayers
        .map(layerId => `${layerId}-fill`)
        .filter(layerName => map.current!.getLayer(layerName));

      // Debug: Log available layers
      console.log('Selected layers:', selectedLayers);
      console.log('Available fill layers:', availableLayers);
      console.log('All map layers:', map.current.getStyle().layers?.map(l => l.id) || []);

      if (availableLayers.length === 0) {
        console.log('No fill layers available for querying');
        return;
      }

      // Find features intersecting the bounding box
      let selectedFeatures = map.current.queryRenderedFeatures(bbox, {
        layers: availableLayers
      });

      // Fallback: if no features found in specific layers, try querying all layers
      if (selectedFeatures.length === 0) {
        console.log('No features found in specific layers, trying all layers...');
        selectedFeatures = map.current.queryRenderedFeatures(bbox);
      }

              if (selectedFeatures.length > 0) {
          const clickedFeature = selectedFeatures[0] as any;
          if (!clickedFeature || !clickedFeature.layer || !clickedFeature.properties) {
            return;
          }
          
          // Extract layer ID more robustly
          let layerId = clickedFeature.layer.id as string;
          if (layerId.includes('-fill')) {
            layerId = layerId.replace('-fill', '');
          } else if (layerId.includes('-outline')) {
            layerId = layerId.replace('-outline', '');
          } else if (layerId.includes('-highlighted')) {
            layerId = layerId.replace('-highlighted', '');
          }
          
          const config = layerConfigs[layerId];
        
        if (config) {
          // Clear previous highlighting
          if (selectedFeature && selectedFeature.layerId !== layerId) {
            const prevHighlightedLayer = `${selectedFeature.layerId}-highlighted`;
            const prevHighlightedOutlineLayer = `${selectedFeature.layerId}-highlighted-outline`;
            
            if (map.current.getLayer(prevHighlightedLayer)) {
              map.current.setFilter(prevHighlightedLayer, ['==', 'OBJECTID', '']);
            }
            if (map.current.getLayer(prevHighlightedOutlineLayer)) {
              map.current.setFilter(prevHighlightedOutlineLayer, ['==', 'OBJECTID', '']);
            }
          }

          // Get the unique identifier for the feature
          const props = clickedFeature.properties as Record<string, any>;
          const featureId = props.OBJECTID || `${props.WADMKC}-${props.WADMKD}`;
          
          // Set filter to highlight only the selected feature
          const highlightedLayer = `${layerId}-highlighted`;
          const highlightedOutlineLayer = `${layerId}-highlighted-outline`;
          
          if (map.current.getLayer(highlightedLayer)) {
            map.current.setFilter(highlightedLayer, ['==', 'OBJECTID', featureId]);
          }
          if (map.current.getLayer(highlightedOutlineLayer)) {
            map.current.setFilter(highlightedOutlineLayer, ['==', 'OBJECTID', featureId]);
          }
          
          // Store the selected feature
          setSelectedFeature({
            ...clickedFeature,
            layerId: layerId,
            featureId: featureId
          });

          // Open the feature drawer
          setFeatureDrawer({
            isOpen: true,
            featureData: props,
            layerName: config.name
          });
        }
      }
    } catch (error) {
      console.error('Error handling feature click:', error);
    }
  };

  // Helper function to make colors darker
  const makeColorDarker = (color: string, factor: number): string => {
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
    return color;
  };

  // Deterministic color from string (for WADMKD)
  const colorFromString = (value: string): string => {
    // Simple hash
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = value.charCodeAt(i) + ((hash << 5) - hash);
      hash |= 0; // Convert to 32bit int
    }
    // Map hash to HSL
    const hue = Math.abs(hash) % 360;
    const saturation = 60; // percent
    const lightness = 60; // percent
    return hslToHex(hue, saturation, lightness);
  };

  const hslToHex = (h: number, s: number, l: number): string => {
    // Convert to [0,1]
    const s1 = s / 100;
    const l1 = l / 100;
    const c = (1 - Math.abs(2 * l1 - 1)) * s1;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l1 - c / 2;
    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    const r255 = Math.round((r + m) * 255);
    const g255 = Math.round((g + m) * 255);
    const b255 = Math.round((b + m) * 255);
    return `#${r255.toString(16).padStart(2, '0')}${g255.toString(16).padStart(2, '0')}${b255.toString(16).padStart(2, '0')}`;
  };

  // Load layers when map is ready
  useEffect(() => {
    if (!mapReady || !map.current) return;

    // Load selected layers
    selectedLayers.forEach(layerId => {
      if (!layers[layerId] && !loading[layerId]) {
        loadLayer(layerId);
      }
    });

    // Remove unselected layers
    Object.keys(layers).forEach(layerId => {
      if (!selectedLayers.includes(layerId)) {
        removeLayer(layerId);
      }
    });
  }, [mapReady, selectedLayers]);

  // Handle camera movement for selected administrative areas
  useEffect(() => {
    if (!map.current || !selectedKecamatan) return;

    // Find the feature that matches the selected kecamatan
    const source = map.current.getSource('layer-administrasi') as mapboxgl.GeoJSONSource;
    if (source && source._data && typeof source._data !== 'string') {
      const geoJsonData = source._data as GeoJSON.FeatureCollection;
      const feature = geoJsonData.features.find((f: any) => 
        f.properties.WADMKC === selectedKecamatan
      );

      if (feature && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
        const center = getPolygonCenter((feature.geometry as any).coordinates);
        if (center) {
          map.current.flyTo({
            center: center as [number, number],
            zoom: 10,
            duration: 2000,
            essential: true
          });
        }
      }
    }
  }, [selectedKecamatan]);

  // Handle camera movement for selected kelurahan
  useEffect(() => {
    if (!map.current || !selectedKelurahan || !selectedKecamatan || selectedKelurahan === 'All Kelurahan/Desa') return;

    // Find the feature that matches both kecamatan and kelurahan
    const source = map.current.getSource('layer-administrasi') as mapboxgl.GeoJSONSource;
    if (source && source._data && typeof source._data !== 'string') {
      const geoJsonData = source._data as GeoJSON.FeatureCollection;
      const feature = geoJsonData.features.find((f: any) => 
        f.properties.WADMKC === selectedKecamatan && 
        f.properties.WADMKD === selectedKelurahan
      );

      if (feature && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
        const center = getPolygonCenter((feature.geometry as any).coordinates);
        if (center) {
          // Calculate the bounding box of the feature for optimal zoom
          const bounds = getFeatureBounds(feature.geometry);
          if (bounds) {
            // Fit the map to the feature bounds with padding
            map.current.fitBounds(bounds, {
              padding: 50,
              duration: 2000,
              essential: true
            });
          } else {
            // Fallback to center with high zoom
            map.current.flyTo({
              center: center as [number, number],
              zoom: 16,
              duration: 2000,
              essential: true
            });
          }
        }
      }
    }
  }, [selectedKelurahan, selectedKecamatan]);

  // Load a single layer
  const loadLayer = async (layerId: string) => {
    const config = layerConfigs[layerId];
    if (!config) return;

    setLoading(prev => ({ ...prev, [layerId]: true }));

    try {
      const response = await fetch(config.url);
      const data = await response.json();

      if (map.current) {
        // Add source
        map.current.addSource(layerId, {
          type: 'geojson',
          data: data
        });

        // Build a deterministic color map per Kelurahan/Desa (WADMKD)
        const uniqueKelurahan: string[] = Array.from(
          new Set(
            (data.features || [])
              .map((f: any) => f?.properties?.WADMKD)
              .filter((v: any) => typeof v === 'string' && v.length > 0)
          )
        );

        // Create a Mapbox match expression: match(get('WADMKD'), 'Name1', '#hex1', ..., defaultColor)
        const fillColorExpression: any[] = ['match', ['get', 'WADMKD']];
        uniqueKelurahan.forEach((name) => {
          fillColorExpression.push(name, colorFromString(name));
        });
        fillColorExpression.push(config.color); // default fallback

        // Add fill layer with per-desa color
        map.current.addLayer({
          id: `${layerId}-fill`,
          type: 'fill',
          source: layerId,
          paint: {
            'fill-color': fillColorExpression as any,
            'fill-opacity': 0.3
          }
        });

        // Add outline layer
        map.current.addLayer({
          id: `${layerId}-outline`,
          type: 'line',
          source: layerId,
          paint: {
            'line-color': config.outlineColor,
            'line-width': 1
          }
        });

        // Add highlighted layer (initially hidden)
        map.current.addLayer({
          id: `${layerId}-highlighted`,
          type: 'fill',
          source: layerId,
          paint: {
            'fill-color': makeColorDarker(config.color, 0.3),
            'fill-opacity': 0.8
          },
          filter: ['==', 'OBJECTID', ''] // Initially no features shown
        });

        // Add highlighted outline layer
        map.current.addLayer({
          id: `${layerId}-highlighted-outline`,
          type: 'line',
          source: layerId,
          paint: {
            'line-color': makeColorDarker(config.outlineColor, 0.3),
            'line-width': 3
          },
          filter: ['==', 'OBJECTID', ''] // Initially no features shown
        });

        // Add hovered layer (initially hidden)
        map.current.addLayer({
          id: `${layerId}-hovered`,
          type: 'fill',
          source: layerId,
          paint: {
            'fill-color': makeColorDarker(config.color, 0.15),
            'fill-opacity': 0.6
          },
          filter: ['==', 'OBJECTID', ''] // Initially no features shown
        });

        // Add hovered outline layer (initially hidden)
        map.current.addLayer({
          id: `${layerId}-hovered-outline`,
          type: 'line',
          source: layerId,
          paint: {
            'line-color': makeColorDarker(config.outlineColor, 0.15),
            'line-width': 2
          },
          filter: ['==', 'OBJECTID', ''] // Initially no features shown
        });

        // Add labels for administrative layer
        if (layerId === 'layer-administrasi') {
          addLabels(layerId, data);
        }

        // Note: Click events are handled globally in the map click handler

        // Add hover effects (cursor only)
        map.current.on('mouseenter', `${layerId}-fill`, () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', `${layerId}-fill`, () => {
          map.current!.getCanvas().style.cursor = '';
        });

        setLayers(prev => ({ ...prev, [layerId]: { source: layerId, config } }));
      }
    } catch (error) {
      console.error(`Error loading ${config.name}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [layerId]: false }));
    }
  };

  // Remove a layer
  const removeLayer = (layerId: string) => {
    if (!map.current || !layers[layerId]) return;

    try {
      // Remove layers
      if (map.current.getLayer(`${layerId}-fill`)) {
        map.current.removeLayer(`${layerId}-fill`);
      }
      if (map.current.getLayer(`${layerId}-outline`)) {
        map.current.removeLayer(`${layerId}-outline`);
      }
      if (map.current.getLayer(`${layerId}-highlighted`)) {
        map.current.removeLayer(`${layerId}-highlighted`);
      }
      if (map.current.getLayer(`${layerId}-highlighted-outline`)) {
        map.current.removeLayer(`${layerId}-highlighted-outline`);
      }
      if (map.current.getLayer(`${layerId}-labels`)) {
        map.current.removeLayer(`${layerId}-labels`);
      }

      // Remove source
      if (map.current.getSource(layerId)) {
        map.current.removeSource(layerId);
      }

      // Remove from layers state
      setLayers(prev => {
        const newLayers = { ...prev };
        delete newLayers[layerId];
        return newLayers;
      });
    } catch (error) {
      console.error(`Error removing layer ${layerId}:`, error);
    }
  };

  // Add labels for administrative features
  const addLabels = (layerId: string, data: any) => {
    if (!map.current) return;

    // Add label source
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

    map.current.addSource(`${layerId}-labels`, {
      type: 'geojson',
      data: labelData
    });

    // Add Kecamatan labels
    map.current.addLayer({
      id: `${layerId}-labels-kecamatan`,
      type: 'symbol',
      source: `${layerId}-labels`,
      filter: ['has', 'kecamatan'],
      layout: {
        'text-field': ['get', 'kecamatan'],
        'text-font': ['Open Sans Bold'],
        'text-size': 12,
        'text-anchor': 'center',
        'text-offset': [0, 0]
      },
      paint: {
        'text-color': '#1a1a1a',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });

    // Add Kelurahan labels
    map.current.addLayer({
      id: `${layerId}-labels-kelurahan`,
      type: 'symbol',
      source: `${layerId}-labels`,
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
  };

  // Helper to get the bounding box of a GeoJSON feature
  const getFeatureBounds = (geometry: any): mapboxgl.LngLatBoundsLike | null => {
    if (!geometry || !geometry.coordinates) return null;

    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    let hasValidCoords = false;

    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates[0]; // First ring (exterior boundary)
      for (const coord of coords) {
        if (Array.isArray(coord) && coord.length >= 2) {
          const [lng, lat] = coord;
          if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            hasValidCoords = true;
          }
        }
      }
    } else if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates) {
        const coords = polygon[0]; // First ring of each polygon
        for (const coord of coords) {
          if (Array.isArray(coord) && coord.length >= 2) {
            const [lng, lat] = coord;
            if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
              minLng = Math.min(minLng, lng);
              maxLng = Math.max(maxLng, lng);
              minLat = Math.min(minLat, lat);
              maxLat = Math.max(maxLat, lat);
              hasValidCoords = true;
            }
          }
        }
      }
    }

    if (!hasValidCoords) return null;

    return [
      [minLng, minLat], // Southwest
      [maxLng, maxLat]  // Northeast
    ];
  };

  // Helper to get the center of a polygon
  const getPolygonCenter = (coordinates: any) => {
    if (!coordinates || coordinates.length === 0) return null;

    let totalArea = 0;
    let weightedX = 0;
    let weightedY = 0;

    // Handle MultiPolygon coordinates
    for (const polygon of coordinates) {
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

    for (const polygon of coordinates) {
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
  };

  const closeFeatureDrawer = () => {
    // Clear highlighting when drawer is closed
    if (selectedFeature && map.current) {
      const layerId = selectedFeature.layerId;
      map.current.setFilter(`${layerId}-highlighted`, ['==', 'OBJECTID', '']);
      map.current.setFilter(`${layerId}-highlighted-outline`, ['==', 'OBJECTID', '']);
      // Also clear any hover highlight
      if (map.current.getLayer(`${layerId}-hovered`)) {
        map.current.setFilter(`${layerId}-hovered`, ['==', 'OBJECTID', '']);
      }
      if (map.current.getLayer(`${layerId}-hovered-outline`)) {
        map.current.setFilter(`${layerId}-hovered-outline`, ['==', 'OBJECTID', '']);
      }
      setSelectedFeature(null);
    }

    setFeatureDrawer({
      isOpen: false,
      featureData: null,
      layerName: ''
    });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Loading indicator */}
      {Object.values(loading).some(Boolean) && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-700">Loading layers...</span>
          </div>
        </div>
      )}

      {/* Map Interaction Indicator when drawer is open */}
      {featureDrawer.isOpen && (
        <div className="absolute top-4 left-4 bg-black/20 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm border border-white/20 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Map remains interactive</span>
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
