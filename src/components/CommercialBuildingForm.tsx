'use client';

import { useState, useEffect, useRef } from 'react';
import { Home, Building, MapPin, AlertTriangle, FileText, Image as ImageIcon, Save } from 'lucide-react';

interface EditableFields {
  idRumahSebaran: string;
  namaKawasanPerumahan: string;
  alamat: string;
  kecamatan: string;
  kelurahan: string;
  penutupLahan: string;
  rawanBencana: string;
  rencanaPolaRuang: string;
  tahun: string;
  koordinat: string;
  photo: string;
  idIzinPerumahan: string;
  izinPerumahan: string;
}

interface CommercialBuildingFormProps {
  initialData: any;
  onSave: (data: EditableFields) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export default function CommercialBuildingForm({
  initialData,
  onSave,
  onCancel,
  isSaving
}: CommercialBuildingFormProps) {
  const [editableFields, setEditableFields] = useState<EditableFields>({
    idRumahSebaran: '',
    namaKawasanPerumahan: '',
    alamat: '',
    kecamatan: '',
    kelurahan: '',
    penutupLahan: '',
    rawanBencana: '',
    rencanaPolaRuang: '',
    tahun: '',
    koordinat: '',
    photo: '',
    idIzinPerumahan: '',
    izinPerumahan: ''
  });

  const [showKecamatanDropdown, setShowKecamatanDropdown] = useState(false);
  const [showKelurahanDropdown, setShowKelurahanDropdown] = useState(false);

  const kecamatanRef = useRef<HTMLDivElement>(null);
  const kelurahanRef = useRef<HTMLDivElement>(null);

  // Kecamatan and Kelurahan data (same as sidebar)
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
    { name: 'Pasawahananyar', kecamatan: 'Pondoksalam' }
  ];

  // Filter kelurahan based on selected kecamatan
  const filteredKelurahanList = editableFields.kecamatan === 'All Kecamatan' || editableFields.kecamatan === ''
    ? kelurahanData.map(item => item.name)
    : kelurahanData
        .filter(item => item.kecamatan === editableFields.kecamatan)
        .map(item => item.name);

  // Initialize editable fields when initialData changes
  useEffect(() => {
    if (initialData) {
      setEditableFields({
        idRumahSebaran: initialData.idRumahSebaran || initialData.feature_id || initialData.Id || initialData.id || '',
        namaKawasanPerumahan: initialData.namaKawasanPerumahan || initialData.nama_kawasan || '',
        alamat: initialData.alamat || initialData.ADDRESS || '',
        kecamatan: initialData.kecamatan || initialData.WADMKC || '',
        kelurahan: initialData.kelurahan || initialData.WADMKD || '',
        penutupLahan: initialData.penutupLahan || initialData.penutup_lahan || '',
        rawanBencana: initialData.rawanBencana || initialData.rawan_bencana || '',
        rencanaPolaRuang: initialData.rencanaPolaRuang || initialData.rencana_pola_ruang || '',
        tahun: initialData.tahun || initialData.TAHUN || '',
        koordinat: initialData.koordinat || initialData.COORDINATES || '',
        photo: initialData.photo || initialData.PHOTO || '',
        idIzinPerumahan: initialData.idIzinPerumahan || initialData.id_izin_perumahan || '',
        izinPerumahan: initialData.izinPerumahan || initialData.izin_perumahan || ''
      });
    }
  }, [initialData]);

  // Click outside handlers for dropdowns
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

  const handleFieldChange = (field: keyof EditableFields, value: string) => {
    setEditableFields(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset kelurahan when kecamatan changes
    if (field === 'kecamatan') {
      setEditableFields(prev => ({
        ...prev,
        [field]: value,
        kelurahan: 'All Kelurahan/Desa'
      }));
    }
  };

  const handleKecamatanSelect = (kecamatan: string) => {
    setEditableFields(prev => ({
      ...prev,
      kecamatan: kecamatan,
      kelurahan: 'All Kelurahan/Desa' // Reset kelurahan
    }));
    setShowKecamatanDropdown(false);
  };

  const handleKelurahanSelect = (kelurahan: string) => {
    setEditableFields(prev => ({
      ...prev,
      kelurahan: kelurahan
    }));
    setShowKelurahanDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(editableFields);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Home size={14} className="inline mr-1" />
            ID Rumah Sebaran
          </label>
          <input
            type="text"
            value={editableFields.idRumahSebaran}
            onChange={(e) => handleFieldChange('idRumahSebaran', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            placeholder="Enter ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Building size={14} className="inline mr-1" />
            Nama Kawasan Perumahan
          </label>
          <input
            type="text"
            value={editableFields.namaKawasanPerumahan}
            onChange={(e) => handleFieldChange('namaKawasanPerumahan', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            placeholder="Enter kawasan name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin size={14} className="inline mr-1" />
            Alamat
          </label>
          <textarea
            value={editableFields.alamat}
            onChange={(e) => handleFieldChange('alamat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            placeholder="Enter address"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="relative" ref={kecamatanRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
            <button
              type="button"
              onClick={() => setShowKecamatanDropdown(!showKecamatanDropdown)}
              className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-sm text-gray-700">{editableFields.kecamatan || 'Select Kecamatan'}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showKecamatanDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {kecamatanList.map((kecamatan, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleKecamatanSelect(kecamatan)}
                    className="w-full px-3 py-2 text-left text-sm text-black hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                  >
                    {kecamatan}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="relative" ref={kelurahanRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelurahan</label>
            <button
              type="button"
              onClick={() => setShowKelurahanDropdown(!showKelurahanDropdown)}
              className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-sm text-gray-700">{editableFields.kelurahan || 'Select Kelurahan'}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showKelurahanDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredKelurahanList.map((kelurahan, index) => (
                  <button
                    key={index}
                    type="button"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Penutup Lahan</label>
          <input
            type="text"
            value={editableFields.penutupLahan}
            onChange={(e) => handleFieldChange('penutupLahan', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            placeholder="Enter land cover type"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <AlertTriangle size={14} className="inline mr-1" />
            Rawan Bencana
          </label>
          <input
            type="text"
            value={editableFields.rawanBencana}
            onChange={(e) => handleFieldChange('rawanBencana', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            placeholder="Enter disaster risk level"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FileText size={14} className="inline mr-1" />
            Rencana Pola Ruang
          </label>
          <input
            type="text"
            value={editableFields.rencanaPolaRuang}
            onChange={(e) => handleFieldChange('rencanaPolaRuang', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            placeholder="Enter spatial planning"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="inline mr-1">📅</span>
            Tahun
          </label>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear() + 10}
            value={editableFields.tahun}
            onChange={(e) => handleFieldChange('tahun', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            placeholder="Enter year (e.g., 2024)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Koordinat</label>
          <input
            type="text"
            value={editableFields.koordinat}
            onChange={(e) => handleFieldChange('koordinat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            placeholder="Enter coordinates"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <ImageIcon size={14} className="inline mr-1" />
            Photo URL
          </label>
          <input
            type="text"
            value={editableFields.photo}
            onChange={(e) => handleFieldChange('photo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            placeholder="Enter photo URL"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Izin Perumahan</label>
            <input
              type="text"
              value={editableFields.idIzinPerumahan}
              onChange={(e) => handleFieldChange('idIzinPerumahan', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              placeholder="Enter permit ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Izin Perumahan</label>
            <input
              type="text"
              value={editableFields.izinPerumahan}
              onChange={(e) => handleFieldChange('izinPerumahan', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              placeholder="Enter permit type"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={14} />
              Save
            </>
          )}
        </button>
      </div>
    </form>
  );
}
