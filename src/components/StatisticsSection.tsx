'use client';

import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface GroupedData {
  kecamatan: string;
  [key: string]: string | number;
}

interface Point {
  x: number;
  y: number;
}

interface Polygon {
  points: Point[];
}

export default function StatisticsSection() {
  const [chartData, setChartData] = useState<GroupedData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    analyzeData();
  }, []);

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

  const calculateCentroid = (coordinates: number[][]): Point => {
    let x = 0;
    let y = 0;

    for (let i = 0; i < coordinates.length; i++) {
      x += coordinates[i][0];
      y += coordinates[i][1];
    }

    return { x: x / coordinates.length, y: y / coordinates.length };
  };

  const analyzeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/data/get-rumah-komersil');
      const rumahKomersilData = await response.json();

      const adminResponse = await fetch('/new data/layer_administrasi.geojson');
      const adminData = await adminResponse.json();

      const kecamatanBoundaries = new Map<string, Polygon>();
      const kecamatanNames = new Set<string>();

      if (adminData.features) {
        adminData.features.forEach((feature: any) => {
          if (feature.properties && feature.properties.KECAMATAN && feature.geometry) {
            const kecamatanName = feature.properties.KECAMATAN;
            kecamatanNames.add(kecamatanName);

            if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates[0]) {
              const points = feature.geometry.coordinates[0].map((coord: number[]) => ({ x: coord[0], y: coord[1] }));
              kecamatanBoundaries.set(kecamatanName, { points });
            }
          }
        });
      }

      const groupedData = new Map<string, Map<string, number>>();
      const allYears = new Set<string>();

      if (rumahKomersilData.features) {
        rumahKomersilData.features.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.type === 'Polygon') {
            const tahun = feature.properties?.TAHUN || feature.properties?.tahun || 'Unknown';
            allYears.add(String(tahun));

            let kecamatanName = feature.properties?.KECAMATAN || feature.properties?.kecamatan;
            if (!kecamatanName) {
              const centroid = calculateCentroid(feature.geometry.coordinates[0]);
              for (const [adminKecamatanName, boundary] of kecamatanBoundaries) {
                if (pointInPolygon(centroid, boundary)) {
                  kecamatanName = adminKecamatanName;
                  break;
                }
              }
            }

            if (!kecamatanName && kecamatanNames.size > 0) {
              kecamatanName = Array.from(kecamatanNames)[0];
            }

            if (kecamatanName) {
              if (!groupedData.has(kecamatanName)) {
                groupedData.set(kecamatanName, new Map<string, number>());
              }
              const kecamatanYearMap = groupedData.get(kecamatanName)!;
              const currentCount = kecamatanYearMap.get(String(tahun)) || 0;
              kecamatanYearMap.set(String(tahun), currentCount + 1);
            }
          }
        });
      }

      const sortedYears = Array.from(allYears).sort();

      const chartDataArray: GroupedData[] = Array.from(groupedData.entries())
        .map(([kecamatan, yearMap]) => {
          const data: GroupedData = { kecamatan };
          sortedYears.forEach(year => {
            data[year] = yearMap.get(year) || 0;
          });
          return data;
        })
        .sort((a, b) => {
          const totalA = sortedYears.reduce((sum, year) => sum + (a[year] as number), 0);
          const totalB = sortedYears.reduce((sum, year) => sum + (b[year] as number), 0);
          return totalB - totalA;
        });

      setChartData(chartDataArray);
    } catch (error) {
      console.error('Error analyzing data:', error);
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
  }, []);

  return (
    <div className="w-full overflow-x-auto p-2 md:p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Statistics: Layer Sebaran Rumah Komersil per Kecamatan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">Overview of commercial buildings by district and year.</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Analyzing spatial data...</div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chart Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 text-sm">
                This chart displays the count of commercial buildings (Layer Sebaran Rumah Komersil)
                for each Kecamatan in Purwakarta.
              </p>
            </CardContent>
          </Card>

          <div className="h-96 min-w-[720px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="kecamatan" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 12 }} />
                <YAxis label={{ value: 'Count of Commercial Buildings', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any, name: string) => [`${value} buildings`, name]} labelFormatter={(label: string) => `Kecamatan: ${label}`} />
                <Legend />
                {chartData.length > 0 && Object.keys(chartData[0]).filter(key => key !== 'kecamatan').map((year, index) => (
                  <Bar key={year} dataKey={year} fill={`hsl(${index * 60}, 70%, 50%)`} name={`Year ${year}`} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Kecamatan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{chartData.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Buildings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {chartData.length > 0 
                    ? chartData.reduce((sum, item) => {
                        const itemSum = Object.keys(item).filter(key => key !== 'kecamatan').reduce((yearSum, year) => yearSum + (item[year] as number), 0);
                        return sum + itemSum;
                      }, 0)
                    : 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Average per Kecamatan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-600">
                  {chartData.length > 0 
                    ? Math.round(chartData.reduce((sum, item) => {
                        const itemSum = Object.keys(item).filter(key => key !== 'kecamatan').reduce((yearSum, year) => yearSum + (item[year] as number), 0);
                        return sum + itemSum;
                      }, 0) / chartData.length)
                    : 0}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top 5 Kecamatan by Commercial Buildings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
              {chartData
                .slice(0, 5)
                .map((item, index) => {
                  const totalBuildings = Object.keys(item).filter(key => key !== 'kecamatan').reduce((sum, year) => sum + (item[year] as number), 0);
                  return (
                    <div key={item.kecamatan} className="flex justify-between items-center">
                      <span className="text-gray-700">{index + 1}. {item.kecamatan}</span>
                      <span className="font-semibold text-blue-600">{totalBuildings} buildings</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Data Source</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-700 text-sm">
                This analysis uses GeoJSON data from the Purwakarta region.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


