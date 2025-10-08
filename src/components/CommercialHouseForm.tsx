'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  MapPin, 
  Image as ImageIcon,
  AlertCircle 
} from 'lucide-react';

interface CommercialHouse {
  id?: string;
  idSrk?: string;
  kawasanPerumahan?: string;
  alamat?: string;
  kecamatan?: string;
  kelurahanDesa?: string;
  namaPengembang?: string;
  noIzin?: string;
  penutupLahan?: string;
  rawanBencana?: string;
  rencanaPolaRuang?: string;
  koordinat?: string;
  geometry?: any; // GeoJSON geometry
  foto?: string[];
}

interface CommercialHouseFormProps {
  house?: CommercialHouse | null;
  geometry?: any; // GeoJSON geometry from map feature
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CommercialHouseForm({ house, geometry, onSuccess, onCancel }: CommercialHouseFormProps) {
  const [formData, setFormData] = useState({
    idSrk: '',
    kawasanPerumahan: '',
    alamat: '',
    kecamatan: '',
    kelurahanDesa: '',
    namaPengembang: '',
    noIzin: '',
    penutupLahan: '',
    rawanBencana: '',
    rencanaPolaRuang: '',
    koordinat: '',
    geometry: null as any,
    foto: [] as string[],
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([]);

  const penutupLahanOptions = [
    'Permukiman',
    'Perdagangan dan Jasa',
    'Perkantoran',
    'Industri',
    'Pertanian',
    'Hutan',
    'Lahan Kosong',
    'Lainnya'
  ];

  const rawanBencanaOptions = [
    'Rendah',
    'Sedang',
    'Tinggi',
    'Sangat Tinggi',
    'Tidak Ada'
  ];

  const rencanaPolaRuangOptions = [
    'Permukiman',
    'Perdagangan dan Jasa',
    'Perkantoran',
    'Industri',
    'Pertanian',
    'Kawasan Lindung',
    'Ruang Terbuka Hijau',
    'Lainnya'
  ];

  useEffect(() => {
    fetchKecamatanOptions();
  }, []);

  useEffect(() => {
    if (house) {
      setFormData({
        idSrk: house.idSrk || '',
        kawasanPerumahan: house.kawasanPerumahan || '',
        alamat: house.alamat || '',
        kecamatan: house.kecamatan || '',
        kelurahanDesa: house.kelurahanDesa || '',
        namaPengembang: house.namaPengembang || '',
        noIzin: house.noIzin || '',
        penutupLahan: house.penutupLahan || '',
        rawanBencana: house.rawanBencana || '',
        rencanaPolaRuang: house.rencanaPolaRuang || '',
        koordinat: house.koordinat || '',
        geometry: house.geometry || null,
        foto: house.foto || [],
      });
    } else if (geometry) {
      // If no house but geometry is provided (from map click), initialize with geometry
      setFormData(prev => ({
        ...prev,
        geometry: geometry
      }));
    }
  }, [house, geometry]);

  const fetchKecamatanOptions = async () => {
    try {
      const response = await fetch('/api/maps/kecamatan');
      const data = await response.json();
      
      if (response.ok) {
        setKecamatanOptions(data.kecamatan || []);
      } else {
        console.error('Error fetching kecamatan options:', data.error);
      }
    } catch (error) {
      console.error('Error fetching kecamatan options:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const response = await fetch('/api/commercial-houses/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          foto: [...prev.foto, ...result.files]
        }));
      } else {
        setError(result.error || 'Failed to upload files');
      }
    } catch (error) {
      setError('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      foto: prev.foto.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const url = house?.id 
        ? `/api/commercial-houses/${house.id}`
        : '/api/commercial-houses';
      
      const method = house?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to save commercial house');
      }
    } catch (error) {
      setError('Failed to save commercial house');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ID SRK */}
        <div className="space-y-2">
          <Label htmlFor="idSrk">ID SRK</Label>
          <Input
            id="idSrk"
            value={formData.idSrk}
            onChange={(e) => handleInputChange('idSrk', e.target.value)}
            placeholder="Enter ID SRK"
          />
        </div>

        {/* Kawasan Perumahan */}
        <div className="space-y-2">
          <Label htmlFor="kawasanPerumahan">Kawasan Perumahan</Label>
          <Input
            id="kawasanPerumahan"
            value={formData.kawasanPerumahan}
            onChange={(e) => handleInputChange('kawasanPerumahan', e.target.value)}
            placeholder="Enter kawasan perumahan"
          />
        </div>

        {/* Alamat */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="alamat">Alamat</Label>
          <Textarea
            id="alamat"
            value={formData.alamat}
            onChange={(e) => handleInputChange('alamat', e.target.value)}
            placeholder="Enter complete address"
            rows={3}
          />
        </div>

        {/* Kecamatan */}
        <div className="space-y-2">
          <Label htmlFor="kecamatan">Kecamatan</Label>
          <select
            id="kecamatan"
            value={formData.kecamatan}
            onChange={(e) => handleInputChange('kecamatan', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Kecamatan</option>
            {kecamatanOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Kelurahan/Desa */}
        <div className="space-y-2">
          <Label htmlFor="kelurahanDesa">Kelurahan/Desa</Label>
          <Input
            id="kelurahanDesa"
            value={formData.kelurahanDesa}
            onChange={(e) => handleInputChange('kelurahanDesa', e.target.value)}
            placeholder="Enter kelurahan/desa"
          />
        </div>

        {/* Nama Pengembang */}
        <div className="space-y-2">
          <Label htmlFor="namaPengembang">Nama Pengembang</Label>
          <Input
            id="namaPengembang"
            value={formData.namaPengembang}
            onChange={(e) => handleInputChange('namaPengembang', e.target.value)}
            placeholder="Enter developer name"
          />
        </div>

        {/* No. Izin */}
        <div className="space-y-2">
          <Label htmlFor="noIzin">No. Izin</Label>
          <Input
            id="noIzin"
            value={formData.noIzin}
            onChange={(e) => handleInputChange('noIzin', e.target.value)}
            placeholder="Enter permit number"
          />
        </div>

        {/* Penutup Lahan */}
        <div className="space-y-2">
          <Label htmlFor="penutupLahan">Penutup Lahan</Label>
          <select
            id="penutupLahan"
            value={formData.penutupLahan}
            onChange={(e) => handleInputChange('penutupLahan', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select penutup lahan</option>
            {penutupLahanOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Rawan Bencana */}
        <div className="space-y-2">
          <Label htmlFor="rawanBencana">Rawan Bencana</Label>
          <select
            id="rawanBencana"
            value={formData.rawanBencana}
            onChange={(e) => handleInputChange('rawanBencana', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select risk level</option>
            {rawanBencanaOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Rencana Pola Ruang */}
        <div className="space-y-2">
          <Label htmlFor="rencanaPolaRuang">Rencana Pola Ruang</Label>
          <select
            id="rencanaPolaRuang"
            value={formData.rencanaPolaRuang}
            onChange={(e) => handleInputChange('rencanaPolaRuang', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select rencana pola ruang</option>
            {rencanaPolaRuangOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Koordinat */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="koordinat">Koordinat</Label>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <Input
              id="koordinat"
              value={formData.koordinat}
              onChange={(e) => handleInputChange('koordinat', e.target.value)}
              placeholder="Enter coordinates (e.g., -6.5569, 107.4439)"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-gray-500">Format: latitude, longitude</p>
        </div>

        {/* Geometry Connection Indicator */}
        {formData.geometry && (
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">
                ✓ Connected to map feature - geometry will be automatically saved
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Photo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-500">
                  Click to upload photos
                </span>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </Label>
              <p className="text-sm text-gray-500">
                PNG, JPG, JPEG up to 10MB each
              </p>
            </div>
          </div>

          {uploading && (
            <div className="text-center text-blue-600">Uploading photos...</div>
          )}

          {/* Display uploaded photos */}
          {formData.foto.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.foto.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : house?.id ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
