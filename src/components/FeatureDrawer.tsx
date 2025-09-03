'use client';

import { X, Edit3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import CommercialBuildingForm from './CommercialBuildingForm';

interface FeatureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  featureData: any;
  layerName: string;
  onFeatureUpdated?: () => void;
}

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

export default function FeatureDrawer({ 
  isOpen, 
  onClose, 
  featureData, 
  layerName,
  onFeatureUpdated
}: FeatureDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
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

  // Initialize editable fields when feature data changes
  useEffect(() => {
    if (featureData) {
      setEditableFields({
        idRumahSebaran: featureData.idRumahSebaran || featureData.Id || featureData.id || '',
        namaKawasanPerumahan: featureData.namaKawasanPerumahan || featureData.nama_kawasan || '',
        alamat: featureData.alamat || featureData.ADDRESS || '',
        kecamatan: featureData.kecamatan || featureData.WADMKC || '',
        kelurahan: featureData.kelurahan || featureData.WADMKD || '',
        penutupLahan: featureData.penutupLahan || featureData.penutup_lahan || '',
        rawanBencana: featureData.rawanBencana || featureData.rawan_bencana || '',
        rencanaPolaRuang: featureData.rencanaPolaRuang || featureData.rencana_pola_ruang || '',
        tahun: featureData.tahun || featureData.TAHUN || '',
        koordinat: featureData.koordinat || featureData.COORDINATES || '',
        photo: featureData.photo || featureData.PHOTO || '',
        idIzinPerumahan: featureData.idIzinPerumahan || featureData.id_izin_perumahan || '',
        izinPerumahan: featureData.izinPerumahan || featureData.izin_perumahan || ''
      });
    }
  }, [featureData]);



  const handleSave = async () => {
    if (!featureData || layerName !== 'Sebaran Rumah Komersil') {
      console.log('Can only save commercial buildings data');
      return;
    }

    setIsSaving(true);
    setNotification({ type: null, message: '' });
    
    try {
      // Prepare the data to save
      const featureId = featureData.feature_id || featureData.OBJECTID || featureData.Id || featureData.id || featureData.OID_ || featureData.ID;
      
      // Ensure dropdown values are saved as strings
      const processedEditableFields = {
        ...editableFields,
        kecamatan: String(editableFields.kecamatan || ''),
        kelurahan: String(editableFields.kelurahan || '')
      };
      
      // Debug: Log the feature identification
      console.log('Feature Save Debug:', {
        featureDataKeys: Object.keys(featureData),
        feature_id: featureData.feature_id,
        OBJECTID: featureData.OBJECTID,
        Id: featureData.Id,
        id: featureData.id,
        OID_: featureData.OID_,
        ID: featureData.ID,
        selectedFeatureId: featureId,
        editableFields: processedEditableFields,
        featureDataSample: featureData
      });
      
      const dataToSave = {
        featureId: featureId,
        layerId: 'layer-sebaran-rumah-komersil',
        properties: {
          ...featureData, // Keep existing properties
          ...processedEditableFields // Add/update editable fields with string conversion
        }
      };

      const response = await fetch('/api/data/update-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Feature updated successfully:', result);
        setNotification({
          type: 'success',
          message: `Feature updated successfully!`
        });
        setIsEditing(false);
        
        // Notify parent component that feature was updated
        if (onFeatureUpdated) {
          onFeatureUpdated();
        }
        
        // Clear notification after 5 seconds
        setTimeout(() => {
          setNotification({ type: null, message: '' });
        }, 5000);
      } else {
        const errorData = await response.json();
        console.error('Failed to update feature:', errorData);
        setNotification({
          type: 'error',
          message: `Failed to update feature: ${errorData.error || 'Unknown error'}`
        });
      }
    } catch (error) {
      console.error('Error saving feature:', error);
      setNotification({
        type: 'error',
        message: `Error saving feature: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWithData = async (formData: EditableFields) => {
    if (!featureData || layerName !== 'Sebaran Rumah Komersil') {
      console.log('Can only save commercial buildings data');
      return;
    }

    setIsSaving(true);
    setNotification({ type: null, message: '' });
    
    try {
      // Prepare the data to save
      const featureId = featureData.feature_id || featureData.OBJECTID || featureData.Id || featureData.id || featureData.OID_ || featureData.ID;
      
      // Ensure dropdown values are saved as strings
      const processedEditableFields = {
        ...formData,
        kecamatan: String(formData.kecamatan || ''),
        kelurahan: String(formData.kelurahan || '')
      };
      
      // Debug: Log the feature identification
      console.log('Feature Save Debug (with form data):', {
        featureDataKeys: Object.keys(featureData),
        feature_id: featureData.feature_id,
        OBJECTID: featureData.OBJECTID,
        Id: featureData.Id,
        id: featureData.id,
        OID_: featureData.OID_,
        ID: featureData.ID,
        selectedFeatureId: featureId,
        formData: formData,
        processedEditableFields: processedEditableFields,
        featureDataSample: featureData
      });
      
      const dataToSave = {
        featureId: featureId,
        layerId: 'layer-sebaran-rumah-komersil',
        properties: {
          ...featureData, // Keep existing properties
          ...processedEditableFields // Add/update editable fields with string conversion
        }
      };

      const response = await fetch('/api/data/update-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Feature updated successfully:', result);
        setNotification({
          type: 'success',
          message: `Feature updated successfully!`
        });
        
        // Update local state with the new data
        setEditableFields(formData);
        setIsEditing(false);
        
        // Notify parent component that feature was updated
        if (onFeatureUpdated) {
          onFeatureUpdated();
        }
        
        // Clear notification after 5 seconds
        setTimeout(() => {
          setNotification({ type: null, message: '' });
        }, 5000);
      } else {
        const errorData = await response.json();
        console.error('Failed to update feature:', errorData);
        setNotification({
          type: 'error',
          message: `Failed to update feature: ${errorData.error || 'Unknown error'}`
        });
      }
    } catch (error) {
      console.error('Error saving feature:', error);
      setNotification({
        type: 'error',
        message: `Error saving feature: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAll = async () => {
    if (!confirm('Are you sure you want to reset ALL properties in the rumah_komersil.geojson file? This action cannot be undone!')) {
      return;
    }

    setIsSaving(true);
    setNotification({ type: null, message: '' });
    
    try {
      const response = await fetch('/api/data/reset-properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Properties reset successfully:', result);
        setNotification({
          type: 'success',
          message: `All properties reset successfully! ${result.totalFeatures} features updated.`
        });
        
        // Notify parent component that data was reset
        if (onFeatureUpdated) {
          onFeatureUpdated();
        }
        
        // Clear notification after 5 seconds
        setTimeout(() => {
          setNotification({ type: null, message: '' });
        }, 5000);
      } else {
        const errorData = await response.json();
        console.error('Failed to reset properties:', errorData);
        setNotification({
          type: 'error',
          message: `Failed to reset properties: ${errorData.error || 'Unknown error'}`
        });
      }
    } catch (error) {
      console.error('Error resetting properties:', error);
      setNotification({
        type: 'error',
        message: `Error resetting properties: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isCommercialBuildings = layerName === 'Sebaran Rumah Komersil';

  // Debug logging
  console.log('FeatureDrawer Debug:', {
    layerName,
    isCommercialBuildings,
    featureData: featureData ? 'exists' : 'null',
    layerNameLength: layerName?.length,
    layerNameExact: `"${layerName}"`
  });

  if (!featureData) return null;

  return (
    <>
      {/* Right Drawer with enhanced slide animation */}
      <div className={`fixed right-0 top-0 h-full z-[9999] transition-all duration-500 ease-out transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className={`h-full w-96 bg-white/95 backdrop-blur-md shadow-2xl border-l border-gray-200/50 transition-all duration-700 ease-out ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <div className="flex flex-col h-full">
            {/* Action Buttons - Above Title */}
            <div className="flex items-center justify-end gap-3 p-4 pb-2 bg-gradient-to-r from-gray-50/90 to-gray-100/90 backdrop-blur-sm border-b border-gray-200/50">
              {isCommercialBuildings && (
                <>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg flex items-center gap-2 font-medium border border-blue-400/30"
                      title="Edit feature"
                    >
                      <Edit3 size={16} className="animate-pulse" />
                      <span className="text-sm">Edit</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium border border-green-400/30"
                      title="Save changes"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span className="text-sm">Saving...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm">Save</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleResetAll}
                    disabled={isSaving}
                    className="px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-orange-400/30"
                    title="Reset all properties"
                  >
                    <span className="text-sm">🔄 Reset All</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg flex items-center gap-2 border border-red-400/30"
                title="Close drawer"
              >
                <X size={18} />
                <span className="text-sm font-medium">Close</span>
              </button>
            </div>

            {/* Enhanced Header with animations */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-sm">
              <div className="animate-fade-in flex-1">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🗺️</span>
                  Feature Properties
                </h3>
                <p className="text-sm text-gray-600 mt-1 opacity-80">{layerName}</p>
              </div>
            </div>

            {/* Enhanced Content with animations */}
            <div className="flex-1 overflow-y-auto p-4 drawer-scrollbar">
              {/* Notification */}
              {notification.type && (
                <div className={`mb-4 p-3 rounded-lg border ${
                  notification.type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {notification.type === 'success' ? '✅' : '❌'}
                    </span>
                    <span className="text-sm font-medium">{notification.message}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-4 animate-fade-in-up">
                {/* Commercial Buildings Editable Fields */}
                {isCommercialBuildings && isEditing && (
                  <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 border border-green-200/60 rounded-xl p-4 backdrop-blur-sm shadow-sm">
                    <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <span className="text-green-600">✏️</span>
                      Edit Commercial Building Data
                    </h4>
                    <CommercialBuildingForm
                      initialData={featureData}
                      onSave={async (formData) => {
                        // Call the save function with the form data directly
                        await handleSaveWithData(formData);
                      }}
                      onCancel={() => setIsEditing(false)}
                      isSaving={isSaving}
                    />
                  </div>
                )}

                {/* Enhanced Feature Summary */}
                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/60 rounded-xl p-4 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <span className="text-blue-600">📋</span>
                    Feature Summary
                  </h4>
                  <div className="space-y-3 text-sm">
                    {/* Commercial Buildings specific properties */}
                    {editableFields.idRumahSebaran && (
                      <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg border border-blue-100/50">
                        <span className="text-blue-700 font-medium">Building ID:</span>
                        <span className="text-blue-800 font-semibold">{editableFields.idRumahSebaran}</span>
                      </div>
                    )}
                    {editableFields.namaKawasanPerumahan && (
                      <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg border border-blue-100/50">
                        <span className="text-blue-700 font-medium">Kawasan:</span>
                        <span className="text-blue-800 font-semibold">{editableFields.namaKawasanPerumahan}</span>
                      </div>
                    )}
                    {editableFields.alamat && (
                      <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg border border-blue-100/50">
                        <span className="text-blue-700 font-medium">Alamat:</span>
                        <span className="text-blue-800 font-semibold">{editableFields.alamat}</span>
                      </div>
                    )}
                    {featureData.L && (
                      <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg border border-blue-100/50">
                        <span className="text-blue-700 font-medium">Area (m²):</span>
                        <span className="text-blue-800 font-semibold">{Number(featureData.L).toLocaleString()}</span>
                      </div>
                    )}
                    {featureData.LUAS && (
                      <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg border border-blue-100/50">
                        <span className="text-blue-700 font-medium">Area (m²):</span>
                        <span className="text-blue-800 font-semibold">{Number(featureData.LUAS).toLocaleString()}</span>
                      </div>
                    )}
                    {/* Administrative properties */}
                    {editableFields.kecamatan && (
                      <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg border border-blue-100/50">
                        <span className="text-blue-700 font-medium">Kecamatan:</span>
                        <span className="text-blue-800 font-semibold">{editableFields.kecamatan}</span>
                      </div>
                    )}
                    {editableFields.kelurahan && (
                      <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg border border-blue-100/50">
                        <span className="text-blue-800 font-medium">Kelurahan/Desa:</span>
                        <span className="text-blue-800 font-semibold">{editableFields.kelurahan}</span>
                      </div>
                    )}
                    {featureData.OBJECTID && (
                      <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg border border-blue-100/50">
                        <span className="text-blue-700 font-medium">Object ID:</span>
                        <span className="text-blue-800 font-semibold">{featureData.OBJECTID}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced All Properties */}
                <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-gray-600">🔍</span>
                    All Properties
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(featureData).map(([key, value], index) => (
                      <div key={key} className="space-y-1 animate-fade-in-up" style={{ animationDelay: `${0.15 + index * 0.05}s` }}>
                        <label className="block text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </label>
                        <div className="px-3 py-2 bg-white/70 border border-gray-200/60 rounded-lg text-sm text-gray-700 min-h-[40px] flex items-center backdrop-blur-sm hover:bg-white/90 transition-all duration-200">
                          {String(value) || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Footer */}
            <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/90 to-gray-100/90 backdrop-blur-sm">
              <div className="text-xs text-gray-600 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {isCommercialBuildings && isEditing ? 'Editing mode - Click Save to update' : 'Click on map features to view their properties'}
                </div>
                <div className="text-gray-500">
                  {Object.keys(featureData).length} properties found
                  {isCommercialBuildings && (
                    <span className="block text-green-600 font-medium">
                      ✨ Editable commercial building data
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 