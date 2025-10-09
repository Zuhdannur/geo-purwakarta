# Docker Uploads Fix Documentation

## Problem

Static files in `public/uploads/` were showing "not found" errors when accessing the application through Docker. This was caused by:

1. **Volume mount conflict**: The entire `public/` directory was mounted as a volume, overwriting the static files copied during build
2. **Permission issues**: The app runs as user `nextjs` (uid 1001), but the mounted volume didn't have proper permissions
3. **Lost static assets**: Mounting the entire public directory caused Next.js static assets to be unavailable

## Solution

### Changes Made

#### 1. **Dockerfile** (`Dockerfile`)
- Added creation of `public/uploads/commercial-houses` directory with proper ownership
- Ensured the `nextjs` user has write permissions to the uploads directory

```dockerfile
# Create uploads directory with proper permissions
RUN mkdir -p ./public/uploads/commercial-houses
RUN chown -R nextjs:nodejs ./public/uploads
```

#### 2. **Docker Compose** (`docker-compose.yml`)
- Changed from mounting the entire `public/` directory to only mounting `public/uploads/`
- Added a named volume `uploads_data` for persistent storage

```yaml
volumes:
  - uploads_data:/app/public/uploads
```

#### 3. **Volume Definition**
- Added `uploads_data` volume to persist uploaded files across container restarts

```yaml
volumes:
  uploads_data:
    driver: local
```

### How It Works

1. **Build Time**: 
   - Static files in `public/` (icons, images, etc.) are copied into the image
   - Empty `public/uploads/` directory is created with correct permissions

2. **Runtime**:
   - Only `public/uploads/` is mounted as a volume (persists uploads)
   - Static files in `public/` remain accessible from the image
   - The `nextjs` user can write to the uploads directory

## Rebuilding the Application

### Option 1: Using the Rebuild Script (Recommended)

```bash
./docker-rebuild.sh
```

This script will:
- Stop existing containers
- Rebuild images from scratch
- Start new containers
- Copy any existing uploads to the Docker volume
- Fix permissions automatically

### Option 2: Manual Rebuild

```bash
# Stop and remove containers
docker-compose down

# Rebuild images without cache
docker-compose build --no-cache

# Start containers
docker-compose up -d

# (Optional) Copy existing uploads if you have any
docker cp ./public/uploads/. map-purwakarta-app:/app/public/uploads/
docker exec map-purwakarta-app chown -R nextjs:nodejs /app/public/uploads
```

## Migrating Existing Uploads

If you have existing uploads on your host machine that you want to preserve:

```bash
# Copy uploads to the running container
docker cp ./public/uploads/. map-purwakarta-app:/app/public/uploads/

# Fix permissions
docker exec map-purwakarta-app chown -R nextjs:nodejs /app/public/uploads
```

## Verifying the Fix

### 1. Check if uploads directory exists and has correct permissions

```bash
docker exec map-purwakarta-app ls -la /app/public/uploads/
```

Expected output should show `nextjs` as the owner:
```
drwxr-xr-x    2 nextjs   nodejs        4096 ... commercial-houses
```

### 2. Test file upload through the application

1. Go to the commercial houses page
2. Upload an image
3. Verify the image displays correctly

### 3. Check static files are accessible

```bash
# Test accessing a static file
curl http://localhost:3000/file.svg
```

Should return the SVG content, not a 404 error.

## Accessing Uploaded Files

### From Host Machine
Uploaded files are stored in a Docker volume, not directly on the host. To access them:

```bash
# List files in the volume
docker exec map-purwakarta-app ls -la /app/public/uploads/commercial-houses/

# Copy a file from the volume to host
docker cp map-purwakarta-app:/app/public/uploads/commercial-houses/filename.png ./
```

### From Application
Files are accessible via standard URLs:
```
http://localhost:3000/uploads/commercial-houses/filename.png
```

## Backup and Restore

### Backup Uploads

```bash
# Create a backup of the uploads volume
docker run --rm -v map-purwakarta-nextjs_uploads_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/uploads-backup.tar.gz -C /data .
```

### Restore Uploads

```bash
# Restore from backup
docker run --rm -v map-purwakarta-nextjs_uploads_data:/data -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/uploads-backup.tar.gz"

# Fix permissions after restore
docker exec map-purwakarta-app chown -R nextjs:nodejs /app/public/uploads
```

## Troubleshooting

### Issue: 404 errors for uploaded files

**Check 1**: Verify the volume is mounted
```bash
docker inspect map-purwakarta-app | grep -A 10 Mounts
```

**Check 2**: Verify permissions
```bash
docker exec map-purwakarta-app ls -la /app/public/uploads/
```

**Fix**: Reset permissions
```bash
docker exec map-purwakarta-app chown -R nextjs:nodejs /app/public/uploads
```

### Issue: Cannot write files (upload fails)

**Check**: Verify the directory is writable by nextjs user
```bash
docker exec map-purwakarta-app touch /app/public/uploads/test.txt
```

If it fails, fix permissions:
```bash
docker exec -u root map-purwakarta-app chown -R nextjs:nodejs /app/public/uploads
```

### Issue: Lost uploads after container restart

This should NOT happen with the new configuration. If it does:

1. Check that the volume is defined in `docker-compose.yml`
2. Verify the volume exists: `docker volume ls | grep uploads`
3. Ensure the volume is mounted: `docker inspect map-purwakarta-app`

## Development vs Production

### Development
For development, you might want to mount the uploads directory to your local filesystem for easier access:

```yaml
# docker-compose.dev.yml
volumes:
  - ./public/uploads:/app/public/uploads
```

### Production
Use the named volume approach (current setup) for better isolation and portability:

```yaml
# docker-compose.yml
volumes:
  - uploads_data:/app/public/uploads
```

## Additional Notes

- The `uploads_data` volume persists even after `docker-compose down`
- To completely remove the volume: `docker-compose down -v` (⚠️ This will delete all uploads!)
- The volume is stored in Docker's volume directory (usually `/var/lib/docker/volumes/` on Linux)
- Static files in `public/` (except uploads) are baked into the Docker image and cannot be changed without rebuilding

## Summary

✅ **Fixed Issues:**
- Static files in `public/` are now accessible
- Uploads persist across container restarts
- Proper permissions for file uploads
- No conflicts between mounted volumes and static assets

✅ **Benefits:**
- Persistent storage for uploads
- No data loss on container restart
- Proper isolation between static and dynamic content
- Easy backup and restore of uploads

