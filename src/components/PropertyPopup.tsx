import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PropertyPopupProps {
  layerName: string;
  properties: Record<string, any>;
}

export default function PropertyPopup({ layerName, properties }: PropertyPopupProps) {
  // Define the priority order for specific properties
  const priorityOrder = ['nama_kec', 'nama_desa', 'Luas_ha', 'warna'];
  
  // Filter out geometry and internal properties
  const filteredProperties = Object.entries(properties).filter(
    ([key, value]) => 
      key !== 'geometry' && 
      key !== '_featureId' && 
      value !== null && 
      value !== undefined &&
      value !== ''
  );

  // Sort properties: priority properties first, then others
  const sortedProperties = [...filteredProperties].sort(([keyA], [keyB]) => {
    const indexA = priorityOrder.indexOf(keyA);
    const indexB = priorityOrder.indexOf(keyB);
    
    // If both are in priority order, sort by their index
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only A is in priority order, A comes first
    if (indexA !== -1) {
      return -1;
    }
    // If only B is in priority order, B comes first
    if (indexB !== -1) {
      return 1;
    }
    // If neither is in priority order, maintain original order
    return 0;
  });

  if (sortedProperties.length === 0) {
    return (
      <Card className="w-72 bg-card border border-border shadow-lg">
        <CardHeader className="px-3">
          <CardTitle className="text-sm font-semibold">{layerName}</CardTitle>
        </CardHeader>
        <CardContent className="px-3">
          <p className="text-xs text-muted-foreground">No properties available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-72 bg-card border border-border shadow-lg">
      <CardHeader className="px-3 pb-0">
        <CardTitle className="text-sm font-semibold">Layer : {layerName}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pt-0">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-medium bg-muted/50 py-2 px-2">Property</TableHead>
                <TableHead className="text-xs font-medium bg-muted/50 py-2 px-2">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProperties.map(([key, value]) => (
                <TableRow key={key} className="border-b border-border/50">
                  <TableCell className="text-xs font-medium py-1.5 px-2 text-muted-foreground bg-muted/20">
                    {formatPropertyName(key)}
                  </TableCell>
                  <TableCell className="text-xs py-1.5 px-2 break-words bg-background/50">
                    {formatPropertyValue(value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function formatPropertyName(key: string): string {
  // Convert camelCase/snake_case to readable format
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function formatPropertyValue(value: any): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'None';
  }
  return String(value);
}
