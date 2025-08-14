'use client';

import { useState } from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';

interface LegendProps {
  selectedLayers: string[];
  selectedFeature?: {
    layerName: string;
    properties: any;
  } | null;
}

const layerConfigs = {
  'data': {
    name: 'Data',
    colorBy: 'JENIS',
    colorScheme: {
      'Sawah': { fill: '#90EE90', outline: '#228B22' },
      'Ladang': { fill: '#8B4513', outline: '#654321' },
      'Tegalan': { fill: '#D2B48C', outline: '#A0522D' },
      'Kebun': { fill: '#6B8E23', outline: '#556B2F' },
      'Hutan': { fill: '#006400', outline: '#004000' },
      'Pemukiman': { fill: '#FA8072', outline: '#E9967A' },
      'Industri': { fill: '#FFD700', outline: '#DAA520' },
      'Perkantoran': { fill: '#4169E1', outline: '#191970' },
      'Pertokoan': { fill: '#FF69B4', outline: '#DC143C' }
    }
  },
  'krb-gempa': {
    name: 'KRB Gempa Bumi',
    colorBy: 'UNSUR',
    colorScheme: {
      'Kawasan Rawan Bencana Rendah': { fill: '#00FF00', outline: '#008000' },
      'Kawasan Rawan Bencana Menengah': { fill: '#FFFF00', outline: '#DAA520' },
      'Kawasan Rawan Bencana Tinggi': { fill: '#FF0000', outline: '#8B0000' },
      'Kawasan Rawan Bencana Sangat Tinggi': { fill: '#8B0000', outline: '#4B0000' }
    }
  },
  'kemiringan': {
    name: 'Kemiringan Lereng',
    colorBy: 'KETERANGAN',
    colorScheme: {
      '0% - 8%': { fill: '#90EE90', outline: '#228B22' },
      '8% - 15%': { fill: '#FFFF00', outline: '#DAA520' },
      '15% - 25%': { fill: '#FFA500', outline: '#FF8C00' },
      '25% - 45%': { fill: '#FF4500', outline: '#DC143C' },
      '> 45%': { fill: '#8B0000', outline: '#4B0000' }
    }
  },
  'kawasan': {
    name: 'Kawasan Terbangun',
    colorBy: 'JENIS',
    colorScheme: {
      'Sawah': { fill: '#90EE90', outline: '#228B22' },
      'Ladang': { fill: '#8B4513', outline: '#654321' },
      'Tegalan': { fill: '#D2B48C', outline: '#A0522D' },
      'Kebun': { fill: '#6B8E23', outline: '#556B2F' },
      'Hutan': { fill: '#006400', outline: '#004000' },
      'Pemukiman': { fill: '#FA8072', outline: '#E9967A' },
      'Industri': { fill: '#FFD700', outline: '#DAA520' },
      'Perkantoran': { fill: '#4169E1', outline: '#191970' },
      'Pertokoan': { fill: '#FF69B4', outline: '#DC143C' }
    }
  },
  'rencana': {
    name: 'Rencana Pola Ruang',
    colorBy: 'NAMOBJ',
    colorScheme: {
      'Badan Air': { fill: '#4169E1', outline: '#191970' },
      'Hutan Lindung': { fill: '#006400', outline: '#004000' },
      'Hutan Produksi': { fill: '#228B22', outline: '#006400' },
      'Pertanian': { fill: '#90EE90', outline: '#228B22' },
      'Pemukiman': { fill: '#FA8072', outline: '#E9967A' },
      'Industri': { fill: '#FFD700', outline: '#DAA520' },
      'Pariwisata': { fill: '#FF69B4', outline: '#DC143C' },
      'Infrastruktur': { fill: '#808080', outline: '#696969' }
    }
  }
};

export default function Legend({ selectedLayers, selectedFeature }: LegendProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (selectedLayers.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 z-40">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
      >
        {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>

      {/* Legend Panel */}
      {isVisible && (
        <div className="bg-white rounded-lg shadow-lg p-4 max-w-80 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Legend</h3>
          
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
        </div>
      )}
    </div>
  );
} 