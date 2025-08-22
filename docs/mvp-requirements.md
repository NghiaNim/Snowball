---
description: Snowball MVP requirements and minimum feature set
alwaysApply: false
---
# Snowball MVP Requirements

## MVP Core Philosophy
Build the minimum viable two-sided marketplace that validates the core tribe-based matching concept while providing immediate value to both founders and investors.

## Essential User Flows

### Investor MVP Journey
1. **Onboarding**: Sign up → Set investment preferences → Join one free tribe
2. **Discovery**: Browse tribe deal flow → Filter companies → Track interesting startups
3. **Engagement**: Knock on doors → Schedule meetings → Provide feedback
4. **Conversion**: Upgrade for additional tribes/curated feed

### Founder MVP Journey
1. **Profile Creation**: Sign up → Upload basic materials → Set fundraising status
2. **Discovery**: Get tracked by investors → Receive knocks from interested VCs
3. **Engagement**: Connect with investors → Share traction updates
4. **Conversion**: Close funding round → Update success status

## Minimum Feature Set

### Authentication & User Management
- [ ] Supabase Auth integration
- [ ] User role assignment (Investor/Founder)
- [ ] Basic profile creation
- [ ] Email verification
- [ ] Hard-coded admin authentication (MVP only)

### Admin Panel & Referral System
- [ ] Admin login with hard-coded credentials
- [ ] Referral link generator with custom welcome messages
- [ ] Background color customization (dropdown selection)
- [ ] Separate investor and founder referral links
- [ ] 24-hour link expiration system
- [ ] Custom branded landing pages for referrals
- [ ] Fake signup flow (no validation, quick skip-through)
- [ ] Sample dashboard routing after signup

### Investor Core Features
- [ ] Investment criteria form (geography, stage, industry, check size)
- [ ] Join one tribe (hardcoded options for MVP)
- [ ] Company discovery feed (tribe-filtered)
- [ ] Basic filtering: stage, industry, geography, funding status
- [ ] Track/Untrack companies
- [ ] "Knock" functionality (send meeting request)
- [ ] Simple feedback system (thumbs up/down on deals)

### Founder Core Features
- [ ] Company profile creation
- [ ] Upload pitch deck (Supabase Storage)
- [ ] Basic company info form
- [ ] Fundraising status selector (4 dot system)
- [ ] Traction update form (monthly)
- [ ] View tracking investors
- [ ] Respond to knocks (accept/decline meetings)

### Matching & Discovery
- [ ] Simple recommendation algorithm (tribe + criteria matching)
- [ ] Basic search functionality
- [ ] Company cards with essential info
- [ ] Investor interest signals

### Communication
- [ ] In-app messaging system (basic)
- [ ] Email notifications for knocks and matches
- [ ] Meeting request system

## MVP Database Schema (Core Tables)

### Users
- id, email, role (investor/founder/admin), created_at, profile_complete

### Admin Users (MVP: Hard-coded)
- username, password_hash, created_at (environment variables for MVP)

### Referral Links
- id, link_token, welcome_message, background_color, target_role (investor/founder), created_at, expires_at, is_active

### Referral Signups (Temporary)
- id, referral_link_id, temp_user_data (JSON), completed_at, session_token

### Investor Profiles
- user_id, investment_criteria (JSON), preferred_stages, industries, geographies, check_size_min, check_size_max

### Company Profiles
- user_id, company_name, description, industry, stage, geography, fundraising_status, pitch_deck_url, website, funding_target

### Tribes
- id, name, description, type (accelerator/university/company/etc.)

### Tribe Memberships
- user_id, tribe_id, joined_at

### Tracking
- investor_id, company_id, tracked_at

### Knocks
- id, investor_id, company_id, status (pending/accepted/declined), message, created_at

### Traction Updates
- company_id, month_year, metrics (JSON), notes, created_at

## MVP UI/UX Requirements

### Admin Dashboard
- Hard-coded login form
- Referral link generator interface
- Custom message input field
- Background color dropdown selector
- Generated links display (investor/founder separation)
- Copy-to-clipboard functionality
- Link expiration status

### Investor Dashboard
- Deal flow feed (simple card layout)
- Filter sidebar (basic dropdowns)
- Tracked companies section
- Knock history

### Founder Dashboard
- Profile completion checklist
- Investor interest overview
- Knock notifications
- Traction update form

### Referral Landing Pages
- Custom welcome message display
- Custom background color styling
- Role-specific branding (investor vs founder)
- Quick signup form (fake validation)
- Skip-through navigation

### Shared Components
- User profile cards
- Company profile cards
- Simple search bar
- Navigation header
- Mobile-responsive design

## MVP Constraints & Simplifications

### What to Exclude from MVP
- ❌ Advanced ML recommendation algorithm
- ❌ Multiple tribe memberships (start with one free)
- ❌ Term sheet functionality
- ❌ Syndicate creation
- ❌ Payment processing
- ❌ Advanced analytics dashboard
- ❌ Video calls integration
- ❌ Complex messaging features
- ❌ Detailed investor profiles

### MVP Simplifications
- **Admin Auth**: Hard-coded credentials (no real admin system)
- **Referral System**: Temporary storage, 24-hour expiration only
- **Signup Flow**: Fake validation, no real account creation
- **Tribes**: Start with 3-5 hardcoded options (YC, Stanford, Ex-Google, etc.)
- **Matching**: Simple criteria-based filtering
- **Communication**: Basic messaging + email notifications
- **Payments**: Manual tier management (no Stripe integration yet)
- **Content**: Text + single file uploads only

## Success Metrics for MVP
- **Engagement**: % of investors who track at least 3 companies
- **Activation**: % of founders who complete their profile
- **Connection**: Number of successful knocks (accepted meetings)
- **Retention**: Weekly active users (both sides)
- **Conversion**: Manual upgrade requests to paid tiers

## Launch Strategy
1. **Private Beta**: Invite 25 investors + 50 startups from one tribe (e.g., YC network)
2. **Validation**: Measure core engagement metrics
3. **Iteration**: Improve based on user feedback
4. **Controlled Growth**: Add one tribe at a time
5. **Monetization**: Introduce paid tiers after product-market fit

## Technical MVP Priorities
1. **Core Functionality**: User auth, profiles, basic matching
2. **Data Integrity**: Proper validation, secure file uploads
3. **User Experience**: Responsive design, fast loading
4. **Scalability Foundation**: Clean architecture for future features
5. **Analytics**: Basic tracking for key user actions