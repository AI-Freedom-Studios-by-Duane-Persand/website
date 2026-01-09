// Asset URL Management Documentation
// File: docs/guides/ASSET_URL_MANAGEMENT.md

# Asset URL Management Guide

## Overview

Assets stored in R2 (Cloudflare) now have **permanent access** through automatic URL refresh mechanisms. This document explains how the system works and how to configure it.

## How It Works

### URL Types

1. **Public URLs** (Permanent - No Expiration)
   - Format: `https://{publicBaseUrl}/{key}`
   - Available when R2 bucket is public (`ACL: 'public-read'`)
   - Never expires
   - Preferred for all use cases

2. **Signed URLs** (Temporary - 7 Day Expiration)
   - Format: `https://{r2-endpoint}/{bucket}/{key}?X-Amz-*&X-Amz-Expires=604800`
   - Used when bucket is private
   - Expires after 7 days (604,800 seconds)
   - Automatically refreshed before expiration

## Backend Components

### StorageService Methods

#### 1. `uploadFile(buffer, options?)`
- Uploads asset and creates database record
- Sets `isPermanent: true` if `publicBaseUrl` configured
- Sets `urlExpiresAt` to 7 days from now for signed URLs
- Stores `lastUrlRefreshAt` timestamp

#### 2. `refreshAssetUrl(url, tenantId?)`
- Refreshes a single asset URL on-demand
- Returns public URL if available, signed URL otherwise
- Call when you detect URL expiration

#### 3. `refreshAssetUrlsBatch(tenantId, olderThanDays?)`
- Batch refresh all expiring URLs for a tenant
- Designed to run as a scheduled background job
- Default: refresh URLs older than 6 days
- Updates database with new URLs and timestamps

#### 4. `migrateAssetsToPermanentUrls(tenantId)`
- Converts all existing signed URLs to public URLs
- Only works if `publicBaseUrl` is configured
- One-time operation for existing assets
- Returns count of migrated vs skipped assets

#### 5. `getAssetStatus(url, tenantId)`
- Returns URL status and expiration info
- Shows if URL is permanent or needs refresh
- Useful for monitoring and debugging

### Asset Model Updates

New fields added to `Asset` schema:
```typescript
interface AssetDocument {
  // ... existing fields ...
  
  lastUrlRefreshAt?: Date;        // When URL was last refreshed
  urlExpiresAt?: Date;            // When signed URL expires (if applicable)
  isPermanent?: boolean;          // True if using public URL (no expiration)
}
```

### API Endpoints

#### Refresh Single Asset URL
```
POST /storage/assets/refresh-url?url={url}
Headers: Authorization: Bearer {token}
Response: { url: "refreshed-url" }
```

#### Check Asset URL Status
```
GET /storage/assets/status?url={url}
Headers: Authorization: Bearer {token}
Response: {
  url: "asset-url",
  isPermanent: true|false,
  lastRefreshed: Date,
  expiresAt: Date|null,
  needsRefresh: boolean
}
```

#### Batch Refresh Expiring URLs
```
POST /storage/assets/refresh-batch?olderThanDays=6
Headers: Authorization: Bearer {token}
Response: { refreshedCount: number }
```

#### Migrate All to Permanent URLs
```
POST /storage/assets/migrate-to-permanent
Headers: Authorization: Bearer {token}
Response: { 
  migratedCount: number,
  skippedCount: number
}
```

## Frontend Components

### AssetImage Component
```tsx
// Using path alias (if configured in tsconfig.json)
import { AssetImage } from '@/components/AssetImage';

// Or using relative path
import { AssetImage } from '../../components/AssetImage';

<AssetImage
  src={imageUrl}
  alt="My image"
  autoRefresh={true}  // Default: true
  fallback="/images/broken.png"  // Optional fallback
/>
```

Features:
- Automatic URL refresh on mount
- Detects expired URLs and refreshes on error
- Fallback image support
- Graceful degradation

### AssetVideo Component
```tsx
// AssetVideo is exported from the same module as AssetImage
import { AssetVideo } from '@/components/AssetImage';

// Or using relative path
import { AssetVideo } from '../../components/AssetImage';

<AssetVideo
  src={videoUrl}
  controls
  autoRefresh={true}  // Default: true
/>
```

Features:
- Automatic URL refresh on mount
- Detects expired URLs and refreshes on error
- Shows error message if video fails to load

### useAssetUrl Hook
```tsx
// useAssetUrl is exported from the same module as AssetImage and AssetVideo
import { useAssetUrl } from '@/components/AssetImage';

// Or using relative path
import { useAssetUrl } from '../../components/AssetImage';

function MyComponent({ assetUrl }) {
  const { url, isRefreshing, refreshUrl, checkStatus } = useAssetUrl(assetUrl);
  
  return (
    <div>
      <img src={url} alt="Asset" />
      <button onClick={refreshUrl} disabled={isRefreshing}>
        {isRefreshing ? 'Refreshing...' : 'Refresh URL'}
      </button>
    </div>
  );
}
```

### AssetUrlManager Utility
```tsx
import AssetUrlManager from '@/lib/asset-url-manager';

// Check single URL status
const status = await AssetUrlManager.checkUrlStatus(url);

// Refresh single URL
const refreshedUrl = await AssetUrlManager.refreshAssetUrl(url);

// Get URL with automatic refresh
const freshUrl = await AssetUrlManager.getAssetUrl(url);

// Batch refresh
const count = await AssetUrlManager.batchRefreshUrls(6);

// Migrate to permanent
const result = await AssetUrlManager.migrateToPermanentUrls();

// Setup auto-refresh interval (every 6 hours)
const timerId = AssetUrlManager.startAutoRefresh(6);
// Stop when done
AssetUrlManager.stopAutoRefresh(timerId);
```

## Configuration

### R2 Configuration (backend/.env)
```env
# Public bucket (RECOMMENDED)
R2_ENDPOINT=https://{accountId}.r2.cloudflarestorage.com
R2_BUCKET_NAME=my-bucket
R2_ACCESS_KEY_ID=xxxx
R2_SECRET_ACCESS_KEY=xxxx
R2_PUBLIC_BASE_URL=https://assets.example.com  # Public-facing URL

# Private bucket (will use signed URLs)
# Leave R2_PUBLIC_BASE_URL empty or unset
```

### Frontend Configuration (frontend/.env.local)
```env
NEXT_PUBLIC_API_URL=https://api.example.com
```

## Implementation Guide

### Step 1: Ensure R2 Bucket is Public (Recommended)
```bash
# In Cloudflare R2 settings, allow public access to bucket
# Set ACL to 'public-read' for all objects
```

### Step 2: Configure Public Base URL
```env
# backend/.env
R2_PUBLIC_BASE_URL=https://assets.example.com
```

### Step 3: Migrate Existing Assets (One-time)
```bash
# Call via API or CLI
POST /storage/assets/migrate-to-permanent

# Or run directly in Node:
# const storageService = /* injected */;
# await storageService.migrateAssetsToPermanentUrls(tenantId);
```

### Step 4: Setup Background Job for Automatic Refresh

#### Option A: Cron Job (Recommended for 7-day signed URL scenario)
```typescript
// api/src/crons/asset-url-refresh.cron.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StorageService } from '../storage/storage.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AssetUrlRefreshCron {
  constructor(
    private readonly storageService: StorageService,
    @InjectModel('Tenant') private readonly tenantModel: Model<any>,
  ) {}

  /**
   * Refresh asset URLs every day at 2 AM
   * Ensures URLs are fresh and won't expire for users
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async refreshAssetUrls() {
    console.log('Starting asset URL refresh cron job...');
    
    try {
      // Get all active tenants
      const tenants = await this.tenantModel
        .find({ subscriptionStatus: 'active' })
        .select('_id')
        .exec();

      let totalRefreshed = 0;

      // Refresh URLs for each tenant
      for (const tenant of tenants) {
        try {
          const refreshed = await this.storageService.refreshAssetUrlsBatch(
            tenant._id.toString(),
            6 // Refresh URLs older than 6 days
          );
          totalRefreshed += refreshed;
        } catch (err) {
          console.error(`Error refreshing URLs for tenant ${tenant._id}:`, err);
        }
      }

      console.log(`Asset URL refresh complete: ${totalRefreshed} URLs refreshed`);
    } catch (err) {
      console.error('Error in asset URL refresh cron:', err);
    }
  }
}
```

#### Option B: Backend Service Event
```typescript
// When assets are created, set expiration
@Injectable()
export class CreativeService {
  async createCreative(data: CreateCreativeDto) {
    // ... create creative ...
    
    // If has asset, trigger reminder for refresh in 6 days
    if (data.assetUrl) {
      const refreshDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
      // Store refresh reminder in database or queue
    }
  }
}
```

### Step 5: Use Asset Components in Frontend
```tsx
// Instead of:
<img src={assetUrl} alt="Asset" />
<video src={videoUrl} />

// Use:
<AssetImage src={assetUrl} alt="Asset" autoRefresh />
<AssetVideo src={videoUrl} autoRefresh />
```

## Monitoring & Debugging

### Check URL Status
```typescript
const status = await storageService.getAssetStatus(url, tenantId);
console.log(status);
// Output:
// {
//   url: "https://assets.example.com/file.png",
//   isPermanent: true,
//   needsRefresh: false
// }
```

### Test Refresh
```typescript
const newUrl = await storageService.refreshAssetUrl(url, tenantId);
console.log('Old URL:', url);
console.log('New URL:', newUrl);
```

### Monitor Batch Refresh
```typescript
const count = await storageService.refreshAssetUrlsBatch(tenantId, 6);
console.log(`Refreshed ${count} asset URLs`);
```

## Troubleshooting

### URLs Still Expiring?
1. Check if `R2_PUBLIC_BASE_URL` is configured
2. Verify bucket is public with `ACL: 'public-read'`
3. Run one-time migration: `POST /storage/assets/migrate-to-permanent`
4. Ensure cron job is running daily

### Frontend Shows "Failed to Load"?
1. Check browser console for error messages
2. Verify asset URL format
3. Ensure auth token is valid
4. Check CORS settings if cross-domain

### Batch Refresh Not Working?
1. Verify cron job is installed and running
2. Check database connectivity
3. Verify tenant IDs in database
4. Check for permission errors in logs

## Performance Considerations

- **Public URLs**: No server processing required, CDN-friendly
- **Signed URLs**: Generated on-demand, cached in database for 7 days
- **Batch Refresh**: Runs once daily, processes 100s of assets efficiently
- **Frontend**: Auto-refresh happens in background, doesn't block UI

## Security

- Signed URLs use AWS S3 signature verification
- Public URLs require bucket to be explicitly public
- All operations are user-authenticated via JWT
- Tenant data is isolated per tenant

## Future Enhancements

- [ ] Webhook for URL expiration events
- [ ] URL refresh metrics dashboard
- [ ] Predictive refresh (refresh before expiration)
- [ ] Multi-region URL routing
- [ ] Custom expiration policies per campaign
