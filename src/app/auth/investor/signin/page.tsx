'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'

export default function InvestorSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (data.user) {
        // Check if user has investor profile
        const { data: investor, error: investorError } = await supabase
          .from('investors')
          .select('*')
          .eq('user_id', data.user.id)
          .single()

        if (investorError || !investor) {
          setError('No investor profile found. Please sign up as an investor.')
          await supabase.auth.signOut()
          return
        }

        // Redirect to investor dashboard or the page they came from
        const urlParams = new URLSearchParams(window.location.search)
        const returnTo = urlParams.get('returnTo')
        router.push(returnTo || '/dashboard/investor')
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
          <Image
            src="/snowball.png"
            alt="Snowball Logo"
            width={48}
            height={48}
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to Snowball
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Investor Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in to your investor account to track companies and manage your deal flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  placeholder="Enter your password"
                />
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link 
                    href="/auth/investor/signup" 
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Sign up here
                  </Link>
                </p>
              </div>

              <div className="text-center">
                <Link 
                  href="/auth/founder/signin" 
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Are you a founder? Sign in here
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
