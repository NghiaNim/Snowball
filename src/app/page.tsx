'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:py-6">
            <div className="flex items-center">
              <Image
                src="/snowball.png"
                alt="Snowball Logo"
                width={32}
                height={32}
                className="mr-3"
              />
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Snowball</h1>
            </div>
            
            {/* Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </button>
              <Link href="/demo">
                <Button variant="ghost" size="sm">Demo</Button>
              </Link>
              <Link href="/auth/founder/signin">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Button size="sm" onClick={() => scrollToSection('signup-links')}>Get Started</Button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex items-center space-x-2 md:hidden">
              <Link href="/demo">
                <Button variant="ghost" size="sm" className="text-xs px-2">Demo</Button>
              </Link>
              <Button size="sm" className="text-xs px-2" onClick={() => scrollToSection('signup-links')}>
                Start
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-16 pb-16 text-center md:pt-24 md:pb-20 lg:pt-32">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              AI-Native Platform for
              <span className="block text-blue-600 mt-2">Early Stage Venture</span>
          </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Snowball enables early stage venture investors and startups to source, connect, track, and engage with each other through the entrepreneurial ecosystems they trust most.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4" id="signup-links">
              <Link href="/auth/founder/signin">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-white bg-blue-600 hover:bg-blue-700 text-lg">
                  I&apos;m a Founder
                </Button>
            </Link>
              <Link href="/auth/investor/signin">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-blue-600 border-blue-600 hover:bg-blue-50 text-lg">
                I&apos;m an Investor
              </Button>
            </Link>
          </div>
        </div>
        </div>

        {/* How It Works Section */}
        <div className="py-16 md:py-20" id="features">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Snowball Works
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Rather than juggling different portals, newsletters, and spreadsheets, Snowball lets you track progress and engage with your most promising opportunities in one place.
            </p>
        </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
            {/* For Founders */}
            <Card className="p-8 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl text-gray-900">For Founders</CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Get discovered by the right investors through your trusted networks
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-700">Create compelling profiles with pitch decks and real-time traction updates</p>
                </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-700">Get tracked by investors from your accelerator, university, or company alumni networks</p>
                </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-700">Receive meeting requests and build relationships with interested investors</p>
                </li>
              </ul>
              </CardContent>
            </Card>

            {/* For Investors */}
            <Card className="p-8 border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-6">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl text-gray-900">For Investors</CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Discover high-quality deal flow through your trusted entrepreneurial ecosystems
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-700">Access curated startups from your alumni networks and trusted connections</p>
                </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-700">Track interesting companies with a credit-based system for efficient deal management</p>
          </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-700">Set investment criteria and receive AI-powered deal recommendations</p>
                  </li>
                </ul>
              </CardContent>
            </Card>
                    </div>
                  </div>

        {/* Pricing Section */}
        <div className="py-16 md:py-20 bg-gray-50 rounded-3xl" id="pricing">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Credit-Based Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Pay only for what you track. Start with 100 free credits, then choose the plan that fits your deal flow needs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-6 max-w-7xl mx-auto px-4">
            {/* Free Tier */}
            <Card className="relative border-2 border-gray-200">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl text-gray-900">Free</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600 ml-1">/month</span>
                </div>
                <CardDescription className="mt-2">Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">100 credits included</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Track 1 startup</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Basic tribe access</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline">Get Started</Button>
              </CardContent>
            </Card>

            {/* Premium Tier */}
            <Card className="relative border-2 border-blue-500 shadow-lg">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-3 py-1">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl text-gray-900">Premium</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$19.99</span>
                  <span className="text-gray-600 ml-1">/month</span>
                </div>
                <CardDescription className="mt-2">For active angel investors</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">300 credits included</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Track up to 3 startups</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Priority tribe access</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">AI recommendations</span>
                  </li>
                </ul>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Choose Premium</Button>
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card className="relative border-2 border-gray-200">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl text-gray-900">Enterprise</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$49.99</span>
                  <span className="text-gray-600 ml-1">/month</span>
                </div>
                <CardDescription className="mt-2">For VCs and family offices</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">1,000 credits included</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Track up to 10 startups</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">All tribe access</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Advanced analytics</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline">Choose Enterprise</Button>
              </CardContent>
            </Card>

            {/* Custom Tier */}
            <Card className="relative border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl text-gray-900">Custom</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">Custom</span>
                </div>
                <CardDescription className="mt-2">For institutional investors</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Unlimited credits</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Unlimited tracking</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Dedicated support</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Custom integrations</span>
          </li>
              </ul>
                <a href="mailto:pete@joinsnowball.io">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    Contact Sales
                  </Button>
                </a>
              </CardContent>
            </Card>
            </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 text-sm">
              Credits are used when you track a startup (100 credits) and refunded when you untrack.
            </p>
          </div>
        </div>

        {/* Tribes Section */}
        <div className="py-16 md:py-20">
          <h2 className="text-center text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Join Your Tribe
          </h2>
          <p className="text-center text-lg text-gray-600 px-4 mb-12 max-w-3xl mx-auto">
            Connect through communities built around shared experiences and trusted networks
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 sm:gap-6">
            {[
              'Y Combinator Alumni',
              'Stanford Network',
              'Ex-Google/Meta',
              'Techstars Community',
              'MIT Connections',
              'Angel Groups',
            ].map((tribe) => (
              <Card key={tribe} className="text-center p-4 hover:shadow-lg transition-shadow">
                <CardContent className="pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{tribe}</h3>
                  <p className="text-xs text-gray-600">
                    Connect with your network
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="md:order-1">
            <p className="text-center text-xs leading-5 text-gray-500">
              &copy; 2024 Snowball. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}