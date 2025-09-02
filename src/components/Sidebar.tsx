'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Check } from 'lucide-react';

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
  setSelectedKelurahan
}: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['layer-administrasi']); // Default expanded
  const [showKecamatanDropdown, setShowKecamatanDropdown] = useState(false);
  const [showKelurahanDropdown, setShowKelurahanDropdown] = useState(false);

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
    console.log('Selected Kecamatan:', kecamatan);
  };

  const handleKelurahanSelect = (kelurahan: string) => {
    setSelectedKelurahan(kelurahan);
    setShowKelurahanDropdown(false);
    console.log('Selected Kelurahan:', kelurahan);
  };

  const toggleLayer = (layerId: string) => {
    if (selectedLayers.includes(layerId)) {
      setSelectedLayers(selectedLayers.filter(l => l !== layerId));
    } else {
      setSelectedLayers([...selectedLayers, layerId]);
    }
  };

  return (
    <div className="w-80 bg-white shadow-lg border-2 border-blue-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h1 className="text-lg font-bold text-gray-800">Purwakarta Map</h1>
        <p className="text-sm text-gray-600 mt-1">Interactive Dashboard</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Layer Administrasi Section */}
        <div className="mb-6">
          <button
            onClick={() => toggleMenu('layer-administrasi')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span className="font-semibold text-gray-800">Layer Administrasi</span>
            {isMenuExpanded('layer-administrasi') ? (
              <ChevronUp size={16} className="text-blue-600" />
            ) : (
              <ChevronDown size={16} className="text-blue-600" />
            )}
          </button>

          {isMenuExpanded('layer-administrasi') && (
            <div className="mt-3 space-y-3">
              {/* Kecamatan Dropdown */}
              <div className="relative" ref={kecamatanRef}>
                <button
                  onClick={() => setShowKecamatanDropdown(!showKecamatanDropdown)}
                  className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-700">{selectedKecamatan}</span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                
                {showKecamatanDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {kecamatanList.map((kecamatan, index) => (
                      <button
                        key={index}
                        onClick={() => handleKecamatanSelect(kecamatan)}
                        className="w-full px-3 py-2 text-left text-sm text-black hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                      >
                        {kecamatan}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Kelurahan Dropdown */}
              <div className="relative" ref={kelurahanRef}>
                <button
                  onClick={() => setShowKelurahanDropdown(!showKelurahanDropdown)}
                  className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-700">{selectedKelurahan}</span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                
                {showKelurahanDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredKelurahanList.map((kelurahan, index) => (
                      <button
                        key={index}
                        onClick={() => handleKelurahanSelect(kelurahan)}
                        className="w-full px-3 py-2 text-left text-sm text-black hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                      >
                        {kelurahan}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Layer Selection Section */}
        <div className="mb-6">
          <button
            onClick={() => toggleMenu('layer-selection')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span className="font-semibold text-gray-800">Layer Selection</span>
            {isMenuExpanded('layer-selection') ? (
              <ChevronUp size={16} className="text-blue-600" />
            ) : (
              <ChevronDown size={16} className="text-blue-600" />
            )}
          </button>

          {isMenuExpanded('layer-selection') && (
            <div className="mt-3 space-y-3">
              {/* Layer Checkboxes */}
              {Object.entries(layerConfigs).map(([layerId, config]) => (
                <div key={layerId} className="flex items-start space-x-3">
                  <button
                    onClick={() => toggleLayer(layerId)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 ${
                      selectedLayers.includes(layerId)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {selectedLayers.includes(layerId) && (
                      <Check size={12} className="text-white" />
                    )}
                  </button>
                  <span className="text-sm text-gray-700 leading-relaxed">
                    {config.name}
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
          <button
            onClick={() => setShowBaseMap(!showBaseMap)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 ${
              showBaseMap
                ? 'bg-blue-600 border-blue-600'
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            {showBaseMap && (
              <Check size={12} className="text-white" />
            )}
          </button>
          <span className="text-sm text-gray-700">Peta Google</span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          Purwakarta Map Dashboard v1.0
        </div>
      </div>
    </div>
  );
} 