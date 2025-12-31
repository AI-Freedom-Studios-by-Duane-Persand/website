# Subscription Plans & Packages

## Overview
The AI Freedom Studios platform uses a three-tier subscription model integrated with Stripe for billing. Subscriptions track user access levels and feature limits.

---

## Available Plans

### 1. Starter Plan
- **Plan ID:** `starter`
- **Name:** Starter
- **Price:** $29/month (2,900 cents)
- **Interval:** Monthly
- **Limits:**
  - Campaigns: 3
  - Posts per month: 30
  - Users: 3
- **Target:** Individual creators and small teams

### 2. Pro Plan
- **Plan ID:** `pro`
- **Name:** Pro
- **Price:** $99/month (9,900 cents)
- **Interval:** Monthly
- **Limits:**
  - Campaigns: 10
  - Posts per month: 100
  - Users: 10
- **Target:** Growing businesses and agencies

### 3. Agency Plan
- **Plan ID:** `agency`
- **Name:** Agency
- **Price:** $299/month (29,900 cents)
- **Interval:** Monthly
- **Limits:**
  - Campaigns: 50
  - Posts per month: 500
  - Users: 50
- **Target:** Enterprise and large agencies

---

## Subscription Model

### Database Schema (subscriptionV2.model.ts)
```typescript
{
  _id: ObjectId;
  userId: ObjectId;           // Reference to User
  packageId: ObjectId;        // Reference to Package
  status: 'active' | 'pending' | 'cancelled' | 'expired';
  stripeSessionId?: string;   // Stripe checkout session ID
  paymentLink?: string;       // Stripe payment link
  validUntil?: Date;          // Expiration date
  createdAt: Date;
  updatedAt: Date;
}
```

### Package Model
```typescript
{
  _id: ObjectId;
  name: string;               // Package name
  price: number;              // Price in dollars
  description?: string;       // Package description
  features: string[];         // List of features
  active: boolean;            // Whether package is active
  createdAt: Date;
  updatedAt: Date;
}
```

### Plan Configuration (plans.ts)
```typescript
interface Plan {
  planId: string;             // Unique identifier
  name: string;               // Display name
  priceCents: number;         // Price in cents
  interval: 'monthly' | 'annual';
  limits: {
    campaigns: number;
    postsPerMonth: number;
    users: number;
  };
}
```

---

## Subscription Statuses

| Status | Description |
|--------|-------------|
| `active` | Subscription is currently active |
| `pending` | Awaiting payment confirmation |
| `cancelled` | User cancelled subscription |
| `expired` | Subscription period has ended |

---

## Related Files

### Backend
- `api/src/config/plans.ts` - Plan definitions
- `api/src/models/subscriptionV2.model.ts` - Subscription schema
- `api/src/models/package.model.ts` - Package schema
- `api/src/subscriptions/subscriptions.service.ts` - Subscription logic
- `api/src/subscriptions/subscriptionsV2.controller.ts` - Subscription endpoints
- `api/src/auth/subscription-required.guard.ts` - Subscription access control
- `api/src/billing/billing.controller.ts` - Stripe integration
- `api/src/admin/admin-packages.controller.ts` - Package management endpoints

### Frontend
- `shared/subscriptionV2.dto.ts` - Data transfer objects
- `shared/subscription.dto.ts` - Legacy subscription DTO

---

## API Endpoints

### Subscription Management
- `GET /api/subscriptions` - List subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions/:id` - Get subscription details
- `PATCH /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Cancel subscription

### Package Management (Admin)
- `GET /admin/packages` - List all packages
- `GET /admin/packages/names` - List package IDs and names
- `POST /admin/packages` - Create package
- `PATCH /admin/packages/:id` - Update package
- `PUT /admin/packages/:id` - Replace package
- `DELETE /admin/packages/:id` - Delete package

### Billing
- `POST /api/billing/checkout` - Create Stripe checkout session
  - Request: `{ planId: string; successUrl: string; cancelUrl: string }`
  - Response: `{ url: string }` (Stripe URL)

---

## Tenant Subscription Tracking

Each tenant also tracks subscription status:

```typescript
// In Tenant schema
{
  planId: string | null;
  stripeCustomerId: string | null;
  subscriptionStatus: 'active' | 'expired' | 'pending' | 'none';
}
```

---

## Feature Gating

Subscriptions control access to features through:

1. **SubscriptionRequiredGuard** - Enforces active subscription
2. **Package Limits** - Enforces feature limits per package
3. **Admin Service** - Tracks subscription analytics

### Example: Check for Active Subscription
```typescript
const sub = await this.subscriptionModel.findOne({
  userId,
  status: 'active',
  validUntil: { $gte: new Date() }
}).populate('packageId');

if (!sub) throw new ForbiddenException('No active subscription');
```

---

## Pricing Summary

| Plan | Monthly Price | Campaigns | Posts/Month | Users |
|------|---------------|-----------|------------|-------|
| Starter | $29 | 3 | 30 | 3 |
| Pro | $99 | 10 | 100 | 10 |
| Agency | $299 | 50 | 500 | 50 |

---

## Stripe Integration

### Checkout Flow
1. User selects plan on pricing page
2. `POST /api/billing/checkout` creates Stripe session
3. User redirected to Stripe Checkout
4. After payment, subscription created with:
   - `stripeSessionId` from Stripe
   - `status: 'pending'`
   - `validUntil` set to expiration date
5. Webhook updates status to `'active'` on successful payment

### Webhook Handling
- Listens for `checkout.session.completed` events
- Updates subscription status
- Sends confirmation emails

---

## Database Queries

### Get All Active Subscriptions
```javascript
db.subscriptions.find({ 
  status: 'active',
  validUntil: { $gte: new Date() }
}).populate('userId').populate('packageId')
```

### Get User's Active Subscription
```javascript
db.subscriptions.findOne({
  userId: ObjectId('...'),
  status: 'active'
}).populate('packageId')
```

### Count Subscriptions by Status
```javascript
db.subscriptions.aggregate([
  { $group: { _id: '$status', count: { $sum: 1 } } }
])
```

### Revenue Analytics
```javascript
db.subscriptions.aggregate([
  { $match: { status: 'active' } },
  { $lookup: { from: 'packages', localField: 'packageId', foreignField: '_id', as: 'package' } },
  { $group: { _id: null, totalRevenue: { $sum: '$package.price' } } }
])
```

---

## Configuration

### Stripe Keys (Environment)
```env
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Payment URLs
```env
STRIPE_SUCCESS_URL=https://app.example.com/billing/success
STRIPE_CANCEL_URL=https://app.example.com/billing/canceled
```

---

## Future Enhancements

1. **Annual Billing** - Implement yearly plans with discount
2. **Custom Plans** - Allow enterprise custom limits
3. **Trial Period** - Free trial before first payment
4. **Usage-Based Billing** - Add overage charges
5. **Seat-Based Pricing** - Charge per additional user
6. **Dunning Management** - Retry failed payments
7. **Subscription Management UI** - Self-service changes
8. **Invoice History** - Downloadable invoices

---

## Testing

### Test Stripe Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Test Subscription Flow
1. Create package via admin
2. Initiate checkout with test card
3. Verify subscription created in database
4. Check subscription status updated to active

---

## Support

For subscription-related issues:
- Check `subscriptions` collection in MongoDB
- Verify Stripe API keys are valid
- Review webhook logs for payment events
- Check user's `validUntil` date
