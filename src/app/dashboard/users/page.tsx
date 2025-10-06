'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';

const UserDataPage = dynamic(() => import('@/components/UserDataPage'), { ssr: false });

export default function UsersManagementPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?next=/dashboard/users');
    }
  }, [isLoading, isAuthenticated, router]);

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
    <div className="h-[calc(100vh-56px)]">
      <UserDataPage />
    </div>
  );
}


