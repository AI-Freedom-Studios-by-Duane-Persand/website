# Early Access Setup Guide

## Quick Start

### 1. Add Email to Whitelist

Edit `api/src/auth/early-access.config.ts`:

```typescript
export const EARLY_ACCESS_WHITELIST: string[] = [
  'admin@aifreedomstudios.com',
  'test@example.com',
  'your-email@example.com', // Add your email here
];
```

### 2. Sign Up with Whitelisted Email

Navigate to `/signup` and create an account using a whitelisted email. The system will automatically set `isEarlyAccess: true` for your account.

### 3. Access Dashboard

After signup, navigate to `/app/dashboard`. You should see the full dashboard instead of the "Coming Soon" screen.

## User Experience

### Whitelisted Users
- Full access to all dashboard pages
- Can create campaigns, manage creatives, schedule posts
- No restrictions

### Non-Whitelisted Users
- See "Coming Soon" screen on all dashboard pages
- Can submit email for early access notification
- Email stored in `earlyaccessrequests` MongoDB collection
- Account exists but features are gated

## Managing Early Access

### Check User Status

```javascript
// In MongoDB shell
db.users.find({ email: "user@example.com" }, { email: 1, isEarlyAccess: 1 })
```

### Grant Access to Existing User

```javascript
// Update user to grant access
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { isEarlyAccess: true } }
)
```

### Revoke Access

```javascript
// Update user to revoke access
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { isEarlyAccess: false } }
)
```

### View Early Access Requests

```javascript
// List all pending requests
db.earlyaccessrequests.find({ status: 'pending' }).pretty()

// Count requests
db.earlyaccessrequests.countDocuments()

// Export email list
db.earlyaccessrequests.find(
  { status: 'pending' },
  { email: 1, requestedAt: 1, _id: 0 }
).sort({ requestedAt: -1 })
```

## API Endpoints

### Check User Status
```bash
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "userId": "...",
  "email": "user@example.com",
  "roles": ["tenantOwner"],
  "isEarlyAccess": true
}
```

### Request Early Access
```bash
POST /api/auth/early-access/request
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Early access request submitted"
}
```

## Frontend Components

### EarlyAccessGate Component
Location: `frontend/app/components/EarlyAccessGate.tsx`

Wraps protected content and shows "Coming Soon" screen for non-whitelisted users.

### useAuth Hook
Location: `frontend/app/hooks/useAuth.ts`

Provides centralized auth state including `hasEarlyAccess` boolean.

## Protected Pages

All pages under `/app/*` are protected:
- Dashboard (`/app/dashboard`)
- Campaigns (`/app/campaigns`)
- Creatives (`/app/creatives`)
- Calendar (`/app/calendar`)
- Analytics (`/app/analytics`)
- Settings (`/app/settings`)

Admin pages (`/admin/*`) and tenant pages (`/tenant/*`) are NOT gated by early access - they use role-based access control.

## Testing

### Test Whitelisted Access
1. Add email to whitelist in `early-access.config.ts`
2. Restart API server: `npm run start:dev`
3. Sign up with whitelisted email
4. Navigate to `/app/dashboard`
5. Should see full dashboard

### Test Non-Whitelisted Access
1. Sign up with random email (not in whitelist)
2. Navigate to `/app/dashboard`
3. Should see "Coming Soon" screen
4. Submit email in form
5. Check MongoDB: `db.earlyaccessrequests.find().pretty()`

## Migration for Existing Users

If you have existing users who should get early access:

```javascript
// Grant access to all existing users
db.users.updateMany(
  {},
  { $set: { isEarlyAccess: true } }
)

// Or grant to specific tenants
db.users.updateMany(
  { roles: { $in: ["tenantOwner", "superadmin"] } },
  { $set: { isEarlyAccess: true } }
)
```

## Future Enhancements

### Admin Dashboard
Create admin UI to:
- View all early access requests
- Approve/reject requests
- Bulk grant access
- Export email lists

### Email Notifications
- Send confirmation email when access granted
- Welcome email with onboarding steps
- Waitlist position updates

### Analytics
- Track conversion rate from request to signup
- Monitor waitlist growth
- A/B test "Coming Soon" messaging

## Troubleshooting

### User sees "Coming Soon" but should have access

Check database:
```javascript
db.users.findOne({ email: "user@example.com" })
```

If `isEarlyAccess` is false, update:
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { isEarlyAccess: true } }
)
```

User must log out and log back in for changes to take effect.

### Early access form doesn't submit

Check browser console for errors. Verify API endpoint is accessible:
```bash
curl -X POST http://localhost:3000/api/auth/early-access/request \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'
```

### All users getting "Coming Soon"

Check:
1. Whitelist in `early-access.config.ts`
2. API server restarted after whitelist changes
3. Users signed up AFTER adding to whitelist
4. Database has `isEarlyAccess` field on user documents

## Security Notes

- Whitelist check happens at signup time only
- Changing whitelist doesn't affect existing users
- Frontend relies on backend `/api/auth/me` response
- Consider adding middleware to protect API endpoints for non-early-access users
- Email addresses in whitelist are case-insensitive

## Environment Variables

Future enhancement - move whitelist to environment:
```env
EARLY_ACCESS_WHITELIST=admin@example.com,user1@example.com,user2@example.com
```

Then update config:
```typescript
export const EARLY_ACCESS_WHITELIST = 
  process.env.EARLY_ACCESS_WHITELIST?.split(',') || [];
```
