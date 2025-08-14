'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues
const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false });
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function Home() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<string[]>(['sebaran-rumah-komersil', 'kawasan-rawan-bencana']); // Default to match image
  const [showBaseMap, setShowBaseMap] = useState<boolean>(false); // Default to false to match image
  const [isClient, setIsClient] = useState(false);

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
      />
      <div className="flex-1 relative">
        <Map 
          activeMenu={activeMenu}
          selectedLayers={selectedLayers}
          setSelectedLayers={setSelectedLayers}
          showBaseMap={showBaseMap}
          setShowBaseMap={setShowBaseMap}
        />
      </div>
    </div>
  );
}
