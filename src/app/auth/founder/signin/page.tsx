'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'

export default function FounderSignIn() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Simple username/password check for Snowball demo
      if (username === 'snowball' && password === 'llabwons2025') {
        // Store auth state for Snowball founder
        localStorage.setItem('snowball-auth', 'true')
        localStorage.setItem('snowball-user-email', 'snowball@demo.com')
        localStorage.setItem('snowball-user-id', 'snowball-demo-user')
        localStorage.setItem('snowball-login-time', Date.now().toString())
        
        // Redirect to founder dashboard
        router.push('/dashboard/founder')
      } else {
        setError('Invalid username or password.')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

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
          Founder Sign In
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to your founder account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your founder dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Enter password"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Waitlist Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  New to Snowball?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Join our founder waitlist to be notified when new registrations open
                </p>
                <a 
                  href="https://founder.joinsnowball.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block w-full"
                >
                  <Button variant="outline" className="w-full">
                    Join Founder Waitlist
                  </Button>
                </a>
              </div>
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
