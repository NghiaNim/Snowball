# Admin Features & Referral System

## Status: ✅ Complete

## Admin Authentication
- **Hard-coded admin login** for MVP phase
- No real authentication validation required for prototype
- Admin credentials should be stored as environment variables
- Simple login form that checks against hard-coded values

## Admin Panel Features

### Referral Link Generator
The core admin tool for creating custom signup experiences.

#### User Flow:
1. **Admin Access**: Admin logs in with hard-coded credentials
2. **Link Creation**: Admin clicks "Generate Referral Links" button
3. **Customization Prompt**: Modal/form appears with:
   - Text input for custom welcome message
   - Dropdown for background color selection (predefined colors)
   - Submit button to generate links
4. **Link Generation**: After submit, display two clearly separated links:
   - **Investor Link**: For investor signups with custom styling
   - **Founder Link**: For founder signups with custom styling
5. **Link Expiration**: Links expire after 24 hours

#### Technical Requirements:
- Generate unique link IDs/tokens for each referral campaign
- Store link data temporarily (24-hour TTL)
- Include custom message and background color in link parameters
- Clear visual separation between investor and founder links
- Copy-to-clipboard functionality for easy sharing

## Referral Landing Pages

### Custom Welcome Experience
When users click referral links, they should see:
- Custom welcome message from admin
- Custom background color
- Role-specific messaging (investor vs founder)
- Clear "Get Started" call-to-action

### Fake Signup Flow
For prototype phase:
- **Quick Signup Form**: Basic fields (name, email, etc.)
- **No Validation Required**: Allow empty or invalid data
- **Skip-Through Capability**: "Next" buttons to quickly advance
- **No Real Account Creation**: Just simulate the flow
- **Immediate Redirect**: Land on appropriate dashboard

## Dashboard Destinations

### Investor Dashboard (Sample)
After completing fake signup, investors see:
- Sample deal flow from MVP requirements
- Mock company cards with fake data
- Basic filtering interface
- Sample tracking functionality

### Founder Dashboard (Sample)
After completing fake signup, founders see:
- Sample profile completion interface
- Mock investor interest indicators
- Fake traction update forms
- Sample "knock" notifications

## Data Storage
- **Temporary Storage**: Use localStorage or simple in-memory storage
- **Link Metadata**: Store custom message, color, creation time, expiration
- **No Persistent Users**: Don't create real user accounts
- **Session Simulation**: Use temporary session tokens

## UI/UX Requirements

### Admin Interface
- Clean, simple admin panel design
- Prominent "Generate Referral Links" button
- Modal/popup for link customization
- Results page with copy-able links
- Basic navigation (logout, home)

### Referral Pages
- Mobile-responsive design
- Custom background colors applied via CSS
- Professional appearance despite being a prototype
- Clear role differentiation (investor vs founder branding)

### Color Options (Dropdown)
Predefined background color options:
- Blue (#3B82F6)
- Green (#10B981)
- Purple (#8B5CF6)
- Orange (#F59E0B)
- Red (#EF4444)
- Gray (#6B7280)

## MVP Phase Constraints
- **No Real Authentication**: Hard-coded admin access only
- **No Database Persistence**: Temporary storage only
- **No Email Integration**: Just link generation
- **No Analytics**: Basic prototype without tracking
- **Fixed Expiration**: 24-hour links without extension options

## Success Criteria
1. Admin can generate custom referral links quickly
2. Links properly redirect to branded signup pages
3. Signup flow is smooth and skippable
4. Users land on appropriate sample dashboards
5. Custom messaging and colors display correctly
6. Links expire after 24 hours

## Implementation Status
- [x] Hard-coded admin login
- [x] Basic admin panel layout
- [x] Referral link generator form
- [x] Link storage and expiration logic
- [x] Custom landing pages for referrals
- [x] Fake signup flow
- [x] Sample dashboard content
- [x] Visual customization (colors, messages)

## Implementation Notes
- **Admin Login**: Located at `/admin` with credentials: `admin / snowball123`
- **tRPC Integration**: Full type-safe API with Zod validation
- **Temporary Storage**: In-memory storage with 24-hour expiration
- **Link Generation**: Creates unique investor and founder referral links
- **Custom Styling**: Dynamic background colors and welcome messages
- **Sample Dashboards**: Rich demo interfaces for both user types
