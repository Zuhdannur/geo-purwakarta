'use client';

import { useState, useEffect, useRef } from 'react';
import { Layers, X, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
      warna: 'warna', // Property name for feature-specific colors
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
      <Button variant="outline" onClick={() => setIsExpanded(!isExpanded)} className="flex items-center space-x-2">
        <Layers size={20} className="text-gray-700" />
        <span className="text-sm font-medium text-gray-700">Layers</span>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{selectedLayers.length}</span>
      </Button>

      {/* Layer Panel */}
      {isExpanded && (
        <Card className="absolute top-12 right-0 w-80 z-[9999]">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-lg">Layer Selection</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
              <X size={16} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border-b pb-3 mb-3">
              <div className="flex items-center space-x-3">
                <Checkbox checked={showBaseMap} onCheckedChange={() => setShowBaseMap(!showBaseMap)} />
                <div className="flex items-center space-x-2">
                  <Map size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Base Map</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">OpenStreetMap background tiles</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {Object.entries(layerConfigs).map(([layerId, config]) => (
                <div
                  key={layerId}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <Checkbox checked={selectedLayers.includes(layerId)} onCheckedChange={() => toggleLayer(layerId)} />
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
            <div className="pt-4">
              <div className="flex space-x-2">
                <Button variant="outline" onClick={clearAllLayers} className="flex-1">Clear All</Button>
                <Button onClick={loadAllLayers} className="flex-1">Load All</Button>
              </div>
              <div className="mt-3 text-xs text-gray-500 text-center">
                {selectedLayers.length} of {Object.keys(layerConfigs).length} layers selected
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 