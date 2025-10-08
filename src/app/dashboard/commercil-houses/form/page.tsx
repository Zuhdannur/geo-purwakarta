"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload } from 'lucide-react';
import { toast } from 'sonner';
import CommercialHouseForm from '@/components/CommercialHouseForm';

export default function CommercialHouseFormPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleSuccess = () => {
    toast.success('Rumah komersil berhasil ditambahkan!');
    router.push('/dashboard/commercil-houses');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Tambah Rumah Komersil</h1>
            <p className="text-gray-600">Isi form untuk menambahkan rumah komersil baru</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Form Rumah Komersil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CommercialHouseForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
