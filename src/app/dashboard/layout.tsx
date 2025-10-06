'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';

const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false });
const MapboxMap = dynamic(() => import('@/components/MapboxMap'), { ssr: false });
const StatisticsSection = dynamic(() => import('@/components/StatisticsSection'), { ssr: false });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, logout } = useAuth();

  const [activeMenu, setActiveMenu] = useState<string | null>('beranda');
  const [selectedLayers, setSelectedLayers] = useState<string[]>([
    'layer-administrasi',
    'layer-kawasan-lahan-terbangun'
  ]);
  const [showBaseMap, setShowBaseMap] = useState<boolean>(false);
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('All Kecamatan');
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>('All Kelurahan/Desa');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?next=/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (!isClient || isLoading) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700 mb-2">Purwakarta Map Dashboard</div>
          <div className="text-gray-500">Loading session...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700 mb-2">Purwakarta Map Dashboard</div>
          <div className="text-gray-500">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  const isNestedRoute = pathname?.startsWith('/dashboard/') && pathname !== '/dashboard';

  return (
    <div className={`flex h-[calc(100vh-56px)] ${activeMenu === 'beranda' || activeMenu === 'user-data' ? 'bg-white' : 'bg-gray-100'}`}>
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
        {isNestedRoute ? (
          // Nested route content (e.g., /dashboard/users)
          children
        ) : (
          // Root dashboard content with menu switching
          activeMenu === 'beranda' ? (
            <div className="h-full w-full overflow-y-auto bg-white">
              <div className="w-full p-4">
                <StatisticsSection />
              </div>
            </div>
          ) : (
            <MapboxMap
              activeMenu={activeMenu}
              selectedLayers={selectedLayers}
              setSelectedLayers={setSelectedLayers}
              showBaseMap={showBaseMap}
              setShowBaseMap={setShowBaseMap}
              selectedKecamatan={selectedKecamatan}
              selectedKelurahan={selectedKelurahan}
              uploadedLayers={[]}
            />
          )
        )}
      </div>
    </div>
  );
}


