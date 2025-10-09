# Maps Dashboard Color Field Update

## Summary
Updated the Maps dashboard page (`/dashboard/maps`) to fully support the color field feature, allowing users to view, add, and edit colors for each map layer.

## Changes Made to `/src/app/dashboard/maps/page.tsx`

### 1. Updated TypeScript Types
```typescript
// Added color field to MapRow type
type MapRow = { id: number; name: string; color: string; createdAt: string; updatedAt: string };
```

### 2. Added Color State Management
- Added `color` state with default value `#3388ff`
- Added `previewColor` state for preview dialog
- Updated `openCreate()` to reset color to default
- Updated `openEdit()` to load existing color from map
- Updated `openPreview()` to load color for preview

### 3. Updated Table Display
**Added Color Column:**
- Shows a color swatch (visual preview)
- Displays the hex color code
- Positioned between Name and Created columns

**Visual Features:**
- Color picker box (10x6 pixels) with border
- Color code displayed as small text next to swatch
- Tooltip showing color on hover

### 4. Enhanced Create/Edit Dialog
**Color Picker Input:**
- Native HTML5 color picker (20px width)
- Text input showing/editing hex color code
- Both inputs synchronized
- Side-by-side layout for easy color selection

**Features:**
- Visual color picker for easy selection
- Manual hex input for precise control
- Default color: `#3388ff` (blue)
- Disabled state support during save operations

### 5. Updated API Integration
**Create Map (POST):**
```typescript
{
  name: "Map Name",
  color: "#ff0000",  // Now included
  geojson: {...}
}
```

**Update Map (PATCH):**
```typescript
{
  name: "Map Name",
  color: "#00ff00",  // Now included
  geojson: {...}
}
```

### 6. Enhanced Map Preview
**MapPreview Component:**
- Now accepts `color` prop
- Uses custom color for all layer types:
  - Polygons: fill and outline use the selected color
  - Lines: line color matches selection
  - Points: circle color with darker stroke
- Helper function to darken colors for strokes
- Preview updates dynamically with selected color

## UI/UX Improvements

### Table View
```
| Drag | Name              | Color         | Created           | Actions           |
|------|-------------------|---------------|-------------------|-------------------|
| ⋮⋮   | Peta Admin        | 🟦 #3388ff   | Oct 9, 2025...    | Preview Edit Del  |
| ⋮⋮   | Kawasan Banjir    | 🟥 #ff0000   | Oct 9, 2025...    | Preview Edit Del  |
```

### Create/Edit Dialog
```
┌─────────────────────────────────────┐
│ Name: [________________]            │
│                                     │
│ Layer Color:                        │
│ [🎨] [#3388ff_____________]        │
│  ↑      ↑                           │
│ picker  hex input                   │
│                                     │
│ GeoJSON file: [Choose file...]     │
└─────────────────────────────────────┘
```

### Preview Dialog
- Map layers now render in the custom color
- Color is displayed consistently with table view
- Real-time preview of how the layer will appear

## User Workflow

### Creating a New Map with Custom Color
1. Click "Add Map" button
2. Enter map name
3. Choose color:
   - Click color picker for visual selection, OR
   - Type hex code directly (e.g., `#ff5733`)
4. Upload GeoJSON file
5. Click "Create"
6. Map appears in table with chosen color

### Editing Map Color
1. Click "Edit" on any map row
2. Change the color using picker or text input
3. Optionally update name or GeoJSON
4. Click "Update"
5. Table updates with new color

### Previewing with Color
1. Click "Preview" on any map row
2. Map renders with the saved color
3. Visual confirmation of layer appearance

## Technical Details

### Color Format
- **Format**: Hex color codes (`#RRGGBB`)
- **Default**: `#3388ff` (blue)
- **Validation**: Browser's native color input validation
- **Examples**:
  - Red: `#ff0000`
  - Green: `#00ff00`
  - Blue: `#0000ff`
  - Custom: `#a1b2c3`

### State Management
```typescript
const [color, setColor] = useState('#3388ff');          // For create/edit
const [previewColor, setPreviewColor] = useState('#3388ff'); // For preview
```

### Color Helper Function
```typescript
const lightenColor = (hex: string, percent: number) => {
  // Adjusts color brightness for strokes/borders
  // Used in MapPreview for darker outline colors
}
```

## Browser Compatibility
- ✅ Color picker supported in all modern browsers
- ✅ Falls back to text input in older browsers
- ✅ Manual hex input always available

## Testing Checklist
- [x] Create new map with custom color
- [x] Edit existing map color
- [x] Preview map with custom color
- [x] Color picker synchronizes with text input
- [x] Table displays color swatch correctly
- [x] Color persists after page reload
- [x] Drag-and-drop reordering still works
- [x] Default color applied to new maps

## Next Steps (Optional Enhancements)
- [ ] Add color presets/palette
- [ ] Add color validation (ensure contrast)
- [ ] Add color picker to inline table editing
- [ ] Add bulk color update feature
- [ ] Export/import color schemes

## Files Modified
- ✅ `src/app/dashboard/maps/page.tsx` - Complete color support

## Related Documentation
- See `COLOR_FIELD_IMPLEMENTATION.md` for database schema changes
- See API documentation for endpoint details

