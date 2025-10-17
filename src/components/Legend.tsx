'use client';

import { useState } from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LegendProps {
  selectedLayers: string[];
  selectedFeature?: {
    layerName: string;
    properties: any;
  } | null;
}

const layerConfigs = {
  'layer-administrasi': {
    name: 'Layer Administrasi',
    colorBy: 'WADMKC',
    warna: 'warna', // Property name for feature-specific colors
    colorScheme: {
      'Purwakarta': { fill: '#FF6B6B', outline: '#CC5555' },
      'Plered': { fill: '#4ECDC4', outline: '#3EA89F' },
      'Darangdan': { fill: '#45B7D1', outline: '#3692A8' },
      'Wanayasa': { fill: '#96CEB4', outline: '#7AB89A' },
      'Tegalwaru': { fill: '#FFEAA7', outline: '#E6D396' },
      'Jatiluhur': { fill: '#DDA0DD', outline: '#C88BC8' },
      'Sukatani': { fill: '#98D8C8', outline: '#7BC4B4' },
      'Maniis': { fill: '#F7DC6F', outline: '#E4C95C' },
      'Pasawahan': { fill: '#BB8FCE', outline: '#A67BB8' },
      'Bojong': { fill: '#85C1E9', outline: '#6BA8D0' },
      'Babakancikao': { fill: '#F8C471', outline: '#E5B15E' },
      'Bungursari': { fill: '#82E0AA', outline: '#6FCD97' },
      'Campaka': { fill: '#F1948A', outline: '#DE8177' },
      'Cibatu': { fill: '#85C1E9', outline: '#6BA8D0' },
      'Cikarang': { fill: '#F7DC6F', outline: '#E4C95C' },
      'Cipeundeuy': { fill: '#BB8FCE', outline: '#A67BB8' },
      'Cipicung': { fill: '#82E0AA', outline: '#6FCD97' },
      'Cisaat': { fill: '#F1948A', outline: '#DE8177' },
      'Cisarua': { fill: '#85C1E9', outline: '#6BA8D0' },
      'Ciwangi': { fill: '#F7DC6F', outline: '#E4C95C' },
      'Kiarapedes': { fill: '#BB8FCE', outline: '#A67BB8' },
      'Pondoksalam': { fill: '#82E0AA', outline: '#6FCD97' },
      'Sukasari': { fill: '#F1948A', outline: '#DE8177' }
    }
  }
};

export default function Legend({ selectedLayers, selectedFeature }: LegendProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (selectedLayers.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 z-40">
      {/* Toggle Button */}
      <Button variant="outline" size="icon" onClick={() => setIsVisible(!isVisible)} className="mb-2">
        {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
      </Button>

      {/* Legend Panel */}
      {isVisible && (
        <Card className="max-w-80 max-h-96 overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-lg">Legend</CardTitle>
          </CardHeader>
          <CardContent>
          
          {/* Selected Feature Info */}
          {selectedFeature && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Info size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Selected Feature</span>
              </div>
              <div className="text-xs text-blue-700">
                <div><strong>Layer:</strong> {selectedFeature.layerName}</div>
                <div><strong>Properties:</strong> {Object.keys(selectedFeature.properties).length}</div>
              </div>
            </div>
          )}
          
          {selectedLayers.map(layerId => {
            const config = layerConfigs[layerId as keyof typeof layerConfigs];
            if (!config) return null;

            return (
              <div key={layerId} className="mb-4 last:mb-0">
                <h4 className="text-sm font-medium text-gray-700 mb-2 border-b border-gray-200 pb-1">
                  {config.name}
                </h4>
                
                <div className="space-y-1">
                  {Object.entries(config.colorScheme).map(([key, colors]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: colors.fill }}
                      />
                      <span className="text-xs text-gray-600 flex-1">
                        {key}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 