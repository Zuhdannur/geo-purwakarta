# Statistics Feature Documentation

## Overview
The Statistics feature provides a comprehensive analysis of the "Layer Sebaran Rumah Komersil" (Commercial Buildings Distribution Layer) data across different Kecamatan (administrative districts) in Purwakarta.

## Features

### 1. Interactive Bar Chart
- Displays the count of commercial buildings for each Kecamatan
- Responsive design that works on all screen sizes
- Interactive tooltips showing detailed information
- Color-coded bars for easy visualization

### 2. Spatial Analysis
- Performs real-time spatial analysis of GeoJSON data
- Uses point-in-polygon algorithm to determine which Kecamatan each commercial building belongs to
- Calculates centroids of building polygons for accurate spatial positioning
- Handles complex polygon geometries from administrative boundaries

### 3. Statistical Summary
- Total count of Kecamatan regions
- Total count of commercial buildings
- Average buildings per Kecamatan
- Top 5 Kecamatan by commercial building count

### 4. Data Source Information
- Real-time analysis of actual GeoJSON data
- Fallback to sample data if analysis fails
- Transparent data processing methodology

## How to Use

### Accessing the Statistics
1. Look for the blue "Statistics" button in the top-left sidebar
2. Click the button to open the statistics modal
3. The chart will automatically analyze the spatial data and display results

### Understanding the Chart
- **X-Axis**: Kecamatan names (administrative districts)
- **Y-Axis**: Count of commercial buildings
- **Bars**: Each bar represents the total count for that Kecamatan
- **Tooltips**: Hover over bars to see exact counts

### Chart Controls
- **Close Button**: Click the X button to close the modal
- **Responsive Design**: Chart automatically adjusts to window size
- **Scroll**: Use scroll if content exceeds modal height

## Technical Implementation

### Dependencies
- **Recharts**: Professional charting library for React
- **Custom Spatial Analysis**: Point-in-polygon algorithm implementation
- **GeoJSON Processing**: Real-time parsing and analysis of spatial data

### Spatial Analysis Algorithm
```typescript
// Point-in-polygon algorithm using ray casting
const pointInPolygon = (point: Point, polygon: Polygon): boolean => {
  // Implementation details...
}

// Centroid calculation for polygon features
const calculateCentroid = (coordinates: number[][]): Point => {
  // Implementation details...
}
```

### Data Flow
1. **Data Fetching**: Retrieves GeoJSON files from public directory
2. **Boundary Extraction**: Extracts Kecamatan boundaries from administrative layer
3. **Feature Analysis**: Analyzes each commercial building feature
4. **Spatial Classification**: Determines which Kecamatan each building belongs to
5. **Count Aggregation**: Aggregates counts per Kecamatan
6. **Chart Rendering**: Displays results in interactive bar chart

## File Structure
```
src/components/
├── StatisticsChart.tsx          # Main statistics component
└── Sidebar.tsx                  # Updated with statistics button

public/new data/
├── rumah_komersil.geojson       # Commercial buildings data
└── layer_administrasi.geojson   # Administrative boundaries
```

## Error Handling
- **Network Errors**: Graceful fallback to sample data
- **Data Parsing Errors**: Comprehensive error logging
- **Spatial Analysis Failures**: Fallback classification methods
- **Loading States**: Clear user feedback during analysis

## Performance Considerations
- **Lazy Loading**: Chart only loads when opened
- **Efficient Algorithms**: Optimized spatial analysis algorithms
- **Memory Management**: Proper cleanup of large datasets
- **Responsive Updates**: Smooth chart animations and interactions

## Future Enhancements
- **Export Functionality**: PDF/Excel export of statistics
- **Time Series Analysis**: Historical building data trends
- **Interactive Filters**: Filter by building type, size, or other properties
- **Comparative Analysis**: Compare different time periods or regions
- **3D Visualization**: Enhanced spatial representation

## Troubleshooting

### Common Issues
1. **Chart Not Loading**: Check browser console for errors
2. **Empty Data**: Verify GeoJSON files are accessible
3. **Slow Performance**: Large datasets may take time to analyze
4. **Display Issues**: Ensure browser supports modern CSS features

### Debug Information
- Check browser console for detailed error messages
- Verify GeoJSON file paths and formats
- Monitor network requests for data fetching
- Review spatial analysis algorithm performance

## Support
For technical support or feature requests, please refer to the project documentation or contact the development team.
