'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

export default function DemoHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Image
                src="/snowball.png"
                alt="Snowball Logo"
                width={32}
                height={32}
                className="mr-3"
              />
              <h1 className="text-2xl font-bold text-gray-900">Snowball Demo</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="sm:h-9 sm:px-4">Back to Main Site</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center lg:pt-32">
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
            Snowball Platform
            <span className="relative whitespace-nowrap text-blue-600">
              <svg
                aria-hidden="true"
                viewBox="0 0 418 42"
                className="absolute top-2/3 left-0 h-[0.58em] w-full fill-blue-300/70"
                preserveAspectRatio="none"
              >
                <path d="m203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
              </svg>
              <span className="relative"> Demo</span>
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
            Experience the Snowball platform through interactive demonstrations. 
            All data shown is fictional for demonstration purposes.
          </p>
          
          {/* Demo Notice */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-500">⚠️</span>
              <div>
                <p className="text-sm text-yellow-700">
                  <strong>Demo Mode:</strong> This is a demonstration environment with sample data. 
                  No real accounts are created and no real actions are performed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Options */}
        <div className="py-16">
          <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:gap-x-12">
            {/* For Investors */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">👨‍💼 Investor Experience</h2>
              <p className="text-lg text-gray-600 mb-6">
                Experience the investor dashboard with curated deal flow and company tracking
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                      ✓
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700">
                    Browse curated startup deal flow
                  </p>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                      ✓
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700">
                    Track companies and send meeting requests
                  </p>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                      ✓
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700">
                    Filter by industry, stage, and tribe connections
                  </p>
                </li>
              </ul>
              <Link href="/demo/dashboard/investor" onClick={(e) => {
                e.preventDefault();
                localStorage.setItem('temp-session', 'demo-investor');
                localStorage.setItem('temp-role', 'investor');
                window.location.href = '/demo/dashboard/investor';
              }}>
                <Button size="lg" className="w-full text-white bg-blue-600 hover:bg-blue-700">
                  Try Investor Demo
                </Button>
              </Link>
            </div>

            {/* For Founders */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🚀 Founder Experience</h2>
              <p className="text-lg text-gray-600 mb-6">
                See how founders manage their fundraising and investor relationships
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                      ✓
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700">
                    Manage company profile and fundraising status
                  </p>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                      ✓
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700">
                    Share monthly updates and traction metrics
                  </p>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                      ✓
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700">
                    Track investor interest and meeting requests
                  </p>
                </li>
              </ul>
              {/* For founder demo, we'll route to a demo signup since it doesn't use temp sessions */}
              <Link href="/demo/dashboard/founder" onClick={(e) => {
                e.preventDefault();
                localStorage.setItem('temp-session', 'demo-founder');
                localStorage.setItem('temp-role', 'founder');
                window.location.href = '/demo/dashboard/founder';
              }}>
                <Button size="lg" className="w-full text-white bg-green-600 hover:bg-green-700">
                  Try Founder Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Admin Demo */}
        <div className="py-16">
          <div className="bg-gray-900 rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-white mb-4">⚙️ Admin Experience</h2>
            <p className="text-lg text-gray-300 mb-6">
              See how administrators can create custom referral links and manage platform templates
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex">
                <div className="flex-shrink-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white">
                    ✓
                  </div>
                </div>
                <p className="ml-3 text-gray-300">
                  Generate custom referral links with branding
                </p>
              </li>
              <li className="flex">
                <div className="flex-shrink-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white">
                    ✓
                  </div>
                </div>
                <p className="ml-3 text-gray-300">
                  Build and manage dashboard templates
                </p>
              </li>
              <li className="flex">
                <div className="flex-shrink-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white">
                    ✓
                  </div>
                </div>
                <p className="ml-3 text-gray-300">
                  Customize content and styling for different audiences
                </p>
              </li>
            </ul>
            <Link href="/demo/admin">
              <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                Try Admin Demo
              </Button>
            </Link>
            <p className="text-sm text-gray-400 mt-2 text-center">
              Sales team access - contact administrator for login
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500">
              &copy; 2024 Snowball Demo Environment. All data is fictional.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
