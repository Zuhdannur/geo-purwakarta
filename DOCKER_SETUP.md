# Docker Setup for Map Purwakarta Next.js Project

This document provides instructions for setting up the Map Purwakarta Next.js project using Docker with PostgreSQL as the database.

## Prerequisites

- Docker Desktop installed on your machine
- Docker Compose (included with Docker Desktop)

## Project Structure

The Docker setup includes:
- **PostgreSQL Database**: Primary database for the application
- **Next.js Application**: Frontend application
- **Redis**: Optional caching layer

## Quick Start

### 1. Clone and Setup

```bash
# Navigate to project directory
cd map-purwakarta-nextjs

# Copy environment file
cp env.example .env

# Edit .env file with your configuration
nano .env
```

### 2. Development Mode (Recommended for development)

For development, you can run just the database and Redis services while running the Next.js app locally:

```bash
# Start only database and Redis services
docker-compose -f docker-compose.dev.yml up -d

# Install dependencies and run the app locally
npm install
npm run dev
```

### 3. Full Docker Setup (Production-like)

To run everything in Docker containers:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Configuration

### Environment Variables

Copy `env.example` to `.env` and configure the following variables:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/map_purwakarta"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# JWT Secret (for authentication)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Mapbox (if using)
NEXT_PUBLIC_MAPBOX_TOKEN="your-mapbox-token-here"
```

### Database Configuration

The PostgreSQL database is configured with:
- **Database**: `map_purwakarta`
- **User**: `postgres`
- **Password**: `postgres`
- **Port**: `5432`

**Important**: Change the default password in production!

## Available Commands

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v

# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d map_purwakarta

# Access Redis CLI
docker-compose exec redis redis-cli
```

### Development Commands

```bash
# Start only database services for local development
docker-compose -f docker-compose.dev.yml up -d

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Reset database
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## Database Management

### Prisma Migrations

The application uses Prisma for database management. Migrations are automatically applied when the container starts.

For local development:
```bash
# Apply pending migrations
npx prisma migrate dev

# Reset database and apply all migrations
npx prisma migrate reset
```

### Backup and Restore

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres map_purwakarta > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres map_purwakarta < backup.sql
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :5432
   
   # Kill the process or change ports in docker-compose.yml
   ```

2. **Database Connection Issues**
   - Ensure PostgreSQL container is healthy: `docker-compose ps`
   - Check database logs: `docker-compose logs postgres`
   - Verify DATABASE_URL in your .env file

3. **Build Issues**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

4. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Health Checks

The containers include health checks:
- PostgreSQL: Checks if database is ready
- Redis: Pings Redis server
- App: Depends on PostgreSQL being healthy

Check container health:
```bash
docker-compose ps
```

## Production Deployment

For production deployment:

1. **Update Environment Variables**
   - Use strong passwords
   - Set secure JWT secrets
   - Configure proper domain URLs

2. **Security Considerations**
   - Don't expose database ports to external networks
   - Use Docker secrets for sensitive data
   - Enable SSL/TLS
   - Set up proper firewall rules

3. **Performance Optimization**
   - Use multi-stage builds (already configured)
   - Enable Docker layer caching
   - Configure proper resource limits
   - Use production-ready PostgreSQL configuration

## File Structure

```
├── Dockerfile                 # Next.js application container
├── docker-compose.yml         # Production Docker setup
├── docker-compose.dev.yml     # Development Docker setup
├── .dockerignore             # Files to ignore in Docker build
├── env.example               # Environment variables template
└── DOCKER_SETUP.md           # This documentation
```

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify your environment variables
3. Ensure all required ports are available
4. Check Docker Desktop is running
