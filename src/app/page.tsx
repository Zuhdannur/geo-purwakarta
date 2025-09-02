'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues
const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false });
const MapboxMap = dynamic(() => import('@/components/MapboxMap'), { ssr: false });

export default function Home() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<string[]>(['layer-administrasi']); // Default to Layer Administrasi only
  const [showBaseMap, setShowBaseMap] = useState<boolean>(false); // Default to false to match image
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('All Kecamatan');
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>('All Kelurahan/Desa');
  const [isClient, setIsClient] = useState(false);
  const [uploadedLayers, setUploadedLayers] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700 mb-2">Purwakarta Map Dashboard</div>
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu}
        selectedLayers={selectedLayers}
        setSelectedLayers={setSelectedLayers}
        showBaseMap={showBaseMap}
        setShowBaseMap={setShowBaseMap}
        selectedKecamatan={selectedKecamatan}
        setSelectedKecamatan={setSelectedKecamatan}
        selectedKelurahan={selectedKelurahan}
        setSelectedKelurahan={setSelectedKelurahan}
      />
      <div className="flex-1 relative">
       
        <MapboxMap 
          activeMenu={activeMenu}
          selectedLayers={selectedLayers}
          setSelectedLayers={setSelectedLayers}
          showBaseMap={showBaseMap}
          setShowBaseMap={setShowBaseMap}
          selectedKecamatan={selectedKecamatan}
          selectedKelurahan={selectedKelurahan}
          // @ts-expect-error extend props for uploaded layers
          uploadedLayers={uploadedLayers}
        />
      </div>
    </div>
  );
}
