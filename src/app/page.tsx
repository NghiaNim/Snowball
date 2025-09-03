'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const scrollToSignup = () => {
    const signupSection = document.getElementById('signup-links');
    if (signupSection) {
      signupSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Snowball</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/demo">
                <Button variant="ghost" size="sm" className="sm:h-9 sm:px-4">Demo</Button>
              </Link>
              <Link href="/auth/founder/signin">
                <Button variant="ghost" size="sm" className="sm:h-9 sm:px-4">Snowball Login</Button>
              </Link>
              <Button size="sm" className="sm:h-9 sm:px-4" onClick={scrollToSignup}>Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center lg:pt-32">
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
            Connect
            <span className="relative whitespace-nowrap text-blue-600">
              <svg
                aria-hidden="true"
                viewBox="0 0 418 42"
                className="absolute top-2/3 left-0 h-[0.58em] w-full fill-blue-300/70"
                preserveAspectRatio="none"
              >
                <path d="m203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
              </svg>
              <span className="relative"> founders</span>
            </span>{' '}
            with{' '}
            <span className="relative whitespace-nowrap text-blue-600">
              <span className="relative">investors</span>
            </span>{' '}
            through curated tribes
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
            Snowball connects early-stage startups with investors through
            tribe-based networking. Join communities built around accelerators,
            universities, companies, and shared experiences.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 sm:gap-x-6" id="signup-links">
            <Link href="https://founder.joinsnowball.io" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="w-full sm:w-auto text-white bg-blue-600 hover:bg-blue-700">I&apos;m a Founder</Button>
            </Link>
            <Link href="https://investor.joinsnowball.io" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-blue-600 border-blue-600 hover:bg-blue-50">
                I&apos;m an Investor
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Sections */}
        <div className="py-16">
          <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:gap-x-12">
            {/* For Founders */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900">For Founders</h2>
              <p className="mt-4 text-lg text-gray-600">
                Get discovered by the right investors through tribe connections
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                      ✓
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700">
                    Create compelling company profiles with pitch decks and
                    traction updates
                  </p>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                      ✓
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700">
                    Get tracked by investors who share your tribe connections
                  </p>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                      ✓
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700">
                    Receive meeting requests from interested VCs and angels
                  </p>
                </li>
              </ul>
            </div>

            {/* For Investors */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900">For Investors</h2>
              <p className="mt-4 text-lg text-gray-600">
                Discover high-quality deal flow through trusted networks
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                      ✓
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700">
                    Access curated startups from your alumni networks and
                    connections
                  </p>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                      ✓
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700">
                    Set investment criteria and get personalized deal
                    recommendations
                  </p>
          </li>
                <li className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                      ✓
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700">
                    Track interesting companies and request meetings directly
                  </p>
          </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tribes Section */}
        <div className="py-16">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Join Your Tribe
          </h2>
          <p className="text-center mt-4 text-lg text-gray-600">
            Connect through communities built around shared experiences
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Y Combinator Alumni',
              'Stanford Network',
              'Ex-Google/Meta',
              'Techstars Community',
              'MIT Connections',
              'Angel Groups',
            ].map((tribe) => (
              <div
                key={tribe}
                className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200"
              >
                <h3 className="font-semibold text-gray-900">{tribe}</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Connect with founders and investors from your network
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500">
              &copy; 2024 Snowball. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}