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

**Production-ready platform** with:
- ✅ Modern Next.js 15 setup with TypeScript
- ✅ Tailwind CSS v4 design system  
- ✅ Complete founder/investor dashboard system
- ✅ AI-powered recommendation engine (BigQuery + OpenAI)
- ✅ Google Cloud integration (Storage + Functions)
- ✅ Pitch deck upload and tracking system
- ✅ Admin panel with demo features
- ✅ Email notifications via Resend

## 🏗️ Architecture

**Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
**Core Platform**: Supabase (PostgreSQL + Auth + Storage)
**AI Recommendations**: Google Cloud (BigQuery + Functions + Storage) + OpenAI
**Deployment**: Vercel + Google Cloud + Supabase

## 📖 Documentation

**[📋 Complete Setup Guide](./docs/setup.md)** - Everything you need to get Snowball running

All documentation is organized in the [`/docs`](./docs/) folder following our documentation standards.

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

1. Real authentication system (replace hardcoded logins)
2. Enhanced user management and onboarding
3. Advanced recommendation algorithms and caching
4. Analytics dashboard and usage tracking
5. Mobile-first responsive improvements
6. Scaled tribe management system
