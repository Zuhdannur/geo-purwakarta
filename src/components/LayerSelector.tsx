'use client';

import { useState, useEffect, useRef } from 'react';
import { Layers, X, Check, Map } from 'lucide-react';

interface LayerSelectorProps {
  selectedLayers: string[];
  setSelectedLayers: (layers: string[]) => void;
  showBaseMap: boolean;
  setShowBaseMap: (show: boolean) => void;
}

export default function LayerSelector({ 
  selectedLayers, 
  setSelectedLayers, 
  showBaseMap, 
  setShowBaseMap 
}: LayerSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const layerConfigs = {
    'layer-administrasi': {
      name: 'Layer Administrasi (6.4MB)',
      color: '#4a90e2',
      description: 'Administrative boundaries'
    }
  };

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const toggleLayer = (layerId: string) => {
    if (selectedLayers.includes(layerId)) {
      setSelectedLayers(selectedLayers.filter(l => l !== layerId));
    } else {
      setSelectedLayers([...selectedLayers, layerId]);
    }
  };

  const clearAllLayers = () => {
    setSelectedLayers([]);
  };

  const loadAllLayers = () => {
    setSelectedLayers(Object.keys(layerConfigs));
  };

  return (
    <div className="absolute top-4 right-4 z-[9999]" ref={panelRef}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
      >
        <Layers size={20} className="text-gray-700" />
        <span className="text-sm font-medium text-gray-700">Layers</span>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          {selectedLayers.length}
        </span>
      </button>

      {/* Layer Panel */}
      {isExpanded && (
        <div className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Layer Selection</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={16} />
            </button>
          </div>

          {/* Base Map Toggle */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowBaseMap(!showBaseMap)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  showBaseMap
                    ? 'bg-green-600 border-green-600'
                    : 'border-gray-300 hover:border-green-400'
                }`}
              >
                {showBaseMap && (
                  <Check size={12} className="text-white" />
                )}
              </button>
              
              <div className="flex items-center space-x-2">
                <Map size={16} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Base Map</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-8">
              OpenStreetMap background tiles
            </p>
          </div>

          {/* Layer List */}
          <div className="max-h-96 overflow-y-auto">
            {Object.entries(layerConfigs).map(([layerId, config]) => (
              <div
                key={layerId}
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <button
                  onClick={() => toggleLayer(layerId)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedLayers.includes(layerId)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {selectedLayers.includes(layerId) && (
                    <Check size={12} className="text-white" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {config.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {config.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <div className="flex space-x-2">
              <button
                onClick={clearAllLayers}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={loadAllLayers}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Load All
              </button>
            </div>
            
            <div className="mt-3 text-xs text-gray-500 text-center">
              {selectedLayers.length} of {Object.keys(layerConfigs).length} layers selected
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 