# Vercel KV Setup Guide

## Overview

This guide explains how to set up Vercel KV (Redis-based storage) for both local development and production deployment.

## Prerequisites

1. **Vercel Account**: You need a Vercel account
2. **Vercel CLI**: Install globally with `npm i -g vercel`
3. **Node.js**: Version 18+ recommended

## Step 1: Create Vercel KV Database

### On Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database**
5. Choose **KV** (Redis)
6. Select a plan (Hobby plan is free)
7. Choose a region close to your users
8. Click **Create**

### Get Environment Variables

After creating the KV database, Vercel will provide these environment variables:

- `KV_URL`
- `KV_REST_API_URL` 
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

**Save these values!** You'll need them for both local and production setup.

## Step 2: Local Development Setup

### Install Dependencies

```bash
npm install @vercel/kv
```

### Create Local Environment File

Create `.env.local` in your project root:

```bash
# .env.local
KV_URL=your_kv_url_here
KV_REST_API_URL=your_kv_rest_api_url_here
KV_REST_API_TOKEN=your_kv_rest_api_token_here
KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token_here
```

**Replace the values** with the ones from your Vercel KV dashboard.

### Test Local Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test the KV connection by calling an API endpoint:
   ```bash
   curl http://localhost:3000/api/data/get-rumah-komersil
   ```

3. Check the console for any KV connection errors

## Step 3: Production Deployment

### Add Environment Variables to Vercel

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add each KV environment variable:
   - `KV_URL` = (value from Vercel)
   - `KV_REST_API_URL` = (value from Vercel)
   - `KV_REST_API_TOKEN` = (value from Vercel)
   - `KV_REST_API_READ_ONLY_TOKEN` = (value from Vercel)

### Deploy

1. Push your code to GitHub/GitLab
2. Vercel will automatically deploy with the new environment variables
3. Your API routes will now use KV storage

## Step 4: Verify Setup

### Check KV Storage

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **KV**
3. You should see your database with data being stored

### Test API Endpoints

1. **Update Feature**: `POST /api/data/update-feature`
2. **Reset Properties**: `POST /api/data/reset-properties`
3. **Get Data**: `GET /api/data/get-rumah-komersil`

## Local vs Production Differences

### Local Development

- Uses `.env.local` file
- Connects to Vercel KV from your local machine
- Same data as production (if using same KV instance)

### Production

- Uses Vercel environment variables
- Connects to KV from Vercel's serverless functions
- Same data as local development

## Troubleshooting

### Common Issues

1. **"KV not found" error**:
   - Check environment variables are set correctly
   - Verify KV database exists in Vercel dashboard
   - Ensure you're using the correct project

2. **Connection timeout**:
   - Check your internet connection
   - Verify KV region is accessible
   - Check Vercel KV service status

3. **Authentication errors**:
   - Verify tokens are correct
   - Check token permissions
   - Ensure tokens haven't expired

### Debug Steps

1. **Check Environment Variables**:
   ```bash
   # Local
   cat .env.local
   
   # Production (in Vercel dashboard)
   Settings → Environment Variables
   ```

2. **Test KV Connection**:
   ```bash
   # Test local
   curl -X POST http://localhost:3000/api/data/update-feature \
     -H "Content-Type: application/json" \
     -d '{"featureId": 1, "layerId": "layer-sebaran-rumah-komersil", "properties": {"test": "value"}}'
   ```

3. **Check Vercel Logs**:
   - Go to Vercel dashboard
   - Check Function logs for errors

## Data Flow

### Initial Load

1. **First API Call**: Data loaded from static GeoJSON file
2. **KV Storage**: Data automatically stored in Vercel KV
3. **Subsequent Calls**: Data served from KV storage

### Updates

1. **API Call**: Feature update request
2. **KV Read**: Load current data from KV
3. **Data Update**: Modify feature properties
4. **KV Write**: Save updated data back to KV
5. **Response**: Return success confirmation

### Benefits

- **Persistent**: Data survives function executions
- **Fast**: Redis-based storage is very fast
- **Scalable**: Handles multiple concurrent users
- **Reliable**: Vercel-managed infrastructure

## Cost Considerations

### Vercel KV Pricing (as of 2024)

- **Hobby Plan**: Free tier available
- **Pro Plan**: $20/month with generous limits
- **Enterprise**: Custom pricing

### Usage Monitoring

- Monitor KV usage in Vercel dashboard
- Set up alerts for usage limits
- Optimize data storage if needed

## Best Practices

1. **Environment Variables**: Never commit `.env.local` to git
2. **Error Handling**: Always wrap KV operations in try-catch
3. **Data Validation**: Validate data before storing in KV
4. **Monitoring**: Keep track of KV usage and performance
5. **Backup**: Consider backing up important data

## Next Steps

After setting up Vercel KV:

1. **Test thoroughly** with your application
2. **Monitor performance** and usage
3. **Optimize** data structure if needed
4. **Scale** as your application grows

## Support

- **Vercel Documentation**: [vercel.com/docs/storage/vercel-kv](https://vercel.com/docs/storage/vercel-kv)
- **Vercel Support**: Available in dashboard
- **Community**: Vercel Discord and forums
