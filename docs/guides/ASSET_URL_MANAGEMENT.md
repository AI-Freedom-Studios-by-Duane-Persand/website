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

### URL Encoding & Edge Cases

**Special Characters in Keys:**
Asset keys with spaces or special characters are automatically URL-encoded:
```typescript
// Key with spaces
const key = "my folder/image file.png";
// Stored as: "my%20folder/image%20file.png"

// Key with special chars
const key = "assets/brand#1/logo@2x.png";
// Stored as: "assets/brand%231/logo%402x.png"
```

**Handling Non-ASCII Characters:**
```typescript
// Unicode characters (emoji, non-Latin)
const key = "uploads/🎉celebration/文件.jpg";
// Properly encoded by encodeURIComponent()
// Result: "uploads/%F0%9F%8E%89celebration/%E6%96%87%E4%BB%B6.jpg"
```

**Query Parameter Preservation:**
When refreshing URLs with existing query params:
```typescript
// Original URL
const url = "https://assets.example.com/video.mp4?t=30&autoplay=1";

// After refresh (query params preserved)
const refreshed = await refreshAssetUrl(url);
// Result: "https://assets.example.com/video.mp4?t=30&autoplay=1&X-Amz-..."
```

**Normalized Path Handling:**
```typescript
// Paths with double slashes or relative segments
const key = "folder//subfolder/./file.png";
// Normalized to: "folder/subfolder/file.png"
```

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

### Step 0: R2 Bucket Setup (Cloudflare Dashboard)

**Create R2 Bucket:**

1. **Navigate to R2:**
   - Log in to Cloudflare Dashboard → R2 Object Storage
   - Click "Create bucket"

2. **Bucket Configuration:**
   ```
   Bucket Name: ai-freedom-studio-assets  (or your preferred name)
   Location: Automatic (or choose specific region for compliance)
   ```

3. **Enable Public Access (Recommended):**
   - Go to bucket Settings → Public Access
   - Toggle "Allow public access" → Enable
   - Click "Save"
   
   **Warning:** Only use public access for non-sensitive assets. For user-uploaded content with privacy concerns, skip this step and use signed URLs.

4. **Configure Custom Domain (Optional but Recommended):**
   ```
   Go to bucket Settings → Custom Domains
   Click "Connect Domain"
   
   Domain: assets.yourcompany.com
   
   Add DNS records as instructed:
   Type: CNAME
   Name: assets
   Target: {your-bucket}.r2.cloudflarestorage.com
   ```
   
   **Benefits:**
   - Branded URLs (`assets.yourcompany.com/image.jpg`)
   - Better CDN caching
   - Easier to migrate storage providers later

5. **Create API Token:**
   ```
   Go to R2 → Manage R2 API Tokens
   Click "Create API Token"
   
   Token Name: ai-freedom-studio-backend
   Permissions: Object Read & Write
   
   Copy and save:
   - Access Key ID (like AWS_ACCESS_KEY_ID)
   - Secret Access Key (like AWS_SECRET_ACCESS_KEY)
   - R2 Endpoint URL (e.g., https://{accountId}.r2.cloudflarestorage.com)
   ```

6. **Set Bucket CORS (if frontend uploads directly):**
   ```json
   Go to bucket Settings → CORS Policy
   Add rule:
   {
     "AllowedOrigins": ["https://yourapp.com", "http://localhost:3000"],
     "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
     "AllowedHeaders": ["*"],
     "ExposeHeaders": ["ETag"],
     "MaxAgeSeconds": 3600
   }
   ```

7. **Configure Lifecycle Rules (Optional):**
   ```
   Go to bucket Settings → Lifecycle Rules
   
   Rule: Delete old temporary files
   Prefix: temp/
   Expiration: 7 days
   ```

### Step 1: Backend Environment Configuration

**For Public Bucket (Recommended):**
```env
# api/.env
R2_ENDPOINT=https://{accountId}.r2.cloudflarestorage.com
R2_BUCKET_NAME=ai-freedom-studio-assets
R2_ACCESS_KEY_ID=your_access_key_from_step_5
R2_SECRET_ACCESS_KEY=your_secret_key_from_step_5

# Public URL (use custom domain if configured)
R2_PUBLIC_BASE_URL=https://assets.yourcompany.com
# OR use R2's default public URL:
# R2_PUBLIC_BASE_URL=https://pub-{bucketId}.r2.dev
```

**For Private Bucket (Signed URLs):**
```env
# api/.env
R2_ENDPOINT=https://{accountId}.r2.cloudflarestorage.com
R2_BUCKET_NAME=ai-freedom-studio-assets
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key

# Leave R2_PUBLIC_BASE_URL empty or unset
# R2_PUBLIC_BASE_URL=
```

### Step 2: Migrate Existing Assets (One-time)
```bash
# Call via API or CLI
POST /storage/assets/migrate-to-permanent

# Or run directly in Node:
# const storageService = /* injected */;
# await storageService.migrateAssetsToPermanentUrls(tenantId);
```

### Step 3: Setup Background Job for Automatic Refresh

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

### Step 4: Use Asset Components in Frontend
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

## Error Handling

### Backend Error Responses

**Common Error Codes:**
```typescript
// 400 Bad Request - Invalid URL format
{
  "statusCode": 400,
  "message": "Invalid asset URL format",
  "error": "Bad Request"
}

// 401 Unauthorized - Missing or invalid JWT
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}

// 403 Forbidden - Asset belongs to different tenant
{
  "statusCode": 403,
  "message": "You don't have permission to access this asset",
  "error": "Forbidden"
}

// 404 Not Found - Asset doesn't exist in database
{
  "statusCode": 404,
  "message": "Asset not found",
  "error": "Not Found"
}

// 429 Too Many Requests - Rate limit exceeded
{
  "statusCode": 429,
  "message": "Too many requests",
  "error": "ThrottlerException"
}

// 500 Internal Server Error - R2 connection failed
{
  "statusCode": 500,
  "message": "Failed to refresh asset URL",
  "error": "Internal Server Error"
}
```

### Frontend Error Handling

**Graceful Degradation in Components:**
```tsx
// AssetImage with comprehensive error handling
<AssetImage
  src={assetUrl}
  alt="Product image"
  autoRefresh={true}
  fallback="/images/placeholder.png"  // Shown on error
  onError={(error) => {
    // Custom error handling
    console.error('Asset failed to load:', error);
    analytics.track('asset_load_error', { url: assetUrl });
  }}
/>
```

**Manual Error Handling with useAssetUrl:**
```tsx
import { useAssetUrl } from '@/components/AssetImage';
import { useState } from 'react';

function MyComponent({ assetUrl }) {
  const { url, isRefreshing, error, refreshUrl } = useAssetUrl(assetUrl);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = async () => {
    if (retryCount >= 3) {
      alert('Max retries reached. Please contact support.');
      return;
    }
    setRetryCount(prev => prev + 1);
    await refreshUrl();
  };

  if (error) {
    return (
      <div className="error-state">
        <p>Failed to load asset: {error.message}</p>
        <button onClick={handleRetry} disabled={isRefreshing}>
          {isRefreshing ? 'Retrying...' : `Retry (${3 - retryCount} left)`}
        </button>
      </div>
    );
  }

  return <img src={url} alt="Asset" />;
}
```

**Network Error Recovery:**
```typescript
// AssetUrlManager with exponential backoff
import AssetUrlManager from '@/lib/asset-url-manager';

async function refreshWithRetry(url: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await AssetUrlManager.refreshAssetUrl(url);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retry ${attempt}/${maxRetries} after ${delay}ms`);
    }
  }
}
```

**Handling Expired URLs:**
```typescript
// Detect and handle expired signed URLs
function isUrlExpired(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const expiresParam = urlObj.searchParams.get('X-Amz-Expires');
    const dateParam = urlObj.searchParams.get('X-Amz-Date');
    
    if (!expiresParam || !dateParam) {
      return false;  // Public URL, never expires
    }
    
    const issuedAt = parseAmzDate(dateParam);
    const expiresIn = parseInt(expiresParam, 10);
    const expiresAt = new Date(issuedAt.getTime() + expiresIn * 1000);
    
    return Date.now() > expiresAt.getTime();
  } catch {
    return false;
  }
}

