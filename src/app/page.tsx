'use client';

import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Combobox } from '@/components/ui/combobox';
import type { ComboboxOption } from '@/components/ui/combobox';
import CommercialHouseModal from '@/components/CommercialHouseModal';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface MapLayer {
  id: number;
  name: string;
  geojson: any;
  sortOrder: number;
}

export default function HomePage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [kecamatanOptions, setKecamatanOptions] = useState<ComboboxOption[]>([]);
  const [desaOptions, setDesaOptions] = useState<ComboboxOption[]>([]);
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('');
  const [selectedDesa, setSelectedDesa] = useState<string>('');
  
  // Hover state
  const hoveredFeatureRef = useRef<{ layerId: string; featureId: any } | null>(null);
  
  // Registered commercial houses state
  const [registeredHouses, setRegisteredHouses] = useState<any>(null);
  
  // Commercial house modal state
  const [commercialHouseModal, setCommercialHouseModal] = useState<{
    isOpen: boolean;
    data: any;
    loading: boolean;
  }>({
    isOpen: false,
    data: null,
    loading: false
  });

  // Fetch Kecamatan list
  useEffect(() => {
    const fetchKecamatan = async () => {
      try {
        const response = await fetch('/api/maps/kecamatan');
        const data = await response.json();
        
        const options: ComboboxOption[] = [
          { value: '', label: '-- Select Kecamatan --' },
          ...(data.kecamatan || []).map((k: string) => ({
            value: k,
            label: k
          }))
        ];
        
        setKecamatanOptions(options);
      } catch (error) {
        console.error('Error fetching kecamatan:', error);
      }
    };

    fetchKecamatan();
  }, []);

  // Fetch Desa list based on selected Kecamatan
  useEffect(() => {
    const fetchDesa = async () => {
      // Only fetch Desa options if a Kecamatan is selected
      if (!selectedKecamatan) {
        setDesaOptions([{ value: '', label: '-- Select Kecamatan first --' }]);
        setSelectedDesa('');
        return;
      }

      try {
        const url = `/api/maps/desa?kecamatan=${encodeURIComponent(selectedKecamatan)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const options: ComboboxOption[] = [
          { value: '', label: '-- Select Desa --' },
          ...(data.desa || []).map((d: string) => ({
            value: d,
            label: d
          }))
        ];
        
        setDesaOptions(options);
        
        // Reset desa selection when kecamatan changes
        setSelectedDesa('');
      } catch (error) {
        console.error('Error fetching desa:', error);
        setDesaOptions([{ value: '', label: '-- Error loading Desa --' }]);
      }
    };

    fetchDesa();
  }, [selectedKecamatan]);

  // Fetch all map layers
  useEffect(() => {
    const fetchLayers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/maps');
        const data = await response.json();
        setLayers(data);
      } catch (error) {
        console.error('Error fetching layers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLayers();
  }, []);

  // Fetch registered commercial houses
  useEffect(() => {
    const fetchRegisteredHouses = async () => {
      try {
        const response = await fetch('/api/commercial-houses?limit=10000');
        const data = await response.json();
        
        // Convert to GeoJSON
        const features = data.data
          .filter((house: any) => house.geometry)
          .map((house: any) => ({
            type: 'Feature',
            geometry: house.geometry,
            properties: {
              id: house.id,
              idSrk: house.idSrk,
              kawasanPerumahan: house.kawasanPerumahan,
              alamat: house.alamat,
              kecamatan: house.kecamatan,
              kelurahanDesa: house.kelurahanDesa,
              namaPengembang: house.namaPengembang,
              noIzin: house.noIzin,
              penutupLahan: house.penutupLahan,
              rawanBencana: house.rawanBencana,
              rencanaPolaRuang: house.rencanaPolaRuang,
              koordinat: house.koordinat,
              _featureId: house.id
            }
          }));

        const geojson = {
          type: 'FeatureCollection',
          features: features
        };

        setRegisteredHouses(geojson);
        console.log('Loaded registered houses:', features.length);
      } catch (error) {
        console.error('Error fetching registered commercial houses:', error);
      }
    };

    fetchRegisteredHouses();
  }, []);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [107.4439, -6.5569], // Purwakarta center
      zoom: 10,
      attributionControl: false
    });

    map.current.on('load', () => {
      setMapReady(true);
      console.log('Map loaded');
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Load layers when map is ready
  useEffect(() => {
    if (!mapReady || !map.current || layers.length === 0) return;

    // Remove existing layers and sources
    const style = map.current.getStyle();
    if (style && style.layers) {
      style.layers.forEach((layer) => {
        if (layer.id.startsWith('map-layer-')) {
          if (map.current!.getLayer(layer.id)) {
            map.current!.removeLayer(layer.id);
          }
        }
      });
    }

    if (style && style.sources) {
      Object.keys(style.sources).forEach((sourceId) => {
        if (sourceId.startsWith('map-source-')) {
          if (map.current!.getSource(sourceId)) {
            map.current!.removeSource(sourceId);
          }
        }
      });
    }

    // Add layers in order (sorted by sortOrder from API)
    layers.forEach((layer, index) => {
      const sourceId = `map-source-${layer.id}`;
      const layerId = `map-layer-${layer.id}`;
      const outlineLayerId = `map-layer-${layer.id}-outline`;

      try {
        // Add source
        if (!map.current!.getSource(sourceId)) {
          map.current!.addSource(sourceId, {
            type: 'geojson',
            data: layer.geojson
          });
        }

        // Determine geometry type
        const features = layer.geojson.features || [];
        const hasPolygons = features.some((f: any) => 
          f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
        );
        const hasLines = features.some((f: any) => 
          f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString'
        );
        const hasPoints = features.some((f: any) => 
          f.geometry?.type === 'Point' || f.geometry?.type === 'MultiPoint'
        );

        // Generate color based on layer index
        const colors = [
          '#4a90e2', '#e67e22', '#16a085', '#c0392b', 
          '#8e44ad', '#27ae60', '#f39c12', '#e74c3c'
        ];
        const color = colors[index % colors.length];
        const outlineColor = darkenColor(color, 0.3);

        // Add polygon layers
        if (hasPolygons) {
          // Ensure features have unique IDs for filtering
          const geojsonWithIds = {
            ...layer.geojson,
            features: layer.geojson.features.map((f: any, idx: number) => ({
              ...f,
              properties: {
                ...f.properties,
                _featureId: f.properties?._featureId || f.properties?.OBJECTID || f.properties?.id || idx
              }
            }))
          };

          // Update source with IDs
          const source = map.current!.getSource(sourceId) as mapboxgl.GeoJSONSource;
          if (source && typeof source.setData === 'function') {
            source.setData(geojsonWithIds);
          }

          if (!map.current!.getLayer(layerId)) {
            map.current!.addLayer({
              id: layerId,
              type: 'fill',
              source: sourceId,
              paint: {
                'fill-color': color,
                'fill-opacity': 0.3
              },
              filter: createFilter()
            });
          }

          if (!map.current!.getLayer(outlineLayerId)) {
            map.current!.addLayer({
              id: outlineLayerId,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': outlineColor,
                'line-width': 1
              },
              filter: createFilter()
            });
          }

          // Add hover layer (darker fill)
          const hoverLayerId = `map-layer-${layer.id}-hover`;
          if (!map.current!.getLayer(hoverLayerId)) {
            map.current!.addLayer({
              id: hoverLayerId,
              type: 'fill',
              source: sourceId,
              paint: {
                'fill-color': darkenColor(color, 0.5),
                'fill-opacity': 0.6
              },
              filter: ['==', ['get', '_featureId'], '']
            });
          }

          // Add hover outline layer (thicker and darker)
          const hoverOutlineLayerId = `map-layer-${layer.id}-hover-outline`;
          if (!map.current!.getLayer(hoverOutlineLayerId)) {
            map.current!.addLayer({
              id: hoverOutlineLayerId,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': darkenColor(outlineColor, 0.3),
                'line-width': 2
              },
              filter: ['==', ['get', '_featureId'], '']
            });
          }
        }

        // Add line layers
        if (hasLines && !hasPolygons) {
          // Ensure features have unique IDs
          const geojsonWithIds = {
            ...layer.geojson,
            features: layer.geojson.features.map((f: any, idx: number) => ({
              ...f,
              properties: {
                ...f.properties,
                _featureId: f.properties?._featureId || f.properties?.OBJECTID || f.properties?.id || idx
              }
            }))
          };

          const source = map.current!.getSource(sourceId) as mapboxgl.GeoJSONSource;
          if (source && typeof source.setData === 'function') {
            source.setData(geojsonWithIds);
          }

          if (!map.current!.getLayer(layerId)) {
            map.current!.addLayer({
              id: layerId,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': color,
                'line-width': 2
              },
              filter: createFilter()
            });
          }

          // Add hover layer for lines
          const hoverLayerId = `map-layer-${layer.id}-hover`;
          if (!map.current!.getLayer(hoverLayerId)) {
            map.current!.addLayer({
              id: hoverLayerId,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': darkenColor(color, 0.5),
                'line-width': 4
              },
              filter: ['==', ['get', '_featureId'], '']
            });
          }
        }

        // Add point layers
        if (hasPoints && !hasPolygons && !hasLines) {
          // Ensure features have unique IDs
          const geojsonWithIds = {
            ...layer.geojson,
            features: layer.geojson.features.map((f: any, idx: number) => ({
              ...f,
              properties: {
                ...f.properties,
                _featureId: f.properties?._featureId || f.properties?.OBJECTID || f.properties?.id || idx
              }
            }))
          };

          const source = map.current!.getSource(sourceId) as mapboxgl.GeoJSONSource;
          if (source && typeof source.setData === 'function') {
            source.setData(geojsonWithIds);
          }

          if (!map.current!.getLayer(layerId)) {
            map.current!.addLayer({
              id: layerId,
              type: 'circle',
              source: sourceId,
              paint: {
                'circle-radius': 6,
                'circle-color': color,
                'circle-stroke-width': 2,
                'circle-stroke-color': outlineColor
              },
              filter: createFilter()
            });
          }

          // Add hover layer for points
          const hoverLayerId = `map-layer-${layer.id}-hover`;
          if (!map.current!.getLayer(hoverLayerId)) {
            map.current!.addLayer({
              id: hoverLayerId,
              type: 'circle',
              source: sourceId,
              paint: {
                'circle-radius': 8,
                'circle-color': darkenColor(color, 0.5),
                'circle-stroke-width': 3,
                'circle-stroke-color': darkenColor(outlineColor, 0.3)
              },
              filter: ['==', ['get', '_featureId'], '']
            });
          }
        }

        // Add click handler for feature info
        map.current!.on('click', layerId, async (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const properties = feature.properties || {};
            
            // Check if this is the "Sebaran Rumah Komersil" layer
            const isCommercialLayer = layer.name.toLowerCase().includes('rumah komersil') || 
                                      layer.name.toLowerCase().includes('sebaran rumah');
            
            if (isCommercialLayer && feature.geometry) {
              // Open modal and fetch commercial house data
              setCommercialHouseModal({
                isOpen: true,
                data: null,
                loading: true
              });

              try {
                const response = await fetch('/api/commercial-houses/by-geometry', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    geometry: feature.geometry
                  })
                });

                if (response.ok) {
                  const data = await response.json();
                  setCommercialHouseModal({
                    isOpen: true,
                    data: data,
                    loading: false
                  });
                } else {
                  // If no match found, show error
                  setCommercialHouseModal({
                    isOpen: true,
                    data: null,
                    loading: false
                  });
                  // console.error('No matching commercial house found');
                }
              } catch (error) {
                console.error('Error fetching commercial house data:', error);
                setCommercialHouseModal({
                  isOpen: true,
                  data: null,
                  loading: false
                });
              }
            } else {
              // For other layers, show regular popup
              let popupContent = `<div class="font-bold mb-2">${layer.name}</div>`;
              popupContent += '<div class="text-sm">';
              Object.entries(properties).forEach(([key, value]) => {
                if (key !== 'geometry' && key !== '_featureId') {
                  popupContent += `<div><strong>${key}:</strong> ${value}</div>`;
                }
              });
              popupContent += '</div>';

              new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(popupContent)
                .addTo(map.current!);
            }
          }
        });

        // Change cursor on hover
        map.current!.on('mouseenter', layerId, () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });

        map.current!.on('mouseleave', layerId, () => {
          map.current!.getCanvas().style.cursor = '';
        });

      } catch (error) {
        console.error(`Error loading layer ${layer.name}:`, error);
      }
    });

    // Set up global hover effect handler
    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!map.current || !map.current.isStyleLoaded()) return;

      // Get all visible layer IDs
      const visibleLayerIds = layers
        .map(l => `map-layer-${l.id}`)
        .filter(id => map.current!.getLayer(id));

      if (visibleLayerIds.length === 0) {
        clearHover();
        return;
      }

      // Query features at the mouse position
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: visibleLayerIds
      });

      if (features.length > 0) {
        const feature = features[0];
        if (!feature.layer) return;
        
        const layerId = feature.layer.id;
        const featureId = feature.properties?._featureId || feature.properties?.OBJECTID || feature.properties?.id || feature.id;

        // Only update if hovering over a different feature
        if (!hoveredFeatureRef.current || 
            hoveredFeatureRef.current.layerId !== layerId || 
            hoveredFeatureRef.current.featureId !== featureId) {
          
          // Clear previous hover
          clearHover();

          // Set new hover
          const hoverLayerId = `${layerId}-hover`;
          const hoverOutlineLayerId = `${layerId}-hover-outline`;

          if (map.current.getLayer(hoverLayerId)) {
            map.current.setFilter(hoverLayerId, ['==', ['get', '_featureId'], featureId]);
          }

          if (map.current.getLayer(hoverOutlineLayerId)) {
            map.current.setFilter(hoverOutlineLayerId, ['==', ['get', '_featureId'], featureId]);
          }

          hoveredFeatureRef.current = { layerId, featureId };
        }

        map.current.getCanvas().style.cursor = 'pointer';
      } else {
        clearHover();
        map.current.getCanvas().style.cursor = '';
      }
    };

    const clearHover = () => {
      if (!map.current || !hoveredFeatureRef.current) return;

      const { layerId } = hoveredFeatureRef.current;
      const hoverLayerId = `${layerId}-hover`;
      const hoverOutlineLayerId = `${layerId}-hover-outline`;

      if (map.current.getLayer(hoverLayerId)) {
        map.current.setFilter(hoverLayerId, ['==', ['get', '_featureId'], '']);
      }

      if (map.current.getLayer(hoverOutlineLayerId)) {
        map.current.setFilter(hoverOutlineLayerId, ['==', ['get', '_featureId'], '']);
      }

      hoveredFeatureRef.current = null;
    };

    // Add mousemove listener
    map.current.on('mousemove', handleMouseMove);

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.off('mousemove', handleMouseMove);
      }
    };

  }, [mapReady, layers, selectedKecamatan, selectedDesa]);

  // Load registered commercial houses layer (always on top)
  useEffect(() => {
    if (!mapReady || !map.current || !registeredHouses || registeredHouses.features.length === 0) return;

    const sourceId = 'registered-houses-source';
    const layerId = 'registered-houses-layer';
    const outlineLayerId = 'registered-houses-outline';
    const hoverLayerId = 'registered-houses-hover';
    const hoverOutlineLayerId = 'registered-houses-hover-outline';

    try {
      // Remove existing layers if they exist
      if (map.current.getLayer(hoverOutlineLayerId)) map.current.removeLayer(hoverOutlineLayerId);
      if (map.current.getLayer(hoverLayerId)) map.current.removeLayer(hoverLayerId);
      if (map.current.getLayer(outlineLayerId)) map.current.removeLayer(outlineLayerId);
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

      // Add source
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: registeredHouses
      });

      // Add fill layer with bright green color
      map.current.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#2ecc71', // Bright green
          'fill-opacity': 0.5
        }
      });

      // Add outline layer
      map.current.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#27ae60', // Darker green
          'line-width': 2
        }
      });

      // Add hover fill layer
      map.current.addLayer({
        id: hoverLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#1a8f4f',
          'fill-opacity': 0.7
        },
        filter: ['==', ['get', '_featureId'], '']
      });

      // Add hover outline layer
      map.current.addLayer({
        id: hoverOutlineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#0d5e34',
          'line-width': 3
        },
        filter: ['==', ['get', '_featureId'], '']
      });

      // Add click handler
      map.current.on('click', layerId, async (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const houseId = feature.properties?.id;

          if (houseId) {
            // Open modal with loading state
            setCommercialHouseModal({
              isOpen: true,
              data: null,
              loading: true
            });

            try {
              // Fetch full commercial house data
              const response = await fetch(`/api/commercial-houses/${houseId}`);
              if (response.ok) {
                const houseData = await response.json();
                setCommercialHouseModal({
                  isOpen: true,
                  data: houseData,
                  loading: false
                });
              } else {
                console.error('Failed to fetch commercial house data');
                setCommercialHouseModal({
                  isOpen: true,
                  data: null,
                  loading: false
                });
              }
            } catch (error) {
              console.error('Error fetching commercial house data:', error);
              setCommercialHouseModal({
                isOpen: true,
                data: null,
                loading: false
              });
            }
          }
        }
      });

      // Add hover handlers
      map.current.on('mouseenter', layerId, (e) => {
        map.current!.getCanvas().style.cursor = 'pointer';
        
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const featureId = feature.properties?._featureId;
          
          if (featureId) {
            map.current!.setFilter(hoverLayerId, ['==', ['get', '_featureId'], featureId]);
            map.current!.setFilter(hoverOutlineLayerId, ['==', ['get', '_featureId'], featureId]);
          }
        }
      });

      map.current.on('mouseleave', layerId, () => {
        map.current!.getCanvas().style.cursor = '';
        map.current!.setFilter(hoverLayerId, ['==', ['get', '_featureId'], '']);
        map.current!.setFilter(hoverOutlineLayerId, ['==', ['get', '_featureId'], '']);
      });

      console.log('Registered commercial houses layer loaded successfully');
    } catch (error) {
      console.error('Error loading registered commercial houses layer:', error);
    }

    return () => {
      // Cleanup on unmount
      if (map.current) {
        if (map.current.getLayer(hoverOutlineLayerId)) map.current.removeLayer(hoverOutlineLayerId);
        if (map.current.getLayer(hoverLayerId)) map.current.removeLayer(hoverLayerId);
        if (map.current.getLayer(outlineLayerId)) map.current.removeLayer(outlineLayerId);
        if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
        if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
      }
    };
  }, [mapReady, registeredHouses]);

  // Apply filters when selection changes
  useEffect(() => {
    if (!mapReady || !map.current) return;

    const filter = createFilter();
    
    // Update all layers with new filter
    layers.forEach((layer) => {
      const layerId = `map-layer-${layer.id}`;
      const outlineLayerId = `map-layer-${layer.id}-outline`;
      
      if (map.current!.getLayer(layerId)) {
        map.current!.setFilter(layerId, filter);
      }
      if (map.current!.getLayer(outlineLayerId)) {
        map.current!.setFilter(outlineLayerId, filter);
      }
      
      // Note: Hover layers don't get the geo filter, they use feature ID filter
    });

    // Zoom to filtered area if filters are applied
    if (selectedKecamatan) {
      zoomToFilteredArea();
    }
  }, [selectedKecamatan, selectedDesa, mapReady, layers]);

  // Create filter expression based on selections
  const createFilter = (): any[] => {
    const conditions: any[] = ['all'];

    // Only apply filters if Kecamatan is selected
    if (selectedKecamatan) {
      conditions.push(['==', ['get', 'WADMKC'], selectedKecamatan]);

      // Only apply Desa filter if it's selected (requires Kecamatan to be selected first)
      if (selectedDesa) {
        conditions.push(['==', ['get', 'WADMKD'], selectedDesa]);
      }
    }

    return conditions.length > 1 ? conditions : ['all'];
  };

  // Zoom to filtered area
  const zoomToFilteredArea = () => {
    if (!map.current) return;

    try {
      // Find administrative layer to zoom to
      const adminLayer = layers.find(l => 
        l.name.toLowerCase().includes('administrasi') || 
        l.name.toLowerCase().includes('administrative')
      );

      if (!adminLayer) return;

      const features = adminLayer.geojson.features || [];
      const filteredFeatures = features.filter((f: any) => {
        if (selectedDesa) {
          return f.properties?.WADMKC === selectedKecamatan && 
                 f.properties?.WADMKD === selectedDesa;
        } else if (selectedKecamatan) {
          return f.properties?.WADMKC === selectedKecamatan;
        }
        return true;
      });

      if (filteredFeatures.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        
        filteredFeatures.forEach((feature: any) => {
          if (feature.geometry) {
            const coords = getCoordinates(feature.geometry);
            coords.forEach((coord: [number, number]) => {
              bounds.extend(coord);
            });
          }
        });

        if (!bounds.isEmpty()) {
          map.current!.fitBounds(bounds, {
            padding: 50,
            duration: 1000
          });
        }
      }
    } catch (error) {
      console.error('Error zooming to filtered area:', error);
    }
  };

  // Helper function to extract coordinates from geometry
  const getCoordinates = (geometry: any): [number, number][] => {
    const coords: [number, number][] = [];

    const extractCoords = (coord: any) => {
      if (Array.isArray(coord)) {
        if (typeof coord[0] === 'number' && typeof coord[1] === 'number') {
          coords.push([coord[0], coord[1]]);
        } else {
          coord.forEach(extractCoords);
        }
      }
    };

    if (geometry.coordinates) {
      extractCoords(geometry.coordinates);
    }

    return coords;
  };

  // Helper function to darken colors
  const darkenColor = (color: string, factor: number): string => {
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

  return (
    <div className="relative w-full h-screen">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Commercial House Modal */}
      <CommercialHouseModal
        isOpen={commercialHouseModal.isOpen}
        onClose={() => setCommercialHouseModal({ isOpen: false, data: null, loading: false })}
        data={commercialHouseModal.data}
        loading={commercialHouseModal.loading}
      />
      
      {/* Filters - positioned at top left, above the map */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Kecamatan Filter */}
        <div className="bg-white rounded-lg shadow-lg p-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kecamatan
          </label>
          <Combobox
            options={kecamatanOptions}
            value={selectedKecamatan}
            onValueChange={(value) => {
              setSelectedKecamatan(value);
              // Reset Desa when Kecamatan changes or is cleared
              if (value === '') {
                setSelectedDesa('');
              }
            }}
            placeholder="Select Kecamatan..."
            searchPlaceholder="Search Kecamatan..."
            emptyText="No Kecamatan found."
            width={250}
          />
        </div>

        {/* Desa Filter */}
        <div className={`bg-white rounded-lg shadow-lg p-3 transition-opacity ${!selectedKecamatan ? 'opacity-60' : 'opacity-100'}`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Desa/Kelurahan
            {!selectedKecamatan && (
              <span className="ml-1 text-xs text-gray-500 font-normal">
                (Select Kecamatan first)
              </span>
            )}
          </label>
          <Combobox
            options={desaOptions}
            value={selectedDesa}
            onValueChange={setSelectedDesa}
            placeholder={!selectedKecamatan ? "Select Kecamatan first..." : "Select Desa..."}
            searchPlaceholder="Search Desa..."
            emptyText={!selectedKecamatan ? "Please select a Kecamatan first" : "No Desa found."}
            width={250}
            disabled={!selectedKecamatan}
          />
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg font-medium text-gray-700">Loading map layers...</span>
            </div>
          </div>
        </div>
      )}

      {/* Layer Info */}
      {!loading && layers.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-bold text-sm mb-2">Active Layers ({layers.length + (registeredHouses?.features?.length > 0 ? 1 : 0)})</h3>
          <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
            {layers.map((layer, index) => {
              const colors = [
                '#4a90e2', '#e67e22', '#16a085', '#c0392b', 
                '#8e44ad', '#27ae60', '#f39c12', '#e74c3c'
              ];
              const color = colors[index % colors.length];
              
              return (
                <div key={layer.id} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border border-gray-300" 
                    style={{ backgroundColor: color, opacity: 0.6 }}
                  />
                  <span className="text-gray-700">{layer.name}</span>
                </div>
              );
            })}
            {registeredHouses && registeredHouses.features.length > 0 && (
              <div className="flex items-center gap-2 border-t pt-1 mt-1">
                <div 
                  className="w-4 h-4 rounded border border-gray-300" 
                  style={{ backgroundColor: '#2ecc71', opacity: 0.6 }}
                />
                <span className="text-gray-700 font-semibold">
                  Registered Commercial Houses ({registeredHouses.features.length})
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

