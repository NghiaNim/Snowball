'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'

export default function FounderSignIn() {

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/snowball.png"
              alt="Snowball Logo"
              width={40}
              height={40}
              className="mr-3"
            />
            <span className="text-2xl font-bold text-gray-900">Snowball</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Founder Sign Up
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join the waitlist to be notified when founder registration opens
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Founder Registration Coming Soon</CardTitle>
            <CardDescription>
              We&apos;re building something amazing for founders. Join our waitlist to be the first to know when we launch!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl mb-6">🚀</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Join the Founder Waitlist
              </h3>
              <p className="text-gray-600 mb-6">
                Be among the first founders to experience Snowball&apos;s AI-powered fundraising platform.
              </p>
              <a 
                href="https://founder.joinsnowball.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Join Waitlist at founder.joinsnowball.io
                </Button>
              </a>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-blue-600 hover:text-blue-500">
                ← Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
