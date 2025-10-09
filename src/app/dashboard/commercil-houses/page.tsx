"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  MapPin,
  Building,
  Calendar,
  Table as TableIcon,
  Layers,
  Download
} from 'lucide-react';
import CommercialHouseForm from '@/components/CommercialHouseForm';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as XLSX from 'xlsx';

// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2F3YmVyc2luYXJtYXMiLCJhIjoiY2pzanZwaDFzMHo3djN5b2wwZ3h6dTE4NiJ9.i0GRqgAEzyvbT5h1d2NyUQ';

interface CommercialHouse {
  id: string;
  idSrk?: string;
  kawasanPerumahan?: string;
  alamat?: string;
  kecamatan?: string;
  kelurahanDesa?: string;
  namaPengembang?: string;
  noIzin?: string;
  penutupLahan?: string;
  rawanBencana?: string;
  rencanaPolaRuang?: string;
  koordinat?: string;
  geometry?: any; // GeoJSON geometry
  foto: string[];
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface MapData {
  id: number;
  name: string;
  geojson: any;
  color: string;
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
  'layer-registered-houses': {
    id: 'layer-registered-houses',
    name: 'Registered Commercial Houses',
    color: '#2ecc71', // Brighter green
    outlineColor: '#27ae60' // Medium green for outline
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
    color: '#f39c12',
    outlineColor: '#d68910'
  }
};

export default function CommercialHousesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  
  // View state
  const [currentView, setCurrentView] = useState<'table' | 'map'>('table');
  
