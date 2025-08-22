# Snowball

A two-sided platform connecting early-stage startups with investors through curated tribe-based networking.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

## 📋 Project Status

This is the **MVP foundation** with:
- ✅ Modern Next.js 15 setup with TypeScript
- ✅ Tailwind CSS v4 design system
- ✅ Supabase integration structure
- ✅ Landing page with hero and features
- ✅ Authentication page structure
- ✅ Development tools (ESLint, Prettier)

## 🏗️ Architecture

**Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
**Backend**: Supabase (PostgreSQL + Auth + Storage)
**Deployment**: Vercel + Supabase

## 📖 Documentation

See [SETUP.md](./SETUP.md) for detailed setup instructions and development guidelines.

## 🎯 MVP Concept

Snowball connects founders and investors through "tribes" - communities built around:
- Accelerators (Y Combinator, Techstars)
- Universities (Stanford, MIT)
- Companies (Ex-Google, Ex-Meta)
- Geographic regions
- Industry focus areas

**For Founders**: Get discovered by investors who share your network connections
**For Investors**: Access high-quality deal flow through trusted community networks

## 🛠️ Development

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Code linting
npm run type-check   # TypeScript checking
npm run format       # Code formatting
```

## 📁 Project Structure

```
src/
├── app/             # Next.js pages and layouts
├── components/      # Reusable UI components
├── lib/            # Configurations and utilities
├── types/          # TypeScript definitions
└── utils/          # Helper functions
```

## 🚀 Next Steps

1. Set up Supabase database schema
2. Implement user authentication
3. Build investor dashboard
4. Create founder profile system
5. Add tribe selection
6. Implement deal flow matching
