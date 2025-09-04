# Deployment Guide for Vercel (In-Memory Approach)

## ⚠️ Important: File System Limitations on Vercel

**Vercel's serverless environment has a read-only file system**, which means you **cannot write to files** even with Node.js runtime. This is a fundamental limitation of serverless platforms.

## Current Implementation

### How It Works Now

1. **Static Files**: GeoJSON files remain in `/public` directory for reading
2. **In-Memory Updates**: API routes load data into memory and make changes
3. **Temporary Storage**: Changes are stored in memory during function execution
4. **No Persistence**: Changes are lost when the function completes

### API Endpoints

- `/api/data/update-feature` - Updates feature properties (in memory)
- `/api/data/reset-properties` - Resets all feature properties (in memory)

## Limitations of Current Approach

1. **No Persistence**: Changes are lost after function execution
2. **Memory Only**: Data exists only during API call
3. **Not Production Ready**: Suitable only for demo/testing

## Solutions for Production

### Option 1: Vercel KV (Recommended)

Vercel KV is a Redis-based storage solution that works perfectly with serverless:

```bash
npm install @vercel/kv
```

**Benefits:**
- Persistent storage
- Fast Redis-based access
- Vercel-native integration
- Generous free tier

### Option 2: External Database

Use a traditional database service:
- **Supabase** (PostgreSQL)
- **MongoDB Atlas**
- **PlanetScale** (MySQL)
- **Neon** (PostgreSQL)

### Option 3: Hybrid Approach

- Keep static GeoJSON files for initial data
- Use database for dynamic updates
- Sync changes back to static files periodically

## Deployment Steps

### Current Setup (In-Memory)

1. Deploy to Vercel
2. API routes will work but won't persist changes
3. Good for testing and demonstration

### For Production (With Database)

1. Choose a storage solution (Vercel KV recommended)
2. Update API routes to use database instead of memory
3. Deploy with proper environment variables

## Why File Writing Doesn't Work

### Serverless Architecture

- **Stateless**: Each function execution is isolated
- **Read-Only**: File system is immutable
- **Ephemeral**: No persistent storage between executions
- **Scalable**: Multiple instances can't share file system

### What Happens

1. Function starts with clean file system
2. Can read static files from `/public`
3. Cannot write or modify any files
4. Changes are lost when function ends

## Testing the Current Setup

### What Works

✅ Reading static GeoJSON files  
✅ Processing data in memory  
✅ API responses with success messages  
✅ Feature property updates (temporary)  

### What Doesn't Work

❌ Writing changes to files  
❌ Persistent data storage  
❌ Data persistence between API calls  

## Next Steps

### For Development/Demo

The current in-memory approach is sufficient for:
- Testing functionality
- Demonstrating features
- Development and debugging

### For Production

You'll need to implement one of these:
1. **Vercel KV** (easiest, most integrated)
2. **External database** (more control, more setup)
3. **Hybrid approach** (best of both worlds)

## Code Example: Vercel KV Implementation

If you decide to use Vercel KV, here's how the update route would look:

```typescript
import { kv } from '@vercel/kv';

export async function POST(request: NextRequest) {
  // Get data from KV storage
  const data = await kv.get('rumah_komersil_data');
  
  // Make changes
  // ... update logic ...
  
  // Save back to KV storage
  await kv.set('rumah_komersil_data', updatedData);
  
  return NextResponse.json({ success: true });
}
```

## Summary

- **Current setup**: Works for demo/testing, no persistence
- **Production ready**: Requires Vercel KV or external database
- **File system**: Read-only on Vercel (cannot be changed)
- **Recommendation**: Use Vercel KV for production deployment
