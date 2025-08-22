# Snowball Development Setup

## Project Overview
Snowball is a two-sided platform that connects early-stage startups with investors through tribe-based networking. This MVP includes the basic foundation with a landing page and authentication structure.

## Tech Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Development**: ESLint, Prettier, TypeScript strict mode
- **Deployment**: Vercel (frontend) + Supabase (backend)

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy the environment variables:
```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual values:
- **Supabase**: Create a project at https://supabase.com and get your URL and keys
- **Resend**: Get API key from https://resend.com (for email)
- **Stripe**: Get keys from https://stripe.com (for future payments)

### 3. Development Commands

```bash
# Start development server with Turbopack (default, faster)
npm run dev

# Start development server with Webpack (fallback if needed)
npm run dev:webpack

# Lint code
npm run lint

# Check linting without fixing
npm run lint:check

# Format code with Prettier
npm run format

# Check formatting
npm run format:check

# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── auth/           # Authentication pages
│   ├── globals.css     # Global styles with design system
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Landing page
├── components/          # Reusable React components
│   └── ui/             # Base UI components (Button, Input)
├── lib/                # Utility functions and configurations
│   └── supabase/       # Supabase client configurations
├── types/              # TypeScript type definitions
├── utils/              # Helper functions
└── middleware.ts       # Next.js middleware for auth
```

## Current Implementation Status

### ✅ Completed
- [x] Next.js 15 project setup with TypeScript
- [x] Tailwind CSS v4 with custom design system
- [x] ESLint + Prettier configuration
- [x] Supabase integration structure
- [x] Basic UI components (Button, Input)
- [x] Landing page with hero section and features
- [x] Authentication page structure
- [x] Project structure and organization
- [x] Development environment testing

### 🔄 Next Steps (Not Yet Implemented)
- [ ] Supabase database schema setup
- [ ] User authentication with Supabase Auth
- [ ] User profile creation flow
- [ ] Investor dashboard
- [ ] Founder dashboard
- [ ] Company profile management
- [ ] Tribe selection and membership
- [ ] Deal flow and matching system
- [ ] Knock (meeting request) functionality
- [ ] Messaging system
- [ ] File upload for pitch decks

## Development Guidelines

### Code Style
- Use TypeScript with strict mode
- Follow Next.js App Router conventions
- Use Tailwind CSS utilities over custom CSS
- Implement proper error handling
- Use Zod for data validation (when needed)

### Component Organization
- Keep components small and focused
- Use the `cn()` utility for className merging
- Prefer server components by default
- Use client components only when necessary

### Database Design
The MVP database schema includes:
- Users (with role: investor/founder)
- Investor profiles (criteria, preferences)
- Company profiles (basic info, fundraising status)
- Tribes (communities/networks)
- Tribe memberships
- Tracking (investor interest in companies)
- Knocks (meeting requests)
- Traction updates

## Available URLs

- **Landing Page**: http://localhost:3000
- **Sign Up**: http://localhost:3000/auth/signup
- **Sign In**: http://localhost:3000/auth/signin

## MVP Features by User Type

### Investors
- Join tribes (accelerators, universities, companies)
- Set investment criteria
- Browse tribe deal flow
- Track interesting companies
- Send meeting requests ("knocks")

### Founders
- Create company profiles
- Upload pitch decks
- Set fundraising status
- Receive investor interest
- Respond to meeting requests

## Contributing

1. Follow the existing code style
2. Run linting and type checking before commits
3. Test the build process
4. Update documentation as needed

## Support

For development questions or issues, refer to:
- Next.js documentation: https://nextjs.org/docs
- Supabase documentation: https://supabase.com/docs
- Tailwind CSS documentation: https://tailwindcss.com/docs
