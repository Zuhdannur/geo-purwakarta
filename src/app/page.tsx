'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import UploadShapefile from '@/components/UploadShapefile';

// Dynamically import components to avoid SSR issues
const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false });
const MapboxMap = dynamic(() => import('@/components/MapboxMap'), { ssr: false });

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([
    'layer-administrasi',
    'layer-kawasan-lahan-terbangun'
  ]); // Default to Layer Administrasi and Kawasan Lahan Terbangun
  const [showBaseMap, setShowBaseMap] = useState<boolean>(false); // Default to false to match image
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('All Kecamatan');
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>('All Kelurahan/Desa');
  const [isClient, setIsClient] = useState(false);
  const [uploadedLayers, setUploadedLayers] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  // Debug state changes
  useEffect(() => {
    console.log('Main page - selectedLayers changed:', selectedLayers);
  }, [selectedLayers]);

  // Show loading while checking authentication
  if (!isClient || isLoading) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700 mb-2">Purwakarta Map Dashboard</div>
          <div className="text-gray-500">Loading session...</div>
        </div>
      </div>
    );
  }

  // Show loading while redirecting to login
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700 mb-2">Purwakarta Map Dashboard</div>
          <div className="text-gray-500">Redirecting to login...</div>
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
        onLogout={handleLogout}
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
          uploadedLayers={uploadedLayers}
        />
      </div>
    </div>
  );
}
