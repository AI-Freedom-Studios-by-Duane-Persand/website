# Ayrshare Social Media Integration

## Overview
Comprehensive multi-platform social media posting integration using Ayrshare API. Supports Facebook, Instagram, Twitter, LinkedIn, YouTube, and TikTok with unified interface and platform-specific options.

## Architecture

### Core Components

#### 1. AyrshareService (`api/src/social/ayrshare.service.ts`)
Low-level API client for Ayrshare platform.

**Key Features:**
- Multi-platform post creation with scheduling
- Profile and account management
- Post history and analytics
- Media upload and URL shortening
- Platform connection management

**Main Methods:**
```typescript
// Post Management
createPost(options: AyrsharePostOptions): Promise<AyrsharePostResponse>
createMetaPost(content: string, metaPageId: string): Promise<any> // Legacy wrapper
deletePost(postId: string, bulk?: boolean): Promise<any>

// Profile Management
getProfiles(): Promise<AyrshareProfile[]>
getProfile(profileKey: string): Promise<AyrshareProfile>
checkConnection(platform: string): Promise<{ connected: boolean }>
generateJWT(domain?: string): Promise<{ jwt: string; url: string }>

// Analytics & History
getHistory(lastRecords?: number, lastDays?: number): Promise<any>
getPostAnalytics(postId: string, platforms?: string[]): Promise<any>
getAccountAnalytics(platforms?: string[]): Promise<any>

// Utilities
uploadMedia(file: { url?: string; fileName?: string }): Promise<{ url: string }>
shortenUrl(url: string): Promise<{ shortUrl: string }>
getUser(): Promise<any>
```

**Configuration:**
```typescript
// Environment Variable
AYRSHARE_API_KEY=your_api_key_here

// API Endpoint
baseURL: https://app.ayrshare.com/api
```

#### 2. SocialPublisher (`api/src/social/social.publisher.ts`)
High-level abstraction for publishing to social platforms.

**Key Features:**
- Platform-specific convenience methods
- Unified publish interface
- Automatic scheduling support
- Analytics and history retrieval

**Main Methods:**
```typescript
// Unified Publishing
publish(options: PublishOptions): Promise<any>
schedulePost(options: PublishOptions, scheduleDate: Date | string): Promise<any>

// Platform-Specific Methods
publishToFacebook(content: string, mediaUrls?: string[], options?: {...}): Promise<any>
publishToInstagram(content: string, mediaUrls?: string[], options?: {...}): Promise<any>
publishToTwitter(content: string, mediaUrls?: string[], options?: {...}): Promise<any>
publishToLinkedIn(content: string, mediaUrls?: string[], options?: {...}): Promise<any>
publishToYouTube(videoUrl: string, title: string, options?: {...}): Promise<any>
publishToTikTok(videoUrl: string, caption: string, options?: {...}): Promise<any>
publishToMeta(content: string, metaPageId: string): Promise<any> // Legacy

// Analytics & Management
getConnectedProfiles(): Promise<any>
getPostHistory(lastRecords?: number, lastDays?: number): Promise<any>
getPostAnalytics(postId: string, platforms?: string[]): Promise<any>
getAccountAnalytics(platforms?: string[]): Promise<any>
deletePost(postId: string, bulk?: boolean): Promise<any>

// Utilities
uploadMedia(file: { url?: string; fileName?: string }): Promise<{ url: string }>
shortenUrl(url: string): Promise<{ shortUrl: string }>
```

#### 3. SocialAccountsController (`api/src/social/social-accounts.controller.ts`)
REST API endpoints for social media operations.

**Endpoints:**

```
GET    /api/social-accounts/profiles              - Get all connected profiles
GET    /api/social-accounts/profiles/:profileKey  - Get specific profile
GET    /api/social-accounts/connection/:platform  - Check platform connection
POST   /api/social-accounts/connect/jwt           - Generate connection JWT
GET    /api/social-accounts/user                  - Get user info

POST   /api/social-accounts/posts                 - Create new post
DELETE /api/social-accounts/posts/:postId         - Delete post
GET    /api/social-accounts/history               - Get post history

GET    /api/social-accounts/analytics/post/:postId    - Get post analytics
GET    /api/social-accounts/analytics/account         - Get account analytics

POST   /api/social-accounts/media/upload          - Upload media
POST   /api/social-accounts/url/shorten           - Shorten URL
```

