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
    <div className={`fixed right-0 top-0 h-full z-[9998] transition-transform duration-300 ease-out ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      {/* Right Drawer with slide animation */}
      <div className="h-full w-96 bg-white shadow-xl border-l border-gray-200">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Feature Properties
              </h3>
              <p className="text-sm text-gray-600 mt-1">{layerName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 drawer-scrollbar">
            <div className="space-y-4">
              {Object.entries(featureData).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/_/g, ' ')}:
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 min-h-[40px] flex items-center">
                    {String(value) || '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              Click on map features to view their properties
            </div>
            <div className="mt-2 text-xs text-gray-400 text-center">
              {Object.keys(featureData).length} properties found
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 