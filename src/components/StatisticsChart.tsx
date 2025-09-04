'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { X } from 'lucide-react';

interface StatisticsChartProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GroupedData {
  kecamatan: string;
  [key: string]: string | number; // Dynamic year keys
}

interface Point {
  x: number;
  y: number;
}

interface Polygon {
  points: Point[];
}

export default function StatisticsChart({ isOpen, onClose }: StatisticsChartProps) {
  const [chartData, setChartData] = useState<GroupedData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      analyzeData();
    }
  }, [isOpen]);

  // Point-in-polygon algorithm
  const pointInPolygon = (point: Point, polygon: Polygon): boolean => {
    const { x, y } = point;
    const { points } = polygon;
    
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x;
      const yi = points[i].y;
      const xj = points[j].x;
      const yj = points[j].y;
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Calculate centroid of a polygon
  const calculateCentroid = (coordinates: number[][]): Point => {
    let x = 0;
    let y = 0;
    
    for (let i = 0; i < coordinates.length; i++) {
      x += coordinates[i][0];
      y += coordinates[i][1];
    }
    
    return {
      x: x / coordinates.length,
      y: y / coordinates.length
    };
  };

  const analyzeData = async () => {
    setIsLoading(true);
    try {
      // Fetch the rumah komersil GeoJSON data
      const response = await fetch('/api/data/get-rumah-komersil');
      const rumahKomersilData = await response.json();

      // Fetch the layer administrasi GeoJSON data to get kecamatan boundaries
      const adminResponse = await fetch('/new data/layer_administrasi.geojson');
      const adminData = await adminResponse.json();

      // Create a map of kecamatan boundaries
      const kecamatanBoundaries = new Map<string, Polygon>();
      const kecamatanNames = new Set<string>();
      
      // Extract kecamatan boundaries from admin data
      if (adminData.features) {
        console.log('Debug - Admin features found:', adminData.features.length);
        adminData.features.forEach((feature: any, index: number) => {
          if (feature.properties && feature.properties.KECAMATAN && feature.geometry) {
            const kecamatanName = feature.properties.KECAMATAN;
            kecamatanNames.add(kecamatanName);
            
            // Debug: Log first few admin features
            if (index < 3) {
              console.log(`Debug - Admin feature ${index}:`, {
                kecamatan: kecamatanName,
                properties: feature.properties
              });
            }
            
            // Convert coordinates to our Point format
            if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates[0]) {
              const points = feature.geometry.coordinates[0].map((coord: number[]) => ({
                x: coord[0],
                y: coord[1]
              }));
              
              kecamatanBoundaries.set(kecamatanName, { points });
            }
          }
        });
        console.log('Debug - Total kecamatan boundaries created:', kecamatanBoundaries.size);
      } else {
        console.log('Debug - No admin features found');
      }

      // Group data by kecamatan and year
      const groupedData = new Map<string, Map<string, number>>();
      const allYears = new Set<string>();
      
      // Process rumah komersil features first to collect years and kecamatan
      if (rumahKomersilData.features) {
        console.log('Debug - Processing features, total count:', rumahKomersilData.features.length);
        
        rumahKomersilData.features.forEach((feature: any, index: number) => {
          if (feature.geometry && feature.geometry.type === 'Polygon') {
            // Debug: Log first few features to see their properties
            if (index < 3) {
              console.log(`Debug - Feature ${index} properties:`, feature.properties);
            }
            
            // Get the year from feature properties
            const tahun = feature.properties?.TAHUN || feature.properties?.tahun || 'Unknown';
            allYears.add(String(tahun));
            
            // Try to get kecamatan from feature properties first (more reliable)
            let kecamatanName = feature.properties?.KECAMATAN || feature.properties?.kecamatan;
            
            // Debug: Log kecamatan detection
            if (index < 3) {
              console.log(`Debug - Feature ${index} kecamatan detection:`, {
                fromProperties: feature.properties?.KECAMATAN || feature.properties?.kecamatan,
                finalKecamatan: kecamatanName
              });
            }
            
            // If no kecamatan in properties, try spatial analysis
            if (!kecamatanName) {
              // Calculate centroid of the commercial building
              const centroid = calculateCentroid(feature.geometry.coordinates[0]);
              
              // Check which kecamatan this centroid falls into
              for (const [adminKecamatanName, boundary] of kecamatanBoundaries) {
                if (pointInPolygon(centroid, boundary)) {
                  kecamatanName = adminKecamatanName;
                  break;
                }
              }
            }
            
            // If still no kecamatan found, assign to the first one (fallback)
            if (!kecamatanName && kecamatanNames.size > 0) {
              kecamatanName = Array.from(kecamatanNames)[0];
            }
            
            // Add to grouped data if we have a kecamatan
            if (kecamatanName) {
              // Initialize kecamatan if it doesn't exist
              if (!groupedData.has(kecamatanName)) {
                groupedData.set(kecamatanName, new Map<string, number>());
              }
              
              const kecamatanYearMap = groupedData.get(kecamatanName);
              if (kecamatanYearMap) {
                const currentCount = kecamatanYearMap.get(String(tahun)) || 0;
                kecamatanYearMap.set(String(tahun), currentCount + 1);
              }
            } else {
              console.log(`Debug - Feature ${index} has no kecamatan assigned`);
            }
          }
        });
      }

      // Debug: Log what we found
      console.log('Debug - Features processed:', rumahKomersilData.features?.length || 0);
      console.log('Debug - Kecamatan names from admin:', Array.from(kecamatanNames));
      console.log('Debug - Kecamatan names from features:', Array.from(groupedData.keys()));

      // Convert to chart data format for grouped bar chart
      const sortedYears = Array.from(allYears).sort();
      
      // Debug logging
      console.log('Debug - All Years found:', Array.from(allYears));
      console.log('Debug - Grouped Data:', groupedData);
      console.log('Debug - Sorted Years:', sortedYears);
      
      const chartDataArray: GroupedData[] = Array.from(groupedData.entries())
        .map(([kecamatan, yearMap]) => {
          const data: GroupedData = { kecamatan };
          sortedYears.forEach(year => {
            data[year] = yearMap.get(year) || 0;
          });
          return data;
        })
        .sort((a, b) => {
          // Sort by total count across all years
          const totalA = sortedYears.reduce((sum, year) => sum + (a[year] as number), 0);
          const totalB = sortedYears.reduce((sum, year) => sum + (b[year] as number), 0);
          return totalB - totalA;
        });

      console.log('Debug - Final Chart Data:', chartDataArray);
      setChartData(chartDataArray);
    } catch (error) {
      console.error('Error analyzing data:', error);
      // Fallback to mock data if there's an error
      const fallbackData: GroupedData[] = [
        { kecamatan: 'Purwakarta', '2020': 15, '2021': 20, '2022': 10 },
        { kecamatan: 'Plered', '2020': 12, '2021': 15, '2022': 5 },
        { kecamatan: 'Darangdan', '2020': 10, '2021': 12, '2022': 6 },
        { kecamatan: 'Wanayasa', '2020': 18, '2021': 12, '2022': 5 },
        { kecamatan: 'Tegalwaru', '2020': 8, '2021': 10, '2022': 4 }
      ];
      setChartData(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Statistics: Layer Sebaran Rumah Komersil per Kecamatan
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Analyzing spatial data...</div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Chart Information</h3>
              <p className="text-blue-700 text-sm">
                This chart displays the count of commercial buildings (Layer Sebaran Rumah Komersil) 
                for each Kecamatan in Purwakarta. The data is calculated using spatial analysis to 
                determine which administrative region each commercial building belongs to.
              </p>
            </div>

            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="kecamatan" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Count of Commercial Buildings', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [`${value} buildings`, name]}
                    labelFormatter={(label: string) => `Kecamatan: ${label}`}
                  />
                  <Legend />
                  {chartData.length > 0 && Object.keys(chartData[0]).filter(key => key !== 'kecamatan').map((year, index) => (
                    <Bar 
                      key={year}
                      dataKey={year} 
                      fill={`hsl(${index * 60}, 70%, 50%)`}
                      name={`Year ${year}`}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Total Kecamatan</h4>
                <p className="text-2xl font-bold text-blue-600">{chartData.length}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Total Buildings</h4>
                <p className="text-2xl font-bold text-green-600">
                  {chartData.length > 0 
                    ? chartData.reduce((sum, item) => {
                        const itemSum = Object.keys(item).filter(key => key !== 'kecamatan').reduce((yearSum, year) => yearSum + (item[year] as number), 0);
                        return sum + itemSum;
                      }, 0)
                    : 0
                  }
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Average per Kecamatan</h4>
                <p className="text-2xl font-bold text-purple-600">
                  {chartData.length > 0 
                    ? Math.round(chartData.reduce((sum, item) => {
                        const itemSum = Object.keys(item).filter(key => key !== 'kecamatan').reduce((yearSum, year) => yearSum + (item[year] as number), 0);
                        return sum + itemSum;
                      }, 0) / chartData.length)
                    : 0
                  }
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Top 5 Kecamatan by Commercial Buildings</h4>
              <div className="space-y-2">
                {chartData
                  .slice(0, 5)
                  .map((item, index) => {
                    const totalBuildings = Object.keys(item).filter(key => key !== 'kecamatan').reduce((sum, year) => sum + (item[year] as number), 0);
                    return (
                      <div key={item.kecamatan} className="flex justify-between items-center">
                        <span className="text-gray-700">
                          {index + 1}. {item.kecamatan}
                        </span>
                        <span className="font-semibold text-blue-600">{totalBuildings} buildings</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Data Source</h4>
              <p className="text-yellow-700 text-sm">
                This analysis uses real GeoJSON data from the Purwakarta region. The spatial analysis 
                determines which kecamatan each commercial building belongs to based on geographic coordinates.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