#### 4. SocialAccountsModule (`api/src/social/social-accounts.module.ts`)
Module configuration and exports.

```typescript
@Module({
  controllers: [SocialAccountsController],
  providers: [AyrshareService, SocialPublisher],
  exports: [SocialPublisher, AyrshareService],
})
export class SocialAccountsModule {}
```

## Usage Examples

### Basic Post to Multiple Platforms

```typescript
import { SocialPublisher } from './social/social.publisher';

// Inject in your service/controller
constructor(private readonly socialPublisher: SocialPublisher) {}

// Post to multiple platforms
async postToSocial() {
  return await this.socialPublisher.publish({
    post: 'Check out our new product! 🚀',
    platforms: ['facebook', 'twitter', 'linkedin'],
    mediaUrls: ['https://example.com/image.jpg'],
    shortenLinks: true,
  });
}
```

### Platform-Specific Posts

```typescript
// Facebook with page ID
await this.socialPublisher.publishToFacebook(
  'Special Facebook announcement!',
  ['https://example.com/photo.jpg'],
  { pageId: 'your-page-id', title: 'Big News' }
);

// Instagram Reel
await this.socialPublisher.publishToInstagram(
  'Watch our latest reel!',
  ['https://example.com/video.mp4'],
  { imageUrl: 'https://example.com/thumbnail.jpg', mediaType: 'VIDEO' }
);

// Twitter Thread
await this.socialPublisher.publishToTwitter(
  'First tweet in thread',
  undefined,
  { threadTweets: ['Second tweet', 'Third tweet'] }
);

// YouTube Video
await this.socialPublisher.publishToYouTube(
  'https://example.com/video.mp4',
  'Amazing Tutorial',
  { visibility: 'public', thumbNail: 'https://example.com/thumb.jpg' }
);
```

### Scheduled Posts

```typescript
// Schedule for future
const scheduleDate = new Date('2024-12-25T10:00:00Z');
await this.socialPublisher.schedulePost(
  {
    post: 'Happy Holidays!',
    platforms: ['facebook', 'instagram', 'twitter'],
    mediaUrls: ['https://example.com/holiday.jpg'],
  },
  scheduleDate
);

// Or use ISO string directly
await this.socialPublisher.publish({
  post: 'Scheduled content',
  platforms: ['linkedin'],
  scheduleDate: '2024-12-31T00:00:00.000Z',
});
```

### Analytics & History

```typescript
// Get post history
const history = await this.socialPublisher.getPostHistory(10, 7); // Last 10 posts from last 7 days

// Get specific post analytics
const postStats = await this.socialPublisher.getPostAnalytics('post-id-123', ['facebook', 'twitter']);

// Get overall account analytics
const accountStats = await this.socialPublisher.getAccountAnalytics(['instagram']);
```

### Account Management

```typescript
// Get all connected profiles
const profiles = await this.socialPublisher.getConnectedProfiles();

// Check if platform is connected
const isConnected = await this.ayrshareService.checkConnection('facebook');

// Generate JWT for connecting new account
const { jwt, url } = await this.ayrshareService.generateJWT('yourdomain.com');
// Redirect user to url to connect their social account
```

## Platform-Specific Options

### Facebook
```typescript
facebookOptions: {
  pageId?: string;              // Facebook page ID
  title?: string;               // Post title
  description?: string;         // Post description
  linkTitle?: string;           // Link preview title
  linkDescription?: string;     // Link preview description
}
```

### Instagram
```typescript
instagramOptions: {
  imageUrl?: string;            // Thumbnail for videos
  mediaType?: 'PHOTO' | 'VIDEO' | 'CAROUSEL_ALBUM';
}
```

### Twitter
```typescript
twitterOptions: {
  threadTweets?: string[];      // Additional tweets for thread
  poll?: {
    duration: number;           // Poll duration in minutes
    option1: string;
    option2: string;
    option3?: string;
    option4?: string;
  };
}
```

### LinkedIn
```typescript
linkedInOptions: {
  commentOff?: boolean;         // Disable comments
  visibility?: 'public' | 'connections';
}
```

### YouTube
```typescript
youtubeOptions: {
  title?: string;               // Video title
  visibility?: 'public' | 'unlisted' | 'private';
  thumbNail?: string;           // Thumbnail URL
}
```

### TikTok
```typescript
tiktokOptions: {
  privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
  videoUrl?: string;            // TikTok video URL
}
```

## Error Handling

All methods throw `BadRequestException` with descriptive messages:

```typescript
try {
  await this.socialPublisher.publish({ ... });
} catch (error) {
  // Error format: "Failed to create post: [Ayrshare error message]"
  console.error(error.message);
}
```

## Integration with Campaign Flow

### Scheduling System Integration

```typescript
// In your scheduling service
import { SocialPublisher } from './social/social.publisher';

@Injectable()
export class SchedulingService {
  constructor(private readonly socialPublisher: SocialPublisher) {}

  async scheduleCreativePost(creative: Creative, scheduleDate: Date) {
    // Get creative assets
    const mediaUrls = [creative.imageUrl];
    if (creative.videoUrl) {
      mediaUrls.push(creative.videoUrl);
    }

    // Schedule post to configured platforms
    return await this.socialPublisher.schedulePost(
      {
        post: creative.caption,
        platforms: creative.targetPlatforms, // ['facebook', 'instagram', 'twitter']
        mediaUrls,
        shortenLinks: true,
      },
      scheduleDate
    );
  }
}
```

### Approval Workflow Integration

```typescript
// In your approval service
@Injectable()
export class ApprovalService {
  constructor(private readonly socialPublisher: SocialPublisher) {}

  async publishApprovedContent(approval: Approval) {
    if (approval.status !== 'approved') {
      throw new Error('Content not approved');
    }

    // Publish immediately or schedule
    const publishOptions = {
      post: approval.content,
      platforms: approval.platforms,
      mediaUrls: approval.mediaUrls,
    };

    if (approval.scheduleDate) {
      return await this.socialPublisher.schedulePost(publishOptions, approval.scheduleDate);
    } else {
      return await this.socialPublisher.publish(publishOptions);
    }
  }
}
```

## Testing

### Local Development

1. Set environment variable:
```bash
AYRSHARE_API_KEY=your_test_api_key
```

2. Test profile connection:
```bash
curl http://localhost:3001/api/social-accounts/profiles
```

3. Test post creation:
```bash
curl -X POST http://localhost:3001/api/social-accounts/posts \
  -H "Content-Type: application/json" \
  -d '{
    "post": "Test post",
    "platforms": ["facebook"]
  }'
```

## Migration Guide

### From Old AyrshareService

**Before:**
```typescript
await this.ayrshareService.createMetaPost(content, pageId);
```

**After:**
```typescript
// Option 1: Use legacy wrapper (still works)
await this.ayrshareService.createMetaPost(content, pageId);

// Option 2: Use new interface (recommended)
await this.socialPublisher.publishToFacebook(content, mediaUrls, { pageId });
```

## Next Steps

1. **Configure Ayrshare Account:**
   - Sign up at https://www.ayrshare.com/
   - Get API key from dashboard
   - Add to `.env` file

2. **Connect Social Accounts:**
   - Generate JWT: `POST /api/social-accounts/connect/jwt`
   - User follows connection URL
   - Verify connection: `GET /api/social-accounts/profiles`

3. **Integrate with Campaign Flow:**
   - Import `SocialPublisher` into scheduling services
   - Add post scheduling to creative rendering workflow
   - Implement approval gate before publishing

4. **Add Frontend UI:**
   - Profile management page
   - Post scheduling interface
   - Analytics dashboard
   - Connection status indicators

## Resources

- [Ayrshare API Documentation](https://docs.ayrshare.com/)
- [Ayrshare Platform Guides](https://www.ayrshare.com/platform-guides)
- [Campaign Flow Plan](./plan-updateCampaignFlow.prompt.md)

## Support

For issues or questions:
1. Check Ayrshare API status
2. Verify API key is configured
3. Check social account connections
4. Review error logs in application
