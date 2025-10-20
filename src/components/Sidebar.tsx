'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sidebar as UISidebar, SidebarProvider } from '@/components/ui/sidebar';
// Statistics are shown inline on the Beranda page now

interface SidebarProps {
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
  selectedLayers: string[];
  setSelectedLayers: (layers: string[]) => void;
  showBaseMap: boolean;
  setShowBaseMap: (show: boolean) => void;
  selectedKecamatan: string;
  setSelectedKecamatan: (kecamatan: string) => void;
  selectedKelurahan: string;
  setSelectedKelurahan: (kelurahan: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ 
  activeMenu, 
  setActiveMenu, 
  selectedLayers, 
  setSelectedLayers,
  showBaseMap,
  setShowBaseMap,
  selectedKecamatan,
  setSelectedKecamatan,
  selectedKelurahan,
  setSelectedKelurahan,
  onLogout
}: SidebarProps) {
  
  // Debug state changes
  useEffect(() => {
  }, [selectedLayers]);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['layer-administrasi', 'layer-selection']); // Default expanded
  const [showKecamatanDropdown, setShowKecamatanDropdown] = useState(false);
  const [showKelurahanDropdown, setShowKelurahanDropdown] = useState(false);
  // Statistics modal removed; statistics are displayed inline on Beranda page

  const kecamatanRef = useRef<HTMLDivElement>(null);
  const kelurahanRef = useRef<HTMLDivElement>(null);

  // Layer configurations
  const layerConfigs = {
    'layer-administrasi': {
      name: 'Layer Administrasi',
      checked: true
    },
    'layer-sebaran-rumah-komersil': {
      name: 'Layer Sebaran Rumah Komersil',
      checked: false
    },
    'layer-kawasan-lahan-terbangun': {
      name: 'Layer Kawasan Lahan Terbangun',
      checked: false
    },
    'layer-kawasan-rawan-bencana': {
      name: 'Layer Kawasan Rawan Bencana',
      checked: false
    },
    'layer-kawasan-rencana-pola-ruang': {
      name: 'Layer Kawasan Rencana Pola Ruang',
      checked: false
    },
    'layer-kemiringan-lereng': {
      name: 'Layer Kemiringan Lereng',
      checked: false
    }
  } as const;

  // Mock data for dropdowns - using actual values from GeoJSON
  const kecamatanList = [
    'All Kecamatan',
    'Purwakarta',
    'Plered',
    'Darangdan',
    'Wanayasa',
    'Tegalwaru',
    'Jatiluhur',
    'Sukatani',
    'Maniis',
    'Pasawahan',
    'Bojong',
    'Babakancikao',
    'Bungursari',
    'Campaka',
    'Cibatu',
    'Cikarang',
    'Cipeundeuy',
    'Cipicung',
    'Cisaat',
    'Cisarua',
    'Ciwangi',
    'Pondoksalam'
  ];

  // Complete kelurahan list with their corresponding kecamatan
  const kelurahanData = [
    { name: 'All Kelurahan/Desa', kecamatan: 'All Kecamatan' },
    // Purwakarta Kecamatan
    { name: 'Cipaisan', kecamatan: 'Purwakarta' },
    { name: 'Ciseureuh', kecamatan: 'Purwakarta' },
    { name: 'Purwamekar', kecamatan: 'Purwakarta' },
    { name: 'Nagrikidul', kecamatan: 'Purwakarta' },
    { name: 'Nagritengah', kecamatan: 'Purwakarta' },
    { name: 'Nagrikaler', kecamatan: 'Purwakarta' },
    { name: 'Sindangkasih', kecamatan: 'Purwakarta' },
    { name: 'Tegalmunjul', kecamatan: 'Purwakarta' },
    // Plered Kecamatan
    { name: 'Anjun', kecamatan: 'Plered' },
    { name: 'Plered', kecamatan: 'Plered' },
    // Darangdan Kecamatan
    { name: 'Darangdan', kecamatan: 'Darangdan' },
    // Wanayasa Kecamatan
    { name: 'Wanayasa', kecamatan: 'Wanayasa' },
    // Tegalwaru Kecamatan
    { name: 'Tegalwaru', kecamatan: 'Tegalwaru' },
    // Jatiluhur Kecamatan
    { name: 'Jatiluhur', kecamatan: 'Jatiluhur' },
    // Sukatani Kecamatan
    { name: 'Sukatani', kecamatan: 'Sukatani' },
    // Maniis Kecamatan
    { name: 'Maniis', kecamatan: 'Maniis' },
    // Pasawahan Kecamatan
    { name: 'Pasawahan', kecamatan: 'Pasawahan' },
    // Bojong Kecamatan
    { name: 'Bojong', kecamatan: 'Bojong' },
    // Babakancikao Kecamatan
    { name: 'Babakancikao', kecamatan: 'Babakancikao' },
    // Bungursari Kecamatan
    { name: 'Bungursari', kecamatan: 'Bungursari' },
    { name: 'Salamjaya', kecamatan: 'Bungursari' },
    { name: 'Salammulya', kecamatan: 'Bungursari' },
    // Campaka Kecamatan
    { name: 'Campaka', kecamatan: 'Campaka' },
    // Cibatu Kecamatan
    { name: 'Cibatu', kecamatan: 'Cibatu' },
    // Cikarang Kecamatan
    { name: 'Cikarang', kecamatan: 'Cikarang' },
    // Cipeundeuy Kecamatan
    { name: 'Cipeundeuy', kecamatan: 'Cipeundeuy' },
    // Cipicung Kecamatan
    { name: 'Cipicung', kecamatan: 'Cipicung' },
    // Cisaat Kecamatan
    { name: 'Cisaat', kecamatan: 'Cisaat' },
    // Cisarua Kecamatan
    { name: 'Cisarua', kecamatan: 'Cisarua' },
    // Ciwangi Kecamatan
    { name: 'Ciwangi', kecamatan: 'Ciwangi' },
    // Pondoksalam Kecamatan
    { name: 'Pondoksalam', kecamatan: 'Pondoksalam' },
    { name: 'Pasawahananyar', kecamatan: 'Pasawahananyar' }
  ];

  // Filter kelurahan based on selected kecamatan
  const filteredKelurahanList = selectedKecamatan === 'All Kecamatan' 
    ? kelurahanData.map(item => item.name)
    : kelurahanData
        .filter(item => item.kecamatan === selectedKecamatan)
        .map(item => item.name);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (kecamatanRef.current && !kecamatanRef.current.contains(event.target as Node)) {
        setShowKecamatanDropdown(false);
      }
      if (kelurahanRef.current && !kelurahanRef.current.contains(event.target as Node)) {
        setShowKelurahanDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = (menuKey: string) => {
    if (expandedMenus.includes(menuKey)) {
      setExpandedMenus(expandedMenus.filter(m => m !== menuKey));
    } else {
      setExpandedMenus([...expandedMenus, menuKey]);
    }
  };

  const isMenuExpanded = (menuKey: string) => expandedMenus.includes(menuKey);

  const handleKecamatanSelect = (kecamatan: string) => {
    setSelectedKecamatan(kecamatan);
    // Reset kelurahan selection when kecamatan changes
    setSelectedKelurahan('All Kelurahan/Desa');
    setShowKecamatanDropdown(false);
  };

  const handleKelurahanSelect = (kelurahan: string) => {
    setSelectedKelurahan(kelurahan);
    setShowKelurahanDropdown(false);
  };

  const toggleLayer = (layerId: string) => {
    
    if (selectedLayers.includes(layerId)) {
      setSelectedLayers(selectedLayers.filter(l => l !== layerId));
    } else {
      setSelectedLayers([...selectedLayers, layerId]);
    }
    
    setSelectedLayers(
      selectedLayers.includes(layerId)
        ? selectedLayers.filter(l => l !== layerId) 
        : [...selectedLayers, layerId]
    );
  };

  return (
    <SidebarProvider>
      <UISidebar className="bg-white border-r">
        <div className="flex flex-col h-full w-(--sidebar-width)">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h1 className="text-lg font-bold text-gray-800">Purwakarta Map</h1>
        <p className="text-sm text-gray-600 mt-1">Interactive Dashboard</p>
       
        
        {/* Test button for commercial buildings layer */}
        {/* <button
          onClick={() => {
            
            if (!selectedLayers.includes('layer-sebaran-rumah-komersil')) {
              const newSelectedLayers = [...selectedLayers, 'layer-sebaran-rumah-komersil'];
              setSelectedLayers(newSelectedLayers);
            } else {
              // Force a re-render by toggling off and on
              const filteredLayers = selectedLayers.filter(l => l !== 'layer-sebaran-rumah-komersil');
              setSelectedLayers(filteredLayers);
              
              // Add it back after a short delay
              setTimeout(() => {
                const newLayers = [...filteredLayers, 'layer-sebaran-rumah-komersil'];
                setSelectedLayers(newLayers);
              }, 100);
            }
          }}
          className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          🏢 Test: Enable Commercial Buildings
        </button> */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Navigation Section */}
        <div className="mb-6">
          {/* Beranda */}
          <Button
            onClick={() => {
              setActiveMenu('beranda');
            }}
            variant={activeMenu === 'beranda' ? 'secondary' : 'outline'}
            className="w-full flex items-center justify-between"
          >
            <span className="font-semibold">Beranda</span>
          </Button>

          {/* Master Data (Dropdown) */}
          <div className="mt-3">
            <Button
              onClick={() => toggleMenu('master-data')}
              variant="ghost"
              className="w-full flex items-center justify-between"
            >
              <span className="font-semibold text-gray-800">Master Data</span>
              {isMenuExpanded('master-data') ? (
                <ChevronUp size={16} className="text-blue-600" />
              ) : (
                <ChevronDown size={16} className="text-blue-600" />
              )}
            </Button>

            {isMenuExpanded('master-data') && (
              <div className="mt-3 space-y-2 pl-2">
                <a
                  href="/dashboard/users"
                  className={`block w-full text-left rounded-md transition-colors text-sm ${
                    activeMenu === 'user-data'
                      ? 'bg-blue-50 border border-blue-300 text-blue-800 p-3'
                      : 'hover:bg-gray-50 border border-gray-200 text-gray-800 p-3'
                  }`}
                >
                  <span>User Data</span>
                </a>
                <a
                  href="/dashboard/maps"
                  className={`block w-full text-left rounded-md transition-colors text-sm ${
                    activeMenu === 'maps'
                      ? 'bg-blue-50 border border-blue-300 text-blue-800 p-3'
                      : 'hover:bg-gray-50 border border-gray-200 text-gray-800 p-3'
                  }`}
                >
                  <span>Maps</span>
                </a>
                <Button
                  onClick={() => setActiveMenu('peta-data')}
                  variant={activeMenu === 'peta-data' ? 'secondary' : 'outline'}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span>Peta Data</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Layer Administrasi Section */}
        <div className="mb-6">
          <Button
            onClick={() => toggleMenu('layer-administrasi')}
            variant="ghost"
            className="w-full flex items-center justify-between"
          >
            <span className="font-semibold text-gray-800">Layer Administrasi</span>
            {isMenuExpanded('layer-administrasi') ? (
              <ChevronUp size={16} className="text-blue-600" />
            ) : (
              <ChevronDown size={16} className="text-blue-600" />
            )}
          </Button>

          {isMenuExpanded('layer-administrasi') && (
            <div className="mt-3 space-y-3">
              {/* Kecamatan Dropdown */}
              <div>
                <Select value={selectedKecamatan} onValueChange={handleKecamatanSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Kecamatan" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {kecamatanList.map((kecamatan) => (
                      <SelectItem key={kecamatan} value={kecamatan}>
                        {kecamatan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Kelurahan Dropdown */}
              <div>
                <Select value={selectedKelurahan} onValueChange={handleKelurahanSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Kelurahan/Desa" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {filteredKelurahanList.map((kelurahan) => (
                      <SelectItem key={kelurahan} value={kelurahan}>
                        {kelurahan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Layer Selection Section */}
        <div className="mb-6">
          <Button
            onClick={() => toggleMenu('layer-selection')}
            variant="ghost"
            className="w-full flex items-center justify-between"
          >
            <span className="font-semibold text-gray-800">Layer Selection</span>
            {isMenuExpanded('layer-selection') ? (
              <ChevronUp size={16} className="text-blue-600" />
            ) : (
              <ChevronDown size={16} className="text-blue-600" />
            )}
          </Button>

          {isMenuExpanded('layer-selection') && (
            <div className="mt-3 space-y-3">
              {/* Layer Checkboxes */}
              {Object.entries(layerConfigs).map(([layerId, config]) => (
                <div key={layerId} className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectedLayers.includes(layerId)}
                    onCheckedChange={() => toggleLayer(layerId)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    {config.name}
                  </span>
                  {/* Debug info */}
                  <span className="text-xs text-gray-500">
                    (Selected: {selectedLayers.includes(layerId) ? 'Yes' : 'No'})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Base Map Toggle - Bottom */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-start space-x-3">
          <Checkbox checked={showBaseMap} onCheckedChange={() => setShowBaseMap(!showBaseMap)} className="mt-0.5" />
          <span className="text-sm text-gray-700">Peta Google</span>
        </div>
      </div>

      {/* Logout Button - Bottom */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <Button onClick={onLogout} variant="destructive" className="w-full">Logout</Button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          Purwakarta Map Dashboard v1.0
        </div>
      </div>

      {/* Inline statistics rendered on Beranda page */}
        </div>
      </UISidebar>
    </SidebarProvider>
  );
} 