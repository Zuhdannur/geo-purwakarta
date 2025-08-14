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
}

export default function Sidebar({ 
  activeMenu, 
  setActiveMenu, 
  selectedLayers, 
  setSelectedLayers,
  showBaseMap,
  setShowBaseMap
}: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['peta-administratif']); // Default expanded
  const [showKecamatanDropdown, setShowKecamatanDropdown] = useState(false);
  const [showKelurahanDropdown, setShowKelurahanDropdown] = useState(false);
  const [selectedKecamatan, setSelectedKecamatan] = useState('All Kecamatan');
  const [selectedKelurahan, setSelectedKelurahan] = useState('All Kelurahan/Desa');

  const kecamatanRef = useRef<HTMLDivElement>(null);
  const kelurahanRef = useRef<HTMLDivElement>(null);

  // Layer configurations matching the image
  const layerConfigs = {
    'sebaran-rumah-komersil': {
      name: 'Sebaran Rumah Komersil',
      checked: true
    },
    'kawasan-lahan-terbangun': {
      name: 'Kawasan Lahan Terbangun (Peta Tutupan Lahan)',
      checked: false
    },
    'kawasan-rawan-bencana': {
      name: 'Kawasan Rawan Bencana Banjir, Gempa Bumi, Gerakan Tanah',
      checked: true
    },
    'peta-izin-perumahan': {
      name: 'Peta Izin Perumahan',
      checked: false
    },
    'kawasan-rencana-pola-ruang': {
      name: 'Kawasan Rencana Pola Ruang',
      checked: false
    }
  };

  // Mock data for dropdowns
  const kecamatanList = [
    'All Kecamatan',
    'Kecamatan Purwakarta',
    'Kecamatan Plered',
    'Kecamatan Darangdan',
    'Kecamatan Wanayasa',
    'Kecamatan Tegalwaru',
    'Kecamatan Jatiluhur',
    'Kecamatan Sukatani',
    'Kecamatan Maniis',
    'Kecamatan Pasawahan',
    'Kecamatan Bojong',
    'Kecamatan Babakancikao',
    'Kecamatan Bungursari',
    'Kecamatan Campaka',
    'Kecamatan Cibatu',
    'Kecamatan Cikarang',
    'Kecamatan Cipeundeuy',
    'Kecamatan Cipicung',
    'Kecamatan Cisaat',
    'Kecamatan Cisarua',
    'Kecamatan Ciwangi'
  ];

  const kelurahanList = [
    'All Kelurahan/Desa',
    'Kelurahan Cipaisan',
    'Kelurahan Ciseureuh',
    'Kelurahan Purwamekar',
    'Kelurahan Nagrikidul',
    'Kelurahan Nagritengah',
    'Kelurahan Nagrikaler',
    'Kelurahan Sindangkasih',
    'Kelurahan Tegalmunjul',
    'Kelurahan Anjun',
    'Kelurahan Plered',
    'Kelurahan Darangdan',
    'Kelurahan Wanayasa',
    'Kelurahan Tegalwaru',
    'Kelurahan Jatiluhur',
    'Kelurahan Sukatani',
    'Kelurahan Maniis',
    'Kelurahan Pasawahan',
    'Kelurahan Bojong',
    'Kelurahan Babakancikao',
    'Kelurahan Bungursari'
  ];

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
        {/* Peta Administratif Section */}
        <div className="mb-6">
          <button
            onClick={() => toggleMenu('peta-administratif')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span className="font-semibold text-gray-800">Peta Administratif</span>
            {isMenuExpanded('peta-administratif') ? (
              <ChevronUp size={16} className="text-blue-600" />
            ) : (
              <ChevronDown size={16} className="text-blue-600" />
            )}
          </button>

          {isMenuExpanded('peta-administratif') && (
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
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
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
                    {kelurahanList.map((kelurahan, index) => (
                      <button
                        key={index}
                        onClick={() => handleKelurahanSelect(kelurahan)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
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

        {/* Peta Existing Section */}
        <div className="mb-6">
          <button
            onClick={() => toggleMenu('peta-existing')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span className="font-semibold text-gray-800">Peta Existing</span>
            {isMenuExpanded('peta-existing') ? (
              <ChevronUp size={16} className="text-blue-600" />
            ) : (
              <ChevronDown size={16} className="text-blue-600" />
            )}
          </button>

          {isMenuExpanded('peta-existing') && (
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