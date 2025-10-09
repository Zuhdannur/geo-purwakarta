#!/bin/bash

# Script to rebuild Docker containers with proper upload handling

echo "🔄 Rebuilding Map Purwakarta Docker containers..."

# Step 1: Stop and remove existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Step 2: Rebuild the images
echo "🏗️  Building Docker images..."
docker-compose build --no-cache

# Step 3: Start the containers
echo "🚀 Starting containers..."
docker-compose up -d

# Step 4: Wait for containers to be healthy
echo "⏳ Waiting for containers to be ready..."
sleep 10

# Step 5: Check if we need to copy existing uploads
if [ -d "./public/uploads" ] && [ "$(ls -A ./public/uploads 2>/dev/null)" ]; then
    echo "📁 Found existing uploads, copying to Docker volume..."
    
    # Copy existing uploads to the Docker volume
    docker cp ./public/uploads/. map-purwakarta-app:/app/public/uploads/
    
    # Fix permissions inside container
    docker exec map-purwakarta-app chown -R nextjs:nodejs /app/public/uploads
    
    echo "✅ Uploads copied and permissions fixed!"
else
    echo "ℹ️  No existing uploads found or directory is empty"
fi

echo ""
echo "✅ Docker containers rebuilt successfully!"
echo ""
echo "📊 Container status:"
docker-compose ps

echo ""
echo "🌐 Application should be available at: http://localhost:3000"
echo ""
echo "📝 To view logs: docker-compose logs -f app"
echo "🛑 To stop: docker-compose down"

