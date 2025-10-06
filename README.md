# Purwakarta Map Dashboard

A modern, interactive map dashboard built with Next.js, React, and Leaflet for displaying Purwakarta administrative and existing data layers.

## Features

### 🗺️ Interactive Map Interface
- **Leaflet-based map** with OpenStreetMap tiles
- **Multiple GeoJSON layers** support
- **Coordinate transformation** from projected to WGS84
- **Feature highlighting** on hover and click
- **Responsive design** with Tailwind CSS

### 📊 Layer Management
- **Peta Administratif** (Administrative Map)
  - Data (18MB)
  - KRB Gempa Bumi (6.1MB)
  - Kemiringan Lereng (10MB)
  - Kawasan Terbangun (90MB)
  - Rencana Pola Ruang (45MB)

- **Peta Existing** (Existing Map)
  - Existing Data
  - Existing KRB
  - Existing Slope
  - Existing Built Area
  - Existing Plan

### 🎨 Visual Features
- **Color-coded layers** based on property values
- **Interactive legend** showing layer color schemes
- **Feature property drawer** for detailed information
- **Layer toggle controls** with checkboxes
- **Status indicators** for loading and selection

### 🏗️ Technical Stack
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Leaflet** for map functionality
- **Tailwind CSS** for styling
- **Lucide React** for icons

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd map-purwakarta-nextjs
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Local database (SQLite) and users API

This project uses Prisma with SQLite for local development.

- The database file is `prisma/dev.db`.
- Prisma schema is at `prisma/schema.prisma`.

Common commands:

```bash
# Generate Prisma client
npx prisma generate

# Create a new migration after editing schema.prisma
npx prisma migrate dev --name your_migration_name

# Inspect the DB
npx prisma studio
```

Users API endpoints:

- `GET /api/users` — list users
- `POST /api/users` — create user `{ email, name?, password, role? }`
- `GET /api/users/[id]` — get user by id
- `PATCH /api/users/[id]` — update user fields; to change password send `{ password }`
- `DELETE /api/users/[id]` — delete user

Notes:

- Passwords are stored as bcrypt hashes and never returned by the API.
- `role` supports `USER` (default) or `ADMIN`.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── data/              # Data endpoint
│   │   └── tiles/[z]/[x]/[y]/ # Tile endpoint
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page
├── components/
│   ├── FeatureDrawer.tsx      # Feature property panel
│   ├── Legend.tsx             # Map legend component
│   ├── Map.tsx                # Main map component
│   └── Sidebar.tsx            # Layer control sidebar
└── lib/                       # Utility functions
```

## API Endpoints

### `/api/data`
Returns map configuration data including tile URLs and bounds.

### `/api/tiles/[z]/[x]/[y]`
Handles vector tile requests (placeholder implementation).

## Data Files

The application uses GeoJSON files stored in the `public/data/` directory:
- `data.geojson` - Main administrative data
- `krb_gempa_bumi.geojson` - Earthquake risk zones
- `kemiringan_lereng.geojson` - Slope data
- `kawasan_terbangun.geojson` - Built-up areas
- `rencana_pola_ruang.geojson` - Spatial planning

## Usage

1. **Select Layers**: Use the sidebar to expand menu categories and select layers
2. **View Map**: Selected layers will appear on the map with color coding
3. **Interact**: Click on features to view their properties in the drawer
4. **Legend**: Toggle the legend to see color schemes for active layers
5. **Controls**: Use "Clear All Layers" or "Load All Layers" for bulk operations

## Development

### Key Components

- **Sidebar**: Manages layer selection and menu state
- **Map**: Handles map rendering and layer management
- **LayerController**: Manages GeoJSON layer loading and styling
- **FeatureDrawer**: Displays feature properties when clicked
- **Legend**: Shows color schemes for active layers

### Adding New Layers

1. Add layer configuration to `layerConfigs` in `Map.tsx`
2. Update the sidebar menu items in `Sidebar.tsx`
3. Add corresponding GeoJSON file to `public/data/`
4. Update legend configuration if needed

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
