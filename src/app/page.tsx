'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { api } from '@/lib/trpc/client'
import { useState, useEffect } from 'react'

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem('snowball-auth')
      const userEmail = localStorage.getItem('snowball-user-email')
      const userId = localStorage.getItem('snowball-user-id')
      
      if (authData === 'true' && userEmail) {
        setUserEmail(userEmail)
        setUserId(userId)
      }
    }

    checkAuth()
    
    // Listen for auth changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'snowball-auth' || e.key === 'snowball-user-email') {
        checkAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Track pricing interactions
  const trackPricingInteraction = api.tracking.trackPricingInteraction.useMutation()

  const handlePricingButtonClick = async (tierName: string, buttonText: string) => {
    try {
      await trackPricingInteraction.mutateAsync({
        user_id: userId || undefined,
        user_email: userEmail || undefined,
        tier_name: tierName,
        action: 'clicked_button',
        button_text: buttonText,
        metadata: {
          page: 'landing',
          timestamp: new Date().toISOString(),
        }
      })
    } catch (error) {
      console.error('Failed to track pricing interaction:', error)
    }
  }

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
              <button onClick={() => scrollToSection('features')} className="text-gray-900 hover:text-gray-700 transition-colors font-medium">
                Features
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-900 hover:text-gray-700 transition-colors font-medium">
                Pricing
              </button>
              <Link href="/auth/founder/signin">
                <Button variant="ghost" size="sm" className="text-gray-900 hover:text-gray-700 font-medium">Login</Button>
              </Link>
              <Link href="/demo">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Demo</Button>
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="flex items-center space-x-2 md:hidden">
              <Link href="/auth/founder/signin">
                <Button variant="ghost" size="sm" className="text-xs px-2">Login</Button>
              </Link>
              <Link href="/demo">
                <Button size="sm" className="text-xs px-2 bg-blue-600 hover:bg-blue-700 text-white">
                  Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-16 pb-16 text-center md:pt-24 md:pb-20 lg:pt-32">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              AI-Native Fundraising Platform for
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
                  Get discovered by and build relationships with the right investors for you
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
                    <p className="ml-3 text-gray-700">Send updates and build trust with investors so they&apos;re ready to invest when you&apos;re ready to raise</p>
                </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-700">Receive curated investor matches who are actively investing in companies like yours</p>
                </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-700">Manage and grow your entire investor network so you have access to capital at every stage</p>
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
                  Discover, track, engage with, and invest in the startups that interest you the most
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
                    <p className="ml-3 text-gray-700">Get on the cap table by staying updated and engaged with your most promising opportunities</p>
                </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-700">Build conviction in new opportunities by seeing how the founders execute and move the business forward</p>
          </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-700">Receive curated startups from trusted ecosystems that match your investment thesis</p>
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
              Pricing Tiers
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Start with 300 free credits to track 3 startups. Choose the plan that fits your deal flow needs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-6 max-w-7xl mx-auto px-4">
            {/* Free Tier */}
            <Card className="relative border-2 border-gray-200 flex flex-col">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl text-gray-900">Free</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600 ml-1">/month</span>
                </div>
                <CardDescription className="mt-2">Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col flex-grow">
                <ul className="space-y-3 mb-6 flex-grow">
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
                    <span className="text-gray-700">Track 3 startups</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Join 1 tribe <span className="text-xs text-gray-500">(coming soon)</span></span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-auto" 
                  variant="outline"
                  onClick={() => handlePricingButtonClick('Free', 'Get Started')}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Basic Tier */}
            <Card className="relative border-2 border-blue-500 shadow-lg flex flex-col">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-3 py-1">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl text-gray-900">Basic</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$99</span>
                  <span className="text-gray-600 ml-1">/month</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  or $79/month annually <span className="text-green-600 font-medium">(Save 20%)</span>
                </div>
                <CardDescription className="mt-2">For active angel investors</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col flex-grow">
                <ul className="space-y-3 mb-6 flex-grow">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">1,000 credits included + 300 free credits</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Track 13 startups at any given time</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Join 3 tribes + 1 free tribe <span className="text-xs text-gray-500">(coming soon)</span></span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">AI curated deal flow 1/month <span className="text-xs text-gray-500">(coming soon)</span></span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-auto bg-blue-600 hover:bg-blue-700"
                  onClick={() => handlePricingButtonClick('Basic', 'Choose Basic')}
                >
                  Choose Basic
                </Button>
              </CardContent>
            </Card>

            {/* Professional Tier */}
            <Card className="relative border-2 border-gray-200 flex flex-col">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl text-gray-900">Professional</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$499</span>
                  <span className="text-gray-600 ml-1">/month</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  or $399/month annually <span className="text-green-600 font-medium">(Save 20%)</span>
                </div>
                <CardDescription className="mt-2">For VCs and family offices</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col flex-grow">
                <ul className="space-y-3 mb-6 flex-grow">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">5,000 credits included + 300 free credits</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Track 53 startups at any given time</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Join 15 tribes + 1 free tribe <span className="text-xs text-gray-500">(coming soon)</span></span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">AI curated deal flow 1/week <span className="text-xs text-gray-500">(coming soon)</span></span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-auto" 
                  variant="outline"
                  onClick={() => handlePricingButtonClick('Professional', 'Choose Professional')}
                >
                  Choose Professional
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card className="relative border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 flex flex-col">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl text-gray-900">Enterprise</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">Call for pricing</span>
                </div>
                <CardDescription className="mt-2">For institutional investors</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col flex-grow">
                <ul className="space-y-3 mb-6 flex-grow">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Unlimited Credits</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Unlimited Tracking</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Unlimited Tribes <span className="text-xs text-gray-500">(coming soon)</span></span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">AI curated deal flow 1/day <span className="text-xs text-gray-500">(coming soon)</span></span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Advanced startup insights</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Dedicated Support</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Custom Integrations</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Advanced Analytics</span>
                  </li>
                </ul>
                <a href="mailto:pete@joinsnowball.io">
                  <Button 
                    className="w-full mt-auto bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => handlePricingButtonClick('Enterprise', 'Contact Sales')}
                  >
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 sm:gap-6">
            {[
              'Universities and Colleges',
              'Accelerators & Incubators',
              'Corporate Alumni',
              'Angel Groups',
              'Other Entrepreneurial Ecosystems',
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