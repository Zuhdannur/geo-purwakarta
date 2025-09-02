'use client';

import { X } from 'lucide-react';

interface FeatureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  featureData: any;
  layerName: string;
}

export default function FeatureDrawer({ 
  isOpen, 
  onClose, 
  featureData, 
  layerName 
}: FeatureDrawerProps) {
  if (!featureData) return null;

  return (
    <>
      {/* Removed backdrop overlay to keep map fully visible and interactive */}
      
      {/* Right Drawer with enhanced slide animation */}
      <div className={`fixed right-0 top-0 h-full z-[9999] transition-all duration-500 ease-out transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className={`h-full w-96 bg-white/95 backdrop-blur-md shadow-2xl border-l border-gray-200/50 transition-all duration-700 ease-out ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <div className="flex flex-col h-full">
            {/* Enhanced Header with animations */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-sm">
              <div className="animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🗺️</span>
                  Feature Properties
                </h3>
                <p className="text-sm text-gray-600 mt-1 opacity-80">{layerName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-red-100 hover:text-red-600 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                title="Close drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Enhanced Content with animations */}
            <div className="flex-1 overflow-y-auto p-4 drawer-scrollbar">
              <div className="space-y-4 animate-fade-in-up">
                {/* Enhanced Feature Summary */}
                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/60 rounded-xl p-4 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <span className="text-blue-600">📋</span>
                    Feature Summary
                  </h4>
                  <div className="space-y-3 text-sm">
                    {featureData.WADMKC && (
                      <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg border border-blue-100/50">
                        <span className="text-blue-700 font-medium">Kecamatan:</span>
                        <span className="text-blue-800 font-semibold">{featureData.WADMKC}</span>
                      </div>
                    )}
                    {featureData.WADMKD && (
                      <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg border border-blue-100/50">
                        <span className="text-blue-700 font-medium">Kelurahan/Desa:</span>
                        <span className="text-blue-800 font-semibold">{featureData.WADMKD}</span>
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
                  Click on map features to view their properties
                </div>
                <div className="text-gray-500">
                  {Object.keys(featureData).length} properties found
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 