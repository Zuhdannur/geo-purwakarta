# Deployment Guide for Vercel

## Prerequisites

1. **Vercel Account**: Make sure you have a Vercel account
2. **Vercel CLI**: Install Vercel CLI globally: `npm i -g vercel`

## Setting up Vercel KV Storage

### Step 1: Create KV Database

1. Go to your Vercel dashboard
2. Select your project
3. Go to the "Storage" tab
4. Click "Create Database"
5. Choose "KV" (Redis)
6. Select a plan (Hobby plan is free)
7. Choose a region close to your users
8. Click "Create"

### Step 2: Get Environment Variables

After creating the KV database, Vercel will provide you with these environment variables:

- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### Step 3: Add Environment Variables to Vercel

1. In your Vercel project dashboard, go to "Settings" → "Environment Variables"
2. Add each environment variable:
   - `KV_URL` = (value from Vercel)
   - `KV_REST_API_URL` = (value from Vercel)
   - `KV_REST_API_TOKEN` = (value from Vercel)
   - `KV_REST_API_READ_ONLY_TOKEN` = (value from Vercel)

### Step 4: Deploy

1. Push your code to GitHub/GitLab
2. Connect your repository to Vercel
3. Deploy the project

## Alternative: Use Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts to set up your project
```

## Post-Deployment Setup

### Initialize Data Storage

After deployment, you need to initialize the KV storage with your GeoJSON data:

1. Make a POST request to: `https://your-domain.vercel.app/api/data/init-storage`
2. This will copy the static GeoJSON data from your public folder to KV storage
3. You can use tools like Postman, curl, or your browser's developer tools

Example with curl:
```bash
curl -X POST https://your-domain.vercel.app/api/data/init-storage
```

## Troubleshooting

### Common Issues

1. **"KV not found" error**: Make sure you've created a KV database and added the environment variables
2. **"Read-only file system" error**: This should be resolved now that we're using KV storage instead of file system
3. **Data not loading**: Make sure you've initialized the storage by calling the init-storage endpoint

### Environment Variables Check

Verify your environment variables are set correctly in Vercel:
- Go to Project Settings → Environment Variables
- Make sure all KV-related variables are present
- Redeploy if you've added new environment variables

## Architecture Changes

### Before (File System - Not Working on Vercel)
- Data was stored in `/public/new data/rumah_komersil.geojson`
- API routes tried to read/write files using `fs` module
- This caused "read-only file system" errors on Vercel

### After (KV Storage - Vercel Compatible)
- Data is stored in Vercel KV (Redis-based)
- API routes use `@vercel/kv` package
- Static files remain in `/public` for initial data
- Dynamic updates are stored in KV storage

## Benefits of This Approach

1. **Vercel Compatible**: Works with serverless functions
2. **Scalable**: KV storage can handle large datasets
3. **Fast**: Redis-based storage is very fast
4. **Persistent**: Data persists between function executions
5. **Cost Effective**: Vercel KV has a generous free tier

## Data Flow

1. **Initial Load**: Static GeoJSON files in `/public` folder
2. **First API Call**: Data is copied to KV storage
3. **Subsequent Calls**: Data is read from KV storage
4. **Updates**: Data is written to KV storage
5. **Map Display**: Map reads from KV storage via API

## Monitoring

- Check Vercel Function logs for any errors
- Monitor KV storage usage in Vercel dashboard
- Use Vercel Analytics to track performance
