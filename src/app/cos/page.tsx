'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import Typed from 'typed.js'

export default function ChiefOfStaffPage() {
  const typedRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (typedRef.current) {
      const typed = new Typed(typedRef.current, {
        strings: ['Maximize your connections', 'Maximize your time', 'Maximize your ROI'],
        typeSpeed: 60,
        backSpeed: 40,
        backDelay: 1500,
        startDelay: 300,
        loop: true,
        showCursor: false,
        smartBackspace: true,
      })

      return () => {
        typed.destroy()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
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
              <h1 className="text-xl md:text-2xl font-bold text-white">Snowball</h1>
            </div>
            
            {/* Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800 font-medium">
                  Back to Main
                </Button>
              </Link>
              <Link href="/auth/founder/signin">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800 font-medium">
                  Login
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                  Demo
                </Button>
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="flex items-center space-x-2 md:hidden">
              <Link href="/auth/founder/signin">
                <Button variant="ghost" size="sm" className="text-xs px-2 text-gray-300 hover:text-white">
                  Login
                </Button>
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
          <div className="max-w-5xl mx-auto">
            {/* Main Headline */}
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-8xl mb-8 leading-tight">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 mt-2">
                Meet the right people
              </span>
            </h1>

            {/* Dynamic Text Section */}
            <div className="mb-16">
              <div className="text-center">
                <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-2 text-4xl md:text-5xl lg:text-6xl font-bold text-gray-100 mb-4 leading-tight">
                  <span 
                    ref={typedRef}
                    className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 text-center"
                  >
                  </span>
                </div>
                <div className="mx-auto mt-4 w-48 md:w-64 lg:w-80 h-[2px] bg-gray-700/40 rounded-full data-stream"></div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <a href="https://forms.gle/uocZz7Et3UjfkGGT7" target="_blank" rel="noopener noreferrer">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto h-14 px-12 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xl font-medium rounded-lg border-0 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
                >
                  Apply Now
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {[
              {
                title: 'Identify',
                description: 'Quickly prioritize who you want to meet in advance of any event, conference, or trip',
                icon: '🎯'
              },
              {
                title: 'Outreach',
                description: 'Proactively invite them to set aside time to connect',
                icon: '📧'
              },
              {
                title: 'Schedule',
                description: 'Ensure your calendar is always filled with meetings that will move you forward',
                icon: '📅'
              },
              {
                title: 'Maximize ROI',
                description: 'Get the most out of your time and investment with others',
                icon: '📈'
              }
            ].map((feature) => (
              <div 
                key={feature.title}
                className="group p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-gray-600 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to maximize your time meeting the right people
            </h2>
            <a href="https://forms.gle/uocZz7Et3UjfkGGT7" target="_blank" rel="noopener noreferrer">
              <Button 
                size="lg" 
                className="h-14 px-12 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xl font-medium rounded-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
              >
                Apply Now
              </Button>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/80 border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="md:order-1">
            <p className="text-center text-xs leading-5 text-gray-400">
              &copy; 2024 Snowball. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
