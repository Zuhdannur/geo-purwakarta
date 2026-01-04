/**
 * Utility functions for normalizing and comparing geometries
 */

/**
 * Extract all coordinates from geometry recursively
 * @param coords - The coordinates array from geometry
 * @param precision - Number of decimal places to round to (default: 6)
 * @returns Array of [x, y] coordinate pairs
 */
export function extractAllCoordinates(coords: any, precision: number = 6): number[][] {
  const result: number[][] = [];
  
  const extract = (arr: any) => {
    if (Array.isArray(arr)) {
      if (arr.length >= 2 && 
          typeof arr[0] === 'number' && typeof arr[1] === 'number' &&
          isFinite(arr[0]) && isFinite(arr[1])) {
        // Round to precision and store
        result.push([
          Math.round(arr[0] * Math.pow(10, precision)) / Math.pow(10, precision),
          Math.round(arr[1] * Math.pow(10, precision)) / Math.pow(10, precision)
        ]);
      } else {
        arr.forEach(extract);
      }
    }
  };
  
  extract(coords);
  return result;
}

/**
 * Normalize coordinates to a consistent string representation
 * This creates a hash-like string that can be used for matching geometries
 * even if they come from different sources or have slight formatting differences
 * 
 * @param geometry - GeoJSON geometry object
 * @param precision - Number of decimal places to round to (default: 6, ~0.1m accuracy)
 * @returns Normalized coordinate string or null if invalid
 */
export function normalizeCoordinatesToString(geometry: any, precision: number = 6): string | null {
  if (!geometry || !geometry.coordinates) {
    return null;
  }
  
  // Extract all coordinates
  const coords = extractAllCoordinates(geometry.coordinates, precision);
  
  if (coords.length === 0) {
    return null;
  }
  
  // Sort coordinates by x, then y to ensure consistent ordering
  // This handles cases where coordinates might be in different orders
  coords.sort((a, b) => {
    if (a[0] !== b[0]) return a[0] - b[0];
    return a[1] - b[1];
  });
  
  // Convert to string with consistent formatting
  return coords.map(c => `${c[0]},${c[1]}`).join('|');
}