// Auto-refresh on image load error
const handleImageError = async (event: React.SyntheticEvent<HTMLImageElement>) => {
  const img = event.currentTarget;
  const src = img.src;
  
  if (isUrlExpired(src)) {
    console.log('URL expired, refreshing...');
    const newUrl = await AssetUrlManager.refreshAssetUrl(src);
    img.src = newUrl;
  } else {
    // Different error (404, network, etc.)
    img.src = fallbackUrl;
  }
};
```

### Backend Service Error Handling

**StorageService with detailed logging:**
```typescript
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  async refreshAssetUrl(url: string, tenantId?: string): Promise<string> {
    try {
      // Find asset
      const asset = await this.assetModel.findOne({ url });
      if (!asset) {
        this.logger.warn(`Asset not found for URL: ${url.split('?')[0]}`);
        throw new NotFoundException('Asset not found');
      }

      // Validate tenant
      if (tenantId && asset.tenantId.toString() !== tenantId) {
        this.logger.warn(`Tenant mismatch for asset ${asset._id}`);
        throw new ForbiddenException('Access denied');
      }

      // Generate new URL
      const newUrl = asset.isPermanent
        ? this.getPublicUrl(asset.key)
        : await this.generateSignedUrl(asset.key);

      // Update database
      await this.assetModel.updateOne(
        { _id: asset._id },
        {
          url: newUrl,
          lastUrlRefreshAt: new Date(),
          urlExpiresAt: asset.isPermanent ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      );

      this.logger.log(`Refreshed URL for asset ${asset._id}`);
      return newUrl;
    } catch (error) {
      this.logger.error(`Failed to refresh URL: ${error.message}`, error.stack);
      throw error;
    }
  }
}
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

### Authentication & Authorization

**JWT Token Validation:**
All API endpoints require valid JWT token in Authorization header:
```typescript
// Example request
fetch('/storage/assets/refresh-url?url=...', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});
```

**Tenant Isolation:**
Every operation validates tenant ownership:
```typescript
// Backend: Automatic tenant check via CurrentUser decorator
@Post('assets/refresh-url')
async refreshUrl(
  @CurrentUser() user,  // Contains tenantId from JWT
  @Query('url') url: string
) {
  // Asset URL is validated against user.tenantId
  // Cross-tenant access is automatically prevented
}
```

### URL Security Best Practices

**1. Public URL Considerations:**
- ✅ **Unpredictable Keys**: Use UUIDs or hashes, never sequential IDs
  ```typescript
  // Good: crypto.randomUUID() or hash-based
  const key = `${uuidv4()}.${ext}`;  // "3fa85f64-5717-4562-b3fc-2c963f66afa6.jpg"
  
  // Bad: Sequential or guessable
  const key = `asset_${counter}.jpg`;  // "asset_1.jpg", "asset_2.jpg" (enumerable!)
  ```

- ⚠️ **No Sensitive Data**: Public URLs are accessible without auth
  ```typescript
  // For sensitive content, use signed URLs instead
  if (isSensitive) {
    // Don't set R2_PUBLIC_BASE_URL for this upload
    const signedUrl = await this.generateSignedUrl(key);
  }
  ```

- 🔒 **IP Whitelisting**: Optionally restrict access by origin
  ```typescript
  // Cloudflare Workers or WAF rules
  if (request.headers.get('cf-connecting-ip') !== allowedIp) {
    return new Response('Forbidden', { status: 403 });
  }
  ```

**2. Signed URL Security:**
- ✅ **Short Expiration**: 7 days balances usability and security
- ✅ **Automatic Rotation**: URLs refreshed every 6 days
- ✅ **Signature Verification**: AWS V4 signature prevents tampering
- ⚠️ **Revocation**: Changing R2 credentials invalidates all signed URLs

**3. Rate Limiting:**
```typescript
// Example rate limit middleware (if not using built-in controller limits)
import { Throttle } from '@nestjs/throttler';

@Throttle({ default: { limit: 60, ttl: 60000 } })  // 60 requests per minute
@Get('assets/status')
async getStatus(@Query('url') url: string) {
  // Rate-limited endpoint
}
```

**4. Input Validation:**
```typescript
// Validate URL format before processing
import { IsUrl, IsNotEmpty } from 'class-validator';

export class RefreshUrlDto {
  @IsNotEmpty()
  @IsUrl({ require_protocol: true })
  url: string;
}
```

**5. Logging & Monitoring:**
```typescript
// Log access patterns without exposing sensitive data
this.logger.log({
  action: 'asset_url_refreshed',
  tenantId: user.tenantId,
  assetId: asset._id,
  // ❌ Don't log full URLs (they contain signed tokens)
  urlPattern: url.split('?')[0],  // Log only base path
  timestamp: new Date()
});
```

**6. CORS Configuration:**
```typescript
// api/src/main.ts
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

### Compliance & Data Protection

- **GDPR/CCPA**: Asset deletion removes both file and URL from database
- **Audit Trail**: All refresh operations logged with tenant context
- **Data Residency**: R2 bucket region configurable per tenant
- **Encryption**: Files encrypted at rest by Cloudflare R2

## Future Enhancements

- [ ] Webhook for URL expiration events
- [ ] URL refresh metrics dashboard
- [ ] Predictive refresh (refresh before expiration)
- [ ] Multi-region URL routing
- [ ] Custom expiration policies per campaign