  // Data state
  const [commercialHouses, setCommercialHouses] = useState<CommercialHouse[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState('');
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  
  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<CommercialHouse | null>(null);
  const [clickedFeatureGeometry, setClickedFeatureGeometry] = useState<any>(null);

  // Map state
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapData, setMapData] = useState<MapData[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [showBaseMap, setShowBaseMap] = useState(true);
  const [registeredGeometries, setRegisteredGeometries] = useState<Set<string>>(new Set());
  const [registeredHousesGeoJSON, setRegisteredHousesGeoJSON] = useState<any>(null);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?next=/dashboard/commercil-houses');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchKecamatanOptions();
      fetchCommercialHouses();
      if (currentView === 'map') {
        loadMapData();
      }
    }
  }, [isAuthenticated, pagination.page, searchTerm, selectedKecamatan, currentView]);

  // Load map data when switching to map view
  useEffect(() => {
    if (currentView === 'map' && isAuthenticated && !mapData.length) {
      loadMapData();
    }
  }, [currentView, isAuthenticated, mapData.length]);

  // Clean up map layers and sources
  const cleanupMap = useCallback(() => {
    if (!map.current) return;
    
    try {
      // Remove all custom layers
      const layersToRemove = [
        'layer-peta-administrasi-fill',
        'layer-peta-administrasi-outline',
        'layer-peta-administrasi-highlighted',
        'layer-peta-administrasi-highlighted-outline',
        'layer-sebaran-rumah-komersil-fill',
        'layer-sebaran-rumah-komersil-outline',
        'layer-sebaran-rumah-komersil-highlighted',
        'layer-sebaran-rumah-komersil-highlighted-outline',
        'layer-registered-houses-fill',
        'layer-registered-houses-outline',
        'layer-registered-houses-highlighted',
        'layer-registered-houses-highlighted-outline',
        'layer-kawasan-lahan-terbangun-fill',
        'layer-kawasan-lahan-terbangun-outline',
        'layer-kawasan-lahan-terbangun-highlighted',
        'layer-kawasan-lahan-terbangun-highlighted-outline',
        'layer-kawasan-rawan-bencana-fill',
        'layer-kawasan-rawan-bencana-outline',
        'layer-kawasan-rawan-bencana-highlighted',
        'layer-kawasan-rawan-bencana-highlighted-outline',
        'layer-kawasan-rencana-pola-ruang-fill',
        'layer-kawasan-rencana-pola-ruang-outline',
        'layer-kawasan-rencana-pola-ruang-highlighted',
        'layer-kawasan-rencana-pola-ruang-highlighted-outline',
        'layer-kemiringan-lereng-fill',
        'layer-kemiringan-lereng-outline',
        'layer-kemiringan-lereng-highlighted',
        'layer-kemiringan-lereng-highlighted-outline',
        // Label layers
        'layer-peta-administrasi-labels-kecamatan',
        'layer-peta-administrasi-labels-kelurahan',
        'layer-sebaran-rumah-komersil-labels-commercial',
        'layer-registered-houses-labels-commercial'
      ];

      layersToRemove.forEach(layerId => {
        if (map.current!.getLayer(layerId)) {
          map.current!.removeLayer(layerId);
        }
      });

      // Remove all custom sources
      const sourcesToRemove = [
        'layer-peta-administrasi',
        'layer-sebaran-rumah-komersil',
        'layer-registered-houses',
        'layer-kawasan-lahan-terbangun',
        'layer-kawasan-rawan-bencana',
        'layer-kawasan-rencana-pola-ruang',
        'layer-kemiringan-lereng',
        'layer-peta-administrasi-labels',
        'layer-sebaran-rumah-komersil-labels',
        'layer-registered-houses-labels'
      ];

      sourcesToRemove.forEach(sourceId => {
        if (map.current!.getSource(sourceId)) {
          map.current!.removeSource(sourceId);
        }
      });

      console.log('Map cleanup completed');
    } catch (error) {
      console.error('Error during map cleanup:', error);
    }
  }, []);

  // Clean up map when switching away from map view
  useEffect(() => {
    if (currentView !== 'map' && map.current) {
      cleanupMap();
    }
  }, [currentView, cleanupMap]);

  // Initialize map
  useEffect(() => {
    if (currentView !== 'map' || map.current) return;

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

        map.current.on('error', (_e: any) => {
          // console.error('Map error:', e);
          // setMapError('Map failed to load');
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        console.log('Map initialized successfully');
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map');
      }
    }

    return () => {
      if (map.current) {
        console.log('Cleaning up map...');
        cleanupMap();
        map.current.remove();
        map.current = null;
        setMapReady(false);
      }
    };
  }, [currentView, showBaseMap, cleanupMap]);


  const fetchKecamatanOptions = async () => {
    try {
      const response = await fetch('/api/maps/kecamatan');
      const data = await response.json();
      
      if (response.ok) {
        setKecamatanOptions(data.kecamatan || []);
      } else {
        console.error('Error fetching kecamatan options:', data.error);
      }
    } catch (error) {
      console.error('Error fetching kecamatan options:', error);
    }
  };

  const fetchCommercialHouses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedKecamatan && { kecamatan: selectedKecamatan }),
      });

      const response = await fetch(`/api/commercial-houses?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCommercialHouses(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Error fetching commercial houses:', data.error);
      }
    } catch (error) {
      console.error('Error fetching commercial houses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this commercial house?')) {
      return;
    }

    try {
      const response = await fetch(`/api/commercial-houses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCommercialHouses(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting commercial house:', error);
      alert('Failed to delete commercial house');
    }
  };

  const handleEdit = (house: CommercialHouse) => {
    setEditingHouse(house);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async () => {
    setIsFormOpen(false);
    setEditingHouse(null);
    setClickedFeatureGeometry(null); // Clear geometry
    fetchCommercialHouses(); // Refresh the list
    
    // Reload registered geometries and update the green layer if in map view
    if (currentView === 'map') {
      console.log('Form submitted in map view, updating registered houses layer...');
      await loadRegisteredGeometries(); // This will trigger the useEffect to reload the green layer
      console.log('✅ Registered houses layer will be updated');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    fetchCommercialHouses();
  };

  const handleExportToExcel = async () => {
    setExporting(true);
    try {
      // Fetch all commercial houses (no pagination)
      const response = await fetch('/api/commercial-houses?limit=100000');
      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        alert('No data to export');
        return;
      }

      // Prepare data for Excel
      const excelData = data.data.map((house: CommercialHouse) => ({
        'ID SRK': house.idSrk || '',
        'Kawasan Perumahan': house.kawasanPerumahan || '',
        'Alamat': house.alamat || '',
        'Kecamatan': house.kecamatan || '',
        'Kelurahan/Desa': house.kelurahanDesa || '',
        'Nama Pengembang': house.namaPengembang || '',
        'No. Izin': house.noIzin || '',
        'Penutup Lahan': house.penutupLahan || '',
        'Rawan Bencana': house.rawanBencana || '',
        'Rencana Pola Ruang': house.rencanaPolaRuang || '',
        'Koordinat': house.koordinat || '',
        'Jumlah Foto': house.foto?.length || 0,
        'Tanggal Dibuat': new Date(house.createdAt).toLocaleString('id-ID'),
        'Terakhir Diupdate': new Date(house.updatedAt).toLocaleString('id-ID'),
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const columnWidths = [
        { wch: 15 }, // ID SRK
        { wch: 25 }, // Kawasan Perumahan
        { wch: 35 }, // Alamat
        { wch: 20 }, // Kecamatan
        { wch: 20 }, // Kelurahan/Desa
        { wch: 25 }, // Nama Pengembang
        { wch: 20 }, // No. Izin
        { wch: 20 }, // Penutup Lahan
        { wch: 20 }, // Rawan Bencana
        { wch: 25 }, // Rencana Pola Ruang
        { wch: 20 }, // Koordinat
        { wch: 12 }, // Jumlah Foto
        { wch: 20 }, // Tanggal Dibuat
        { wch: 20 }, // Terakhir Diupdate
      ];
      ws['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Commercial Houses');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `commercial-houses-${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
      
      console.log(`Exported ${excelData.length} records to ${filename}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  // Map functions
  const loadMapData = async () => {
    try {
      setMapLoading(true);
      console.log('Loading map data from API...');
      
      // Load registered geometries FIRST before loading map data
      console.log('Loading registered geometries first...');
      await loadRegisteredGeometries();
      
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
      
      // Initialize all layers as visible
      setVisibleLayers(new Set(allLayerIds));
    } catch (err: any) {
      console.error('Error loading map data:', err);
      setMapError(err?.message || 'Failed to load map data');
    } finally {
      setMapLoading(false);
    }
  };

  // Load registered commercial house geometries and create GeoJSON layer
  const loadRegisteredGeometries = async (): Promise<Set<string>> => {
    try {
      const response = await fetch('/api/commercial-houses?limit=10000');
      if (!response.ok) throw new Error('Failed to load commercial houses');
      const data = await response.json();
      
      console.log('📊 Commercial houses from DB:', data.data.length);
      
      const geometrySet = new Set<string>();
      const features: any[] = [];
      
      data.data.forEach((house: CommercialHouse, index: number) => {
        if (house.geometry) {
          // Normalize geometry by keeping only type and coordinates
          const normalizedGeometry = {
            type: house.geometry.type,
            coordinates: house.geometry.coordinates
          };
          const geometryString = JSON.stringify(normalizedGeometry);
          geometrySet.add(geometryString);
          
          // Create GeoJSON feature
          features.push({
            type: 'Feature',
            geometry: house.geometry,
            properties: {
              id: house.id,
              kawasanPerumahan: house.kawasanPerumahan,
              alamat: house.alamat,
              kecamatan: house.kecamatan,
              kelurahanDesa: house.kelurahanDesa,
              namaPengembang: house.namaPengembang,
              isRegistered: true
            }
          });
          
          // Log details of first few
          if (index < 3) {
            console.log(`DB House ${index}:`, {
              id: house.id,
              kawasan: house.kawasanPerumahan,
              hasGeometry: !!house.geometry,
              geometryType: house.geometry?.type
            });
          }
        }
      });
      
      // Create GeoJSON FeatureCollection
      const geoJSON = {
        type: 'FeatureCollection',
        features: features
      };
      
      console.log('✅ Created GeoJSON with', features.length, 'registered houses');
      setRegisteredHousesGeoJSON(geoJSON);
      setRegisteredGeometries(geometrySet);
      return geometrySet;
    } catch (err: any) {
      console.error('Error loading registered geometries:', err);
      return new Set<string>();
    }
  };

  // Check if a geometry is already registered
  const checkGeometryRegistered = useCallback(async (geometry: any): Promise<CommercialHouse | null> => {
    try {
      const response = await fetch('/api/commercial-houses/by-geometry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geometry })
      });
      
      if (response.ok) {
        const house = await response.json();
        return house;
      }
      return null;
    } catch (error) {
      console.error('Error checking geometry registration:', error);
      return null;
    }
  }, []);

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
          const area = calculatePolygonArea(feature.geometry.coordinates);
          const areaText = area ? `${Math.round(area)} m²` : '';
          const combinedLabel = areaText ? `${areaText}` : '';
          
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
        console.log(`Updating existing source: ${layerId}`);
        const source = map.current.getSource(layerId) as mapboxgl.GeoJSONSource;
        if (source.setData) {
          source.setData(geojsonData);
        }
      } else {
        console.log(`Adding new source: ${layerId}`);
        map.current.addSource(layerId, {
          type: 'geojson',
          data: geojsonData
        });
      }

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
        // Use higher opacity for registered houses to make them stand out
        const fillOpacity = layerId === 'layer-registered-houses' ? 0.6 : 0.3;
        
        map.current.addLayer({
          id: `${layerId}-fill`,
          type: 'fill',
          source: layerId,
          paint: {
            'fill-color': config.color,
            'fill-opacity': fillOpacity
          }
        });
      }

      // Add outline layer
      if (!map.current.getLayer(`${layerId}-outline`)) {
        // Use thicker outline for registered houses
        const lineWidth = layerId === 'layer-registered-houses' ? 2 : 1;
        
        map.current.addLayer({
          id: `${layerId}-outline`,
          type: 'line',
          source: layerId,
          paint: {
            'line-color': config.outlineColor,
            'line-width': lineWidth
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
      if (layerId === 'layer-sebaran-rumah-komersil' || layerId === 'layer-registered-houses') {
        addCommercialBuildingLabels(layerId, geojsonData);
      }

      // Add labels for administrative layer
      if (layerId === 'layer-peta-administrasi') {
        addAdministrativeLabels(layerId, geojsonData);
      }

      // Set up click events (skip for administrative layer)
      if (layerId !== 'layer-peta-administrasi') {
        map.current.on('click', `${layerId}-fill`, async (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const featureId = feature.properties?.OBJECTID;
            
            if (featureId) {
              // Highlight the clicked feature
              map.current!.setFilter(`${layerId}-highlighted`, ['==', 'OBJECTID', featureId]);
              map.current!.setFilter(`${layerId}-highlighted-outline`, ['==', 'OBJECTID', featureId]);
              
              console.log('Feature clicked:', feature.properties);
              
              // If it's the registered houses layer, open in edit mode directly
              if (layerId === 'layer-registered-houses') {
                const houseId = feature.properties?.id;
                if (houseId) {
                  // Fetch the full house data
                  const house = commercialHouses.find(h => h.id === houseId);
                  if (house) {
                    console.log('Opening registered house for edit:', house);
                    setEditingHouse(house);
                    setClickedFeatureGeometry(null);
                    setIsFormOpen(true);
                  } else {
                    // If not in current list, fetch it
                    try {
                      const response = await fetch(`/api/commercial-houses/${houseId}`);
                      if (response.ok) {
                        const houseData = await response.json();
                        setEditingHouse(houseData);
                        setClickedFeatureGeometry(null);
                        setIsFormOpen(true);
                      }
                    } catch (error) {
                      console.error('Error fetching house:', error);
                    }
                  }
                }
              }
              
              // If it's the sebaran rumah komersil layer, check if registered and open form
              if (layerId === 'layer-sebaran-rumah-komersil') {
                const existingHouse = await checkGeometryRegistered(feature.geometry);
                
                if (existingHouse) {
                  // Open in edit mode
                  console.log('Opening existing house for edit:', existingHouse);
                  setEditingHouse(existingHouse);
                  setClickedFeatureGeometry(null);
                } else {
                  // Open in create mode
                  console.log('Opening form for new house');
                  setClickedFeatureGeometry(feature.geometry);
                  setEditingHouse(null);
                }
                setIsFormOpen(true);
              }
            }
          }
        });
      }

      // Add hover effects (skip for administrative layer)
      if (layerId !== 'layer-peta-administrasi') {
        map.current.on('mouseenter', `${layerId}-fill`, () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', `${layerId}-fill`, () => {
          map.current!.getCanvas().style.cursor = '';
        });
      }

      console.log(`Layer ${layerId} loaded successfully`);
    } catch (error) {
      console.error(`Error loading layer ${layerId}:`, error);
    }
  }, [addCommercialBuildingLabels, addAdministrativeLabels, registeredGeometries, checkGeometryRegistered]);

  const toggleBaseMap = () => {
    setShowBaseMap(!showBaseMap);
  };

  // Toggle layer visibility
  const toggleLayerVisibility = (layerId: string) => {
    setVisibleLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      
      // Update map layer visibility
      if (map.current) {
        const visible = newSet.has(layerId);
        const layerIds = [
          `${layerId}-fill`,
          `${layerId}-outline`,
          `${layerId}-highlighted`,
          `${layerId}-highlighted-outline`,
          `${layerId}-labels-commercial`,
          `${layerId}-labels-kecamatan`,
          `${layerId}-labels-kelurahan`
        ];
        
        layerIds.forEach(id => {
          if (map.current!.getLayer(id)) {
            map.current!.setLayoutProperty(
              id,
              'visibility',
              visible ? 'visible' : 'none'
            );
          }
        });
      }
      
      return newSet;
    });
  };

  // Helper function to darken color for outline
  const darkenColor = useCallback((hex: string, percent: number = 30): string => {
    try {
      const num = parseInt(hex.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.max(0, ((num >> 16) & 0xFF) - amt);
      const G = Math.max(0, ((num >> 8) & 0xFF) - amt);
      const B = Math.max(0, (num & 0xFF) - amt);
      return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
    } catch {
      return '#000000'; // fallback to black
    }
  }, []);

  // Load layers when map is ready and data is available
  useEffect(() => {
    if (currentView !== 'map' || !mapReady || !map.current || mapData.length === 0) return;

    console.log('Loading layers for commercial houses map...');
    console.log('Map data:', mapData);
    console.log('Selected layers:', selectedLayers);
    console.log('Registered geometries count:', registeredGeometries.size);

    // Sort map data by sortOrder
    const sortedMapData = [...mapData].sort((a, b) => a.sortOrder - b.sortOrder);
    
    // Load each layer in order
    sortedMapData.forEach((mapItem, index) => {
      const layerId = `layer-${mapItem.name.toLowerCase().replace(/\s+/g, '-')}`;
      
      // Create dynamic config from map data
      const config: LayerConfig = {
        id: layerId,
        name: mapItem.name,
        color: mapItem.color || '#3388ff', // Use color from DB or fallback
        outlineColor: darkenColor(mapItem.color || '#3388ff', 30) // Darker outline
      };
      
      if (mapItem.geojson) {
        console.log(`Loading layer: ${layerId} (${mapItem.name}) with color: ${config.color}`);
        loadLayer(layerId, mapItem.geojson, config, index + 1);
      } else {
        console.log(`No GeoJSON found for layer: ${layerId} (${mapItem.name})`);
      }
    });
  }, [currentView, mapReady, mapData, selectedLayers, loadLayer, registeredGeometries, darkenColor]);

  // Load registered houses layer when GeoJSON is available
  useEffect(() => {
    if (currentView !== 'map' || !mapReady || !map.current || !registeredHousesGeoJSON) return;

    console.log('Loading registered houses layer...');
    const layerId = 'layer-registered-houses';
    const config = layerConfigs[layerId];
    
    if (config && registeredHousesGeoJSON) {
      loadLayer(layerId, registeredHousesGeoJSON, config, 999); // High order to render on top
    }
  }, [currentView, mapReady, registeredHousesGeoJSON, loadLayer]);

  if (!isClient || isLoading) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <div className="text-center text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <div className="text-center text-gray-600">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Commercial Houses
          </h1>
          <div className="text-sm text-gray-500">
            {currentView === 'table' ? `${pagination.total} total` : `${mapData.length} layers loaded`}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={currentView === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('table')}
              className="flex items-center"
            >
              <TableIcon className="mr-2 h-4 w-4" />
              Table
            </Button>
            <Button
              variant={currentView === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('map')}
              className="flex items-center"
            >
              <Layers className="mr-2 h-4 w-4" />
              Map
            </Button>
          </div>

          {/* Map Controls - only show in map view */}
          {currentView === 'map' && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleBaseMap}
              className="flex items-center"
            >
              <Layers className="mr-2 h-4 w-4" />
              {showBaseMap ? 'Hide' : 'Show'} Base Map
            </Button>
          )}
          
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingHouse(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Commercial House
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingHouse ? 'Edit Commercial House' : 'Add New Commercial House'}
                </DialogTitle>
              </DialogHeader>
              <CommercialHouseForm
                house={editingHouse}
                geometry={clickedFeatureGeometry}
                onSuccess={handleFormSubmit}
                onCancel={() => {
                  setIsFormOpen(false);
                  setClickedFeatureGeometry(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'table' ? (
          <div className="h-full overflow-y-auto p-6">
            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <form onSubmit={handleSearch} className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by address, developer, or permit number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="w-48">
                    <select
                      value={selectedKecamatan}
                      onChange={(e) => setSelectedKecamatan(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Kecamatan</option>
                      {kecamatanOptions.map((kecamatan) => (
                        <option key={kecamatan} value={kecamatan}>
                          {kecamatan}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Commercial Houses ({pagination.total} total)</CardTitle>
                  <Button 
                    onClick={handleExportToExcel}
                    disabled={exporting || loading}
                    variant="outline"
                    size="sm"
                  >
                    {exporting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export to Excel
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : commercialHouses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No commercial houses found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Address</TableHead>
                          <TableHead>Kawasan</TableHead>
                          <TableHead>Kecamatan</TableHead>
                          <TableHead>Developer</TableHead>
                          <TableHead>Permit No.</TableHead>
                          <TableHead>Photos</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="w-[50px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commercialHouses.map((house) => (
                          <TableRow key={house.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="truncate max-w-[200px]" title={house.alamat}>
                                  {house.alamat || 'N/A'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="truncate max-w-[150px]" title={house.kawasanPerumahan}>
                                {house.kawasanPerumahan || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{house.kecamatan || 'N/A'}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-gray-400" />
                                <span className="truncate max-w-[150px]" title={house.namaPengembang}>
                                  {house.namaPengembang || 'N/A'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">
                                {house.noIzin || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {house.foto.length} photo{house.foto.length !== 1 ? 's' : ''}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="h-4 w-4" />
                                {new Date(house.createdAt).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(house)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(house.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Map View */
          <div className="h-full relative">
            <div ref={mapContainer} className="w-full h-full" />
            
            {/* Map Controls */}
            <div className="absolute top-4 left-4 space-y-2">
              <Card className="p-4 bg-white/90 backdrop-blur-sm max-w-xs">
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Map Layers</div>
                  {mapData.map((mapItem) => {
                    const layerId = `layer-${mapItem.name.toLowerCase().replace(/\s+/g, '-')}`;
                    const isVisible = visibleLayers.has(layerId);
                    
                    // These layers are always visible (no toggle)
                    const alwaysVisible = layerId === 'layer-sebaran-rumah-komersil' || layerId === 'layer-peta-administrasi';
                    
                    return (
                      <div key={mapItem.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div 
                            className="w-4 h-4 rounded border flex-shrink-0"
                            style={{ backgroundColor: mapItem.color || '#ccc' }}
                          />
                          <span className={`text-xs truncate ${alwaysVisible ? 'font-medium text-gray-700' : 'text-gray-600'}`}>
                            {mapItem.name}
                          </span>
                        </div>
                        {!alwaysVisible ? (
                          <Switch
                            checked={isVisible}
                            onCheckedChange={() => toggleLayerVisibility(layerId)}
                            className="flex-shrink-0"
                          />
                        ) : (
                          <span className="text-[9px] text-gray-400 flex-shrink-0 uppercase tracking-wide">Always On</span>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Show registered houses layer if available */}
                  {registeredHousesGeoJSON && registeredHousesGeoJSON.features.length > 0 && (
                    <div className="flex items-center gap-2 border-t pt-3 mt-2">
                      <div 
                        className="w-4 h-4 rounded border-2 border-green-600 flex-shrink-0"
                        style={{ backgroundColor: '#2ecc71', opacity: 0.9 }}
                      />
                      <span className="text-xs font-medium text-green-700">
                        Registered Houses ({registeredHousesGeoJSON.features.length})
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Loading indicator */}
            {mapLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading map data...</p>
                </div>
              </div>
            )}

            {/* Error indicator */}
            {mapError && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <div className="text-center">
                  <p className="text-red-600 mb-4">{mapError}</p>
                  <Button onClick={loadMapData}>Retry</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
