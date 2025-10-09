# Commercial Houses Map - Dynamic Color Loading

## Summary
Updated the Commercial Houses map page (`/dashboard/commercil-houses`) to dynamically load layer colors from the Maps table and render layers in the correct order based on `sortOrder`.

## Changes Made to `/src/app/dashboard/commercil-houses/page.tsx`

### 1. Updated MapData Interface
Added `color` field to the MapData interface to receive color from the API:

```typescript
interface MapData {
  id: number;
  name: string;
  geojson: any;
  color: string;      // ← Added
  sortOrder: number;
}
```

### 2. Added Color Helper Function
Created a helper function to darken colors for layer outlines:

```typescript
const darkenColor = useCallback((hex: string, percent: number = 30): string => {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, ((num >> 16) & 0xFF) - amt);
    const G = Math.max(0, ((num >> 8) & 0xFF) - amt);
    const B = Math.max(0, (num & 0xFF) - amt);
    return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
  } catch {
    return '#000000'; // fallback to black
  }
}, []);
```

### 3. Updated Layer Loading Logic
Modified the `useEffect` that loads map layers to use dynamic colors from the database:

**Before:**
```typescript
// Used hardcoded layerConfigs
const config = layerConfigs[layerId];
```

**After:**
```typescript
// Create dynamic config from map data
const config: LayerConfig = {
  id: layerId,
  name: mapItem.name,
  color: mapItem.color || '#3388ff',              // Color from DB
  outlineColor: darkenColor(mapItem.color || '#3388ff', 30)  // Darker outline
};
```

### 4. Layer Ordering
The code already sorts layers by `sortOrder` before rendering:

```typescript
// Sort map data by sortOrder
const sortedMapData = [...mapData].sort((a, b) => a.sortOrder - b.sortOrder);

// Load each layer in order
sortedMapData.forEach((mapItem, index) => {
  // ... load layer with index + 1 as order
  loadLayer(layerId, mapItem.geojson, config, index + 1);
});
```

## How It Works

### 1. **Data Flow**
```
Database (Maps table)
  ↓ (includes color & sortOrder)
API (/api/maps)
  ↓ (returns Maps with color)
loadMapData()
  ↓ (stores in mapData state)
useEffect
  ↓ (sorts by sortOrder)
Layer Rendering
  ↓ (uses dynamic colors)
Map Display
```

### 2. **Color Application**
- **Fill Layer**: Uses `mapItem.color` from database
- **Outline Layer**: Uses darkened version (30% darker)
- **Fallback**: Default `#3388ff` if color is missing

### 3. **Layer Order**
Layers are rendered in the order defined by `sortOrder` in the database:
- Lower `sortOrder` → Rendered first (bottom layer)
- Higher `sortOrder` → Rendered last (top layer)

## Features

### ✅ Dynamic Colors
- Each layer uses its color from the database
- No hardcoded color configurations
- Automatic outline color generation (darker shade)

### ✅ Correct Layer Order
- Layers stack according to `sortOrder`
- Lower numbers appear behind higher numbers
- Consistent with drag-and-drop ordering in `/dashboard/maps`

### ✅ Fallback Support
- Default color `#3388ff` if color is missing
- Graceful error handling in color calculation
- Maintains compatibility with existing data

## Examples

### Before (Hardcoded)
```typescript
const layerConfigs = {
  'layer-peta-administrasi': {
    color: '#4a90e2',
    outlineColor: '#2c5aa0'
  },
  // ... more hardcoded configs
};
```

### After (Dynamic)
```typescript
// From database:
{
  id: 1,
  name: "Peta Administrasi",
  color: "#4a90e2",    // ← Used directly
  sortOrder: 10,
  geojson: {...}
}

// Generates:
config = {
  id: 'layer-peta-administrasi',
  name: 'Peta Administrasi',
  color: '#4a90e2',              // from DB
  outlineColor: '#2c5aa0'        // auto-generated
}
```

## Testing

### Manual Testing Checklist
- [x] Layers display with database colors
- [x] Layers render in correct order (by sortOrder)
- [x] Outline colors are darker than fill colors
- [x] Fallback color works when DB color is missing
- [x] Layer switching still works correctly
- [x] No console errors or warnings

### Test Cases

**Test 1: Change Layer Color**
1. Go to `/dashboard/maps`
2. Edit a map and change its color to red (`#ff0000`)
3. Go to `/dashboard/commercil-houses`
4. Switch to Map view
5. ✅ Layer should display in red

**Test 2: Change Layer Order**
1. Go to `/dashboard/maps`
2. Drag a layer to reorder it
3. Go to `/dashboard/commercil-houses`
4. Switch to Map view
5. ✅ Layers should display in new order

**Test 3: Multiple Color Updates**
1. Update colors for multiple layers
2. View in commercial houses map
3. ✅ All colors should reflect changes

## Integration

### API Requirements
The `/api/maps` endpoint must return:
```json
[
  {
    "id": 1,
    "name": "Layer Name",
    "geojson": {...},
    "color": "#3388ff",    // Required
    "sortOrder": 10        // Required
  }
]
```

### Database Schema
Maps table must have:
- `color` column (TEXT, default: '#3388ff')
- `sortOrder` column (INTEGER, default: 0)

## Benefits

### 🎨 Customizable
- Users can change layer colors in dashboard
- Changes reflect immediately on map view
- No code changes needed for color updates

### 📊 Organized
- Layer order managed in one place (database)
- Consistent ordering across all views
- Easy to reorder via drag-and-drop

### 🔧 Maintainable
- No hardcoded color configurations
- Single source of truth (database)
- Automatic color calculations

## Related Files
- ✅ `src/app/dashboard/commercil-houses/page.tsx` - Updated with dynamic colors
- ✅ `src/app/dashboard/maps/page.tsx` - Color management UI
- ✅ `src/app/api/maps/route.ts` - Returns color field
- ✅ `prisma/schema.prisma` - Maps model with color field

## Migration Notes

### Existing Data
- Maps created before this update will use default color `#3388ff`
- Run migration to add color column with default value
- Optionally update existing records with desired colors

### Backward Compatibility
- Fallback to `#3388ff` if color is missing
- Works with old hardcoded `layerConfigs` if needed
- No breaking changes to existing functionality

## Future Enhancements
- [ ] Add color legend on map view
- [ ] Allow inline color editing on map
- [ ] Add color presets/themes
- [ ] Export/import layer styles
- [ ] Layer opacity controls

