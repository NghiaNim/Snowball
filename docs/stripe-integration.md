# Stripe Integration - Payment System

## ✅ Implemented Features

### Database Schema
- **user_subscriptions**: Tracks user plan types and Stripe subscription data
- **daily_usage**: Tracks daily search counts per user
- **RLS policies**: Proper user isolation for subscription and usage data

### Usage Tracking
- **Free tier**: 5 searches per day
- **Pro tier**: Unlimited searches
- **Real-time usage checks**: Before each search operation
- **Usage increment**: Automatic after successful searches

### Payment Flow
- **Upgrade button**: Visible on dashboard for free users
- **Stripe checkout**: Integration with Stripe checkout sessions
- **Environment variables**: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRODUCT_ID`

### User Experience
- **Usage display**: Shows remaining searches for free users
- **Limit enforcement**: Blocks searches when limit exceeded
- **Upgrade prompts**: Clear messaging about Pro benefits
- **Real-time updates**: Usage refreshes after searches and upgrades

## 🔧 API Endpoints

### `/api/stripe/create-checkout` (POST)
- Creates Stripe checkout session
- Requires authentication
- Returns checkout URL for redirect

### `/api/user/usage` (GET)
- Returns current user usage and plan status
- Includes search count, plan type, and limits

### Query APIs Enhanced
- **Usage checks**: All search operations check limits first
- **Error handling**: Returns 429 status when limits exceeded
- **Usage increment**: Automatic tracking after successful operations

## 🎯 Environment Setup Required

### 1. Get Your Stripe Price ID (Not Product ID!)

In Stripe, you need the **Price ID**, not the Product ID:

1. **Go to Stripe Dashboard** → Products
2. **Click on your Pro plan product**
3. **Copy the Price ID** (starts with `price_...`)
4. **This is different from Product ID** - Product is the item, Price is the specific pricing

### 2. Set Environment Variables

Add these to your `.env.local`:
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRICE_ID=price_...  # Your Pro plan PRICE ID (not product ID)
STRIPE_WEBHOOK_SECRET=whsec_...  # From webhook endpoint in Stripe
```

### 3. Set Up Webhook Endpoint

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Add endpoint**: `https://yourdomain.com/api/stripe/webhooks`
3. **Select events**:
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `checkout.session.completed`
4. **Copy webhook secret** → add to `STRIPE_WEBHOOK_SECRET`

## 🧪 Testing the Flow

1. **Free User Flow**:
   - Sign up with Google
   - Make 5 searches (should work)
   - Try 6th search (should be blocked)
   - See upgrade button with usage info

2. **Upgrade Flow**:
   - Click "Upgrade to Pro" button
   - Redirected to Stripe checkout
   - Complete payment in sandbox
   - Return to dashboard

3. **Pro User Experience**:
   - Should see "Pro Plan Active" card
   - Unlimited searches allowed
   - No upgrade prompts

## ⚠️ Production Readiness

### Still Needed for Production:
1. **Stripe Webhooks** (`/api/stripe/webhooks`):
   - Handle `customer.subscription.created`
   - Handle `customer.subscription.updated` 
   - Handle `customer.subscription.deleted`
   - Update user_subscriptions table accordingly

2. **Subscription Management**:
   - Cancel subscription endpoint
   - Update payment method
   - View billing history

3. **Edge Cases**:
   - Handle failed payments
   - Trial periods
   - Proration logic

### Current Limitations:
- Subscription status updates require manual database updates or webhook implementation
- No subscription cancellation flow
- No billing portal integration

## 🚀 Ready to Test!

The payment system is fully functional for testing:
- ✅ Usage limits enforced
- ✅ Upgrade button working  
- ✅ Stripe checkout integration
- ✅ User isolation maintained
- ✅ Real-time usage tracking

Just configure your Stripe sandbox credentials and test the complete flow!
