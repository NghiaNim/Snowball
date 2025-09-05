'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function InvestorDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [investor, setInvestor] = useState<{ id: string; email?: string; investor_name?: string; firm_name?: string; title?: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/investor/signin')
        return
      }

      // Get investor profile
      const { data: investorProfile } = await supabase
        .from('investors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!investorProfile) {
        router.push('/auth/investor/signin')
        return
      }

      setInvestor(investorProfile)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/auth/investor/signin')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !investor) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Investor Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {investor.investor_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {investor.firm_name && `${investor.firm_name} • `}
                {investor.title || 'Investor'}
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Snowball</CardTitle>
              <CardDescription>
                Your personalized investor dashboard for tracking high-potential startups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">1</div>
                  <div className="text-sm text-gray-600">Companies Tracking</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">Active Conversations</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-600">Investments Made</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Featured Company */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Opportunity</CardTitle>
              <CardDescription>
                High-potential startups in our curated deal flow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Image
                      src="/snowball.png"
                      alt="Snowball Logo"
                      width={48}
                      height={48}
                      className="rounded-lg"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">Snowball</h3>
                      <p className="text-sm text-gray-600">Two-sided marketplace for startups & investors</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    🟢 Active Fundraising
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">$140K</div>
                    <div className="text-xs text-gray-600">MRR</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">+12%</div>
                    <div className="text-xs text-gray-600">Growth</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">15K</div>
                    <div className="text-xs text-gray-600">Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">94%</div>
                    <div className="text-xs text-gray-600">Retention</div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Link href="/track/snowball">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      View Details
                    </Button>
                  </Link>
                  <Button variant="outline">
                    Request Meeting
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks for investors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/track/snowball">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <span className="text-2xl mb-1">🎯</span>
                    <span className="text-sm">Track Companies</span>
                  </Button>
                </Link>
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center" disabled>
                  <span className="text-2xl mb-1">💬</span>
                  <span className="text-sm">Messages</span>
                </Button>
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center" disabled>
                  <span className="text-2xl mb-1">📊</span>
                  <span className="text-sm">Portfolio</span>
                </Button>
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center" disabled>
                  <span className="text-2xl mb-1">⚙️</span>
                  <span className="text-sm">Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Demo Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-blue-500">ℹ️</span>
              <div>
                <p className="text-sm text-blue-700">
                  <strong>Demo Mode:</strong> This is a demonstration of the investor dashboard. 
                  In the full platform, you would see your tracked companies, messages, and investment opportunities here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}