# Redis Cloud Setup Guide

## Overview

This guide explains how to use your existing **Redis Cloud** instance instead of Vercel KV for data storage.

## Current Setup

You already have:
- **Redis Cloud Instance**: `redis-11495.c239.us-east-1-2.ec2.redns.redis-cloud.com:11495`
- **Connection String**: `redis://default:gFgum75NY9NW5iWMJmsgV6BG9IV8xoN0@redis-11495.c239.us-east-1-2.ec2.redns.redis-cloud.com:11495`

## Environment Configuration

### Local Development

Create `.env.local` in your project root:

```bash
REDIS_URL="redis://default:gFgum75NY9NW5iWMJmsgV6BG9IV8xoN0@redis-11495.c239.us-east-1-2.ec2.redns.redis-cloud.com:11495"
```

### Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add: `REDIS_URL` = `redis://default:gFgum75NY9NW5iWMJmsgV6BG9IV8xoN0@redis-11495.c239.us-east-1-2.ec2.redns.redis-cloud.com:11495`

## API Routes

### Current Routes (Vercel KV)
- `/api/data/update-feature` - Uses Vercel KV
- `/api/data/reset-properties` - Uses Vercel KV
- `/api/data/get-rumah-komersil` - Uses Vercel KV

### Alternative Routes (Redis Cloud)
- `/api/data/update-feature-redis` - Uses Redis Cloud
- You can switch to these if you prefer Redis Cloud

## Dependencies

```bash
npm install redis
```

## Benefits of Redis Cloud

1. **Existing Infrastructure**: You already have it set up
2. **Full Control**: Manage your own Redis instance
3. **Cost Control**: Pay only for what you use
4. **Performance**: Direct Redis connection

## Benefits of Vercel KV

1. **Vercel Integration**: Seamless with Vercel deployment
2. **Managed Service**: Vercel handles scaling and maintenance
3. **Free Tier**: Generous free tier available
4. **Simpler Setup**: No external service management

## Recommendation

### Use Vercel KV if:
- You want the simplest setup
- You prefer managed services
- You're okay with Vercel's pricing

### Use Redis Cloud if:
- You want full control over your Redis instance
- You have existing Redis infrastructure
- You prefer to manage your own database

## Migration Path

### Option 1: Switch to Redis Cloud
1. Update all API routes to use Redis client
2. Remove Vercel KV dependencies
3. Use your existing Redis Cloud instance

### Option 2: Keep Vercel KV
1. Create Vercel KV database
2. Keep current API routes
3. Remove Redis Cloud dependencies

### Option 3: Hybrid Approach
1. Use Vercel KV for production
2. Use Redis Cloud for development
3. Switch between them as needed

## Testing

### Test Redis Cloud Connection

```bash
# Start your development server
npm run dev

# Test the Redis Cloud API route
curl -X POST http://localhost:3000/api/data/update-feature-redis \
  -H "Content-Type: application/json" \
  -d '{"featureId": 1, "layerId": "layer-sebaran-rumah-komersil", "properties": {"test": "value"}}'
```

### Check Redis Data

You can use Redis CLI or a Redis GUI tool to inspect your data:

```bash
# Connect to Redis Cloud
redis-cli -h redis-11495.c239.us-east-1-2.ec2.redns.redis-cloud.com -p 11495 -a gFgum75NY9NW5iWMJmsgV6BG9IV8xoN0

# Check if data exists
GET rumah_komersil_data
```

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to git
2. **Redis Password**: Keep your Redis password secure
3. **Network Access**: Ensure Redis Cloud is accessible from Vercel
4. **Data Encryption**: Consider enabling SSL/TLS for Redis connections

## Cost Comparison

### Redis Cloud
- Pay per usage
- More control over costs
- Additional infrastructure management

### Vercel KV
- Free tier available
- Managed service
- Integrated billing with Vercel

## Next Steps

1. **Choose your approach**: Vercel KV or Redis Cloud
2. **Set up environment variables** locally and on Vercel
3. **Test the connection** with your chosen solution
4. **Deploy and verify** everything works in production

## Support

- **Redis Cloud**: [redis.com/cloud](https://redis.com/cloud)
- **Vercel KV**: [vercel.com/docs/storage/vercel-kv](https://vercel.com/docs/storage/vercel-kv)
- **Redis Node.js Client**: [github.com/redis/node-redis](https://github.com/redis/node-redis)
