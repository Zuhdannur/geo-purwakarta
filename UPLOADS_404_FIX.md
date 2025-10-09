# Fix for 404 Error on Uploaded Files

## Problem
Uploaded files at `/uploads/commercial-houses/[filename]` were returning 404 errors.

## Root Causes

### 1. Next.js Standalone Mode
When using `output: 'standalone'` in Next.js config, the standalone server doesn't automatically serve files from the `public` folder correctly. The public directory needs to be explicitly configured for file tracing.

### 2. Dockerfile Copy Order
The `public` folder was being copied BEFORE the standalone output, which could cause issues. In Next.js standalone mode, the public folder should be copied AFTER the standalone output.

### 3. Docker Volume Mount
The docker-compose volume mount at `/app/public/uploads` was correctly set up, but the standalone server wasn't configured to serve these files.

## Solution Applied

### 1. Created Custom Route Handler for Uploads
**This is the key fix!** Next.js standalone mode doesn't automatically serve static files from the `public` folder. Created `/src/app/uploads/[...path]/route.ts` to serve uploaded files dynamically.

This route:
- Catches all requests to `/uploads/*`
- Serves files from `public/uploads/` directory
- Sets appropriate Content-Type headers
- Adds caching headers for better performance

### 2. Updated `next.config.ts`
Added `outputFileTracingIncludes` to ensure public folder assets are accessible in standalone mode:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingIncludes: {
      '/': ['./public/**/*'],
    },
  },
};
```

### 3. Updated `Dockerfile`
Reordered the COPY commands to copy the public folder AFTER the standalone output:
- Standalone output copied first
- Static files copied second
- Public folder copied last
- Upload directories created and permissions set

## How to Apply the Fix

### Step 1: Rebuild Docker Containers
Run the rebuild script to apply the changes:

```bash
chmod +x docker-rebuild.sh
./docker-rebuild.sh
```

Or manually:

```bash
# Stop and remove containers
docker-compose down

# Rebuild without cache
docker-compose build --no-cache

# Start containers
docker-compose up -d
```

### Step 2: Verify the Fix
1. Upload a new image through the application
2. Note the returned file path (e.g., `/uploads/commercial-houses/commercial-house-[timestamp]-[random].png`)
3. Access it at: `http://localhost:3000/uploads/commercial-houses/commercial-house-[timestamp]-[random].png`
4. The image should now display correctly

### Step 3: Copy Existing Uploads (if needed)
If you have existing uploads in your local `./public/uploads` directory that need to be accessible:

```bash
# Copy existing uploads to the running container
docker cp ./public/uploads/. map-purwakarta-app:/app/public/uploads/

# Fix permissions
docker exec map-purwakarta-app chown -R nextjs:nodejs /app/public/uploads
```

## Verification Checklist
- [ ] Docker containers rebuilt with new configuration
- [ ] New uploads are accessible via browser
- [ ] Existing uploads copied to container (if applicable)
- [ ] No 404 errors when accessing `/uploads/commercial-houses/*` URLs

## Technical Details

### How Next.js Serves Static Files
- In development: Next.js dev server automatically serves files from `public/`
- In production (standalone): Requires explicit configuration to trace and include public files
- Files in `public/uploads/` should be accessible at `http://localhost:3000/uploads/`

### Docker Volume Persistence
The `uploads_data` volume in docker-compose.yml ensures uploaded files persist across container restarts:
```yaml
volumes:
  - uploads_data:/app/public/uploads
```

This means:
- Uploads survive container restarts
- Each rebuild starts with an empty volume (unless you copy existing files)
- Files are stored on the host machine in Docker's volume directory

## Troubleshooting

### If uploads still show 404:
1. Check if the file exists in the container:
   ```bash
   docker exec map-purwakarta-app ls -la /app/public/uploads/commercial-houses/
   ```

2. Check file permissions:
   ```bash
   docker exec map-purwakarta-app ls -la /app/public/uploads/
   ```
   Should show `nextjs:nodejs` as owner

3. Check if the upload succeeded:
   - Look at the API response when uploading
   - Check the database for the image URL

4. Check container logs:
   ```bash
   docker-compose logs -f app
   ```

### If uploads work but then disappear after restart:
The files are in the Docker volume. Use the rebuild script which includes copying existing uploads.

## Related Files
- `next.config.ts` - Next.js configuration
- `Dockerfile` - Container build instructions
- `docker-compose.yml` - Container orchestration
- `src/app/api/commercial-houses/upload/route.ts` - Upload API endpoint
- `docker-rebuild.sh` - Automated rebuild script

