'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CommercialHouseData {
  id: string;
  namaPerumahan: string | null;
  alamat: string | null;
  kelurahanDesa: string | null;
  kecamatan: string | null;
  namaPengembangan: string | null;
  rawanBanjir: string | null;
  gerakanTanah: string | null;
  gempaBumi: string | null;
  dataLainnya: string | null;
  koordinat: string | null;
  foto: string[];
}

interface CommercialHouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CommercialHouseData | null;
  loading?: boolean;
}

export default function CommercialHouseModal({
  isOpen,
  onClose,
  data,
  loading = false
}: CommercialHouseModalProps) {
  
  const renderField = (label: string, value: string | null) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {label}
        </label>
        <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-200">
          {value || '-'}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              Data Rumah Komersil
            </DialogTitle>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(90vh-100px)] overflow-y-auto">
          <div className="px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : data ? (
              <div>
                {/* Nama Perumahan */}
                {renderField('Nama Perumahan', data.namaPerumahan)}

                {/* Alamat */}
                {renderField('Alamat', data.alamat)}

                {/* Kelurahan/Desa */}
                {renderField('Kelurahan/Desa', data.kelurahanDesa)}

                {/* Kecamatan */}
                {renderField('Kecamatan', data.kecamatan)}

                {/* Nama Pengembangan */}
                {renderField('Nama Pengembangan', data.namaPengembangan)}

                {/* Titik Koordinat */}
                {renderField('Titik Koordinat', data.koordinat)}

                {/* Rawan Banjir */}
                {renderField('Rawan Banjir', data.rawanBanjir)}

                {/* Gerakan Tanah */}
                {renderField('Gerakan Tanah', data.gerakanTanah)}

                {/* Gempa Bumi */}
                {renderField('Gempa Bumi', data.gempaBumi)}

                {/* Data Lainnya */}
                {renderField('Data Lainnya', data.dataLainnya)}

                {/* Foto */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Foto
                  </label>
                  {data.foto && data.foto.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {data.foto.map((foto, index) => (
                        <div
                          key={index}
                          className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
                        >
                          <img
                            src={foto.startsWith('http') || foto.startsWith('/') ? foto : `/uploads/commercial-houses/${foto}`}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(
                              foto.startsWith('http') || foto.startsWith('/') ? foto : `/uploads/commercial-houses/${foto}`,
                              '_blank'
                            )}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                            }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                            <p className="text-xs text-white font-medium">
                              Foto {index + 1}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md border border-gray-200">
                      Tidak ada foto
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Data tidak tersedia</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

