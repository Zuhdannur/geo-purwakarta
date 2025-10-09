# Maps Color Field Implementation

## Summary
Added a `color` field to the `Maps` model to allow dynamic layer coloring. This enables each map layer to have its own custom color when displayed.

## Changes Made

### 1. Database Schema (✅ Complete)
- **File**: `prisma/schema.prisma`
- **Change**: Added `color` field to Maps model
- **Default Value**: `#3388ff` (blue)
- **Migration**: `20251009140519_add_color_to_maps`

```prisma
model Maps {
  id        Int      @id @default(autoincrement())
  name      String
  geojson   Json
  color     String   @default("#3388ff") // Default blue color for map layers
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. API Endpoints Updated

#### GET /api/maps
- Now returns `color` field for all maps
- Example response:
```json
[
  {
    "id": 1,
    "name": "Peta Administrasi",
    "color": "#3388ff",
    "geojson": {...},
    "sortOrder": 0,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

#### POST /api/maps
- Accepts optional `color` field in request body
- If not provided, uses default color `#3388ff`
- Example request:
```json
{
  "name": "New Map Layer",
  "geojson": {...},
  "color": "#ff0000"  // Optional
}
```

#### GET /api/maps/[id]
- Returns `color` field in the response

#### PATCH /api/maps/[id]
- Accepts `color` field for updates
- Example request:
```json
{
  "color": "#00ff00"
}
```

### 3. Database Migration Status
✅ **Applied to local database** (localhost:5434)
✅ **All existing Maps records** have default color `#3388ff`

## How to Use

### 1. Rebuild Docker Container (Required)
The API changes need to be built into the Docker image:

```bash
docker-compose down
docker-compose build app
docker-compose up -d
```

Or use the rebuild script:
```bash
./docker-rebuild.sh
```

### 2. Frontend Implementation
When loading map layers, use the `color` field from the API response:

```typescript
// Example: Loading maps with colors
const maps = await fetch('/api/maps').then(r => r.json());

maps.forEach(map => {
  // Use map.color for layer styling
  mapboxMap.addLayer({
    id: `layer-${map.id}`,
    type: 'fill',
    source: {
      type: 'geojson',
      data: map.geojson
    },
    paint: {
      'fill-color': map.color,  // Dynamic color from database
      'fill-opacity': 0.5
    }
  });
});
```

### 3. Creating Maps with Custom Colors
```typescript
// Create a new map with a custom color
const response = await fetch('/api/maps', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Kawasan Hijau',
    geojson: {...},
    color: '#00ff00'  // Green color
  })
});
```

### 4. Updating Map Colors
```typescript
// Update an existing map's color
const response = await fetch('/api/maps/1', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    color: '#ff0000'  // Change to red
  })
});
```

## Color Format
- Use hex color format: `#RRGGBB`
- Examples:
  - Blue: `#3388ff` (default)
  - Red: `#ff0000`
  - Green: `#00ff00`
  - Yellow: `#ffff00`
  - Custom: `#a1b2c3`

## Verification

### Check existing colors in database:
```bash
docker exec map-purwakarta-postgres-dev psql -U postgres -d map_purwakarta -c "SELECT id, name, color FROM \"Maps\";"
```

### Test API after rebuild:
```bash
# Get all maps with colors
curl http://localhost:3000/api/maps

# Get specific map
curl http://localhost:3000/api/maps/1

# Update a color
curl -X PATCH http://localhost:3000/api/maps/1 \
  -H "Content-Type: application/json" \
  -d '{"color": "#ff0000"}'
```

## Files Modified
1. ✅ `prisma/schema.prisma` - Added color field
2. ✅ `prisma/migrations/20251009140519_add_color_to_maps/migration.sql` - Migration file
3. ✅ `src/app/api/maps/route.ts` - GET and POST endpoints
4. ✅ `src/app/api/maps/[id]/route.ts` - GET, PATCH endpoints

## Next Steps
1. ☐ Rebuild Docker container
2. ☐ Update frontend components to use the color field
3. ☐ Add color picker UI for map creation/editing
4. ☐ Update map rendering logic to use dynamic colors

