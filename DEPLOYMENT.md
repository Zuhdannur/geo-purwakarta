# Deployment Guide for Vercel (File-Based Approach)

## Overview

This application uses **file-based storage** with GeoJSON files stored in the `public` directory. To make this work on Vercel, we use the **Node.js runtime** which allows file system operations.

## Prerequisites

1. **Vercel Account**: Make sure you have a Vercel account
2. **Vercel CLI**: Install Vercel CLI globally: `npm i -g vercel`

## Key Configuration

### Runtime Configuration

The application is configured to use **Node.js runtime** instead of the default Edge runtime. This is specified in:

1. **API Routes**: Each API route has `export const runtime = 'nodejs'`
2. **Vercel Config**: `vercel.json` specifies `"runtime": "nodejs"` for all API functions

### Why Node.js Runtime?

- **File System Access**: Allows reading/writing to files using `fs` module
- **Full Node.js APIs**: Access to all Node.js built-in modules
- **Compatibility**: Works with existing file-based code

## Deployment Steps

### Step 1: Deploy to Vercel

1. Push your code to GitHub/GitLab
2. Connect your repository to Vercel
3. Deploy the project

### Step 2: Verify Configuration

After deployment, verify that:
- API routes are using Node.js runtime
- File system operations work correctly
- No "read-only file system" errors occur

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

## Architecture

### File-Based Storage
- **Data Location**: `/public/new data/rumah_komersil.geojson`
- **File Operations**: Read/write using Node.js `fs` module
- **Runtime**: Node.js (not Edge runtime)
- **Persistence**: Files are stored in Vercel's file system

### API Endpoints
- `/api/data/update-feature` - Updates feature properties in GeoJSON file
- `/api/data/reset-properties` - Resets all feature properties
- All endpoints use Node.js runtime for file system access

## Benefits of This Approach

1. **Simple**: No database setup required
2. **Familiar**: Uses standard file system operations
3. **Fast**: Direct file access without network calls
4. **Cost Effective**: No additional storage costs
5. **Vercel Compatible**: Works with Node.js runtime

## Limitations

1. **File Size**: Large GeoJSON files may impact performance
2. **Concurrent Writes**: Multiple simultaneous writes could cause conflicts
3. **Scaling**: Not suitable for high-frequency updates
4. **Backup**: No automatic backup of modified files

## Troubleshooting

### Common Issues

1. **"Read-only file system" error**: 
   - Make sure you're using Node.js runtime
   - Check that `vercel.json` has correct runtime configuration
   - Verify API routes have `export const runtime = 'nodejs'`

2. **File not found errors**:
   - Check file paths in API routes
   - Ensure files exist in the `public` directory
   - Verify file permissions

3. **Deployment failures**:
   - Check Vercel function logs
   - Verify all dependencies are installed
   - Check for syntax errors in API routes

### Environment Variables

No special environment variables are required for file-based operations.

## Monitoring

- Check Vercel Function logs for any errors
- Monitor function execution times
- Use Vercel Analytics to track performance
- Watch for file system operation errors

## Best Practices

1. **Error Handling**: Always wrap file operations in try-catch blocks
2. **File Validation**: Check file existence before operations
3. **Data Validation**: Validate JSON data before writing
4. **Logging**: Log file operations for debugging
5. **Backup Strategy**: Consider implementing file backup mechanisms

## Future Considerations

If you need to scale beyond file-based storage, consider:
- **Vercel KV**: Redis-based storage for high-frequency updates
- **Vercel Postgres**: SQL database for complex queries
- **External APIs**: Store data in external services
- **Hybrid Approach**: Use files for static data, database for dynamic data
