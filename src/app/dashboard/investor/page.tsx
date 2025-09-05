'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/trpc/client'

// Fundraising status configuration
const fundraisingStatusConfig = {
  not_fundraising: {
    label: 'Not Fundraising',
    icon: '⚪',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  preparing_to_raise: {
    label: 'Preparing to Raise',
    icon: '🟡',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  actively_fundraising: {
    label: 'Active Fundraising',
    icon: '🟢',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
}

export default function InvestorDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [investor, setInvestor] = useState<{ id: string; email?: string; investor_name?: string; firm_name?: string; title?: string } | null>(null)
  const router = useRouter()

  // Fetch real Snowball data
  const { data: snowballData, isLoading: isLoadingSnowball } = api.company.getSnowballData.useQuery()
  
  // Fetch investor credit information
  const { data: creditsInfo, refetch: refetchCredits } = api.investor.getCreditsInfo.useQuery(undefined, {
    enabled: isAuthenticated, // Only fetch if authenticated
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false, // Don't retry on auth errors
  })
  
  // Tracking functionality
  const [isTrackingSnowball, setIsTrackingSnowball] = useState(false)
  const [isTrackingLoading, setIsTrackingLoading] = useState(false)
  const toggleTrackingMutation = api.investor.toggleTracking.useMutation()

  // Check authentication and load investor data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Get investor profile
          const { data: investorData } = await supabase
            .from('investors')
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          if (investorData) {
            setInvestor(investorData)
            setIsAuthenticated(true)
            
            // Check if tracking Snowball
            const { data: tracking } = await supabase
              .from('founder_investor_relationships')
              .select('id, status')
              .eq('founder_id', 'f497a07f-18e7-45ad-a531-03a27c0a05ba') // Snowball founder ID
              .eq('investor_id', investorData.id)
              .eq('relationship_type', 'tracking')
              .single()
            
            if (tracking && tracking.status === 'active') {
              setIsTrackingSnowball(true)
            }
          } else {
            // Redirect to sign up if no investor profile
            router.push('/auth/investor/signup')
          }
        } else {
          // Redirect to sign in if not authenticated
          router.push('/auth/investor/signin')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/auth/investor/signin')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])


  const handleToggleTracking = async () => {
    if (!creditsInfo || (creditsInfo.credits < 100 && !isTrackingSnowball)) {
      alert('Insufficient credits. Please upgrade your subscription to track more startups.')
      return
    }

    setIsTrackingLoading(true)
    try {
      const result = await toggleTrackingMutation.mutateAsync({
        company_id: 'f497a07f-18e7-45ad-a531-03a27c0a05ba' // Snowball founder ID
      })

      setIsTrackingSnowball(result.tracked)
      
      // Refetch credits to update the UI
      await refetchCredits()
      
      if (result.tracked) {
        alert(`Successfully started tracking Snowball! You now have ${result.credits} credits remaining.`)
      } else {
        alert(`You have stopped tracking Snowball. Your credits have been refunded to ${result.credits}.`)
      }
    } catch (error: unknown) {
      console.error('Error toggling tracking:', error)
      if (error instanceof Error && error.message.includes('Insufficient credits')) {
        alert('Insufficient credits. Please upgrade your subscription to track more startups.')
      } else {
        alert('Failed to toggle tracking. Please try again.')
      }
    } finally {
      setIsTrackingLoading(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/investor/signin')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !investor) {
    return null // Will redirect
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
              {/* Credit Display */}
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700">
                  {creditsInfo?.credits || 0} Credits
                </span>
                <span className="text-xs text-blue-600">
                  ({creditsInfo?.subscription_tier || 'free'})
                </span>
                <button
                  onClick={() => refetchCredits()}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Refresh
                </button>
              </div>
              
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Featured Opportunity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">Featured Opportunity</CardTitle>
                  <CardDescription>High-potential startup in your investment focus</CardDescription>
                </div>
                <Link href="/track/snowball">
                  <Button variant="outline" size="sm">
                    View Details →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSnowball ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Snowball</h3>
                      <p className="text-gray-600 text-sm">Two-sided marketplace for startups & investors</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {snowballData?.fundraisingStatus ? (
                        <Badge 
                          variant="outline" 
                          className={`${fundraisingStatusConfig[snowballData.fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.color} ${fundraisingStatusConfig[snowballData.fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.borderColor}`}
                        >
                          {fundraisingStatusConfig[snowballData.fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.icon} {fundraisingStatusConfig[snowballData.fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          🟢 Active Fundraising
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Display latest metrics if available */}
                  {snowballData?.updates && snowballData.updates.length > 0 && (() => {
                    const latestMajorUpdate = snowballData.updates
                      .filter(update => update.type === 'major' && update.metrics)
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                    
                    const metrics = latestMajorUpdate?.metrics as { mrr?: number; growth?: number; users?: number; retention?: number }
                    
                    return metrics ? (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                        {typeof metrics.mrr === 'number' && (
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">
                              ${(metrics.mrr / 1000).toFixed(0)}K
                            </div>
                            <div className="text-xs text-gray-600">MRR</div>
                          </div>
                        )}
                        {typeof metrics.growth === 'number' && (
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">
                              +{metrics.growth}%
                            </div>
                            <div className="text-xs text-gray-600">Growth</div>
                          </div>
                        )}
                        {typeof metrics.users === 'number' && (
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">
                              {(metrics.users / 1000).toFixed(1)}K
                            </div>
                            <div className="text-xs text-gray-600">Users</div>
                          </div>
                        )}
                        {typeof metrics.retention === 'number' && (
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">
                              {metrics.retention}%
                            </div>
                            <div className="text-xs text-gray-600">Retention</div>
                          </div>
                        )}
                      </div>
                    ) : null
                  })()}

                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-gray-600">
                      B2B SaaS • Seed Stage • San Francisco, CA
                    </div>
                    <div className="flex space-x-2">
                      {isTrackingSnowball ? (
                        <Button 
                          variant="outline" 
                          onClick={handleToggleTracking}
                          disabled={isTrackingLoading}
                          size="sm"
                        >
                          {isTrackingLoading ? 'Processing...' : '👀 Stop Tracking'}
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleToggleTracking}
                          disabled={isTrackingLoading || !creditsInfo || creditsInfo.credits < 100}
                          size="sm"
                        >
                          {isTrackingLoading ? 'Processing...' : 
                           (!creditsInfo || creditsInfo.credits < 100) ? 
                           `Need 100 Credits (${creditsInfo?.credits || 0} available)` : 
                           'Track Startup'
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Activity</CardTitle>
              <CardDescription>Investment tracking overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Available Credits</span>
                  <span className="font-semibold">{creditsInfo?.credits || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subscription Tier</span>
                  <span className="font-semibold capitalize">{creditsInfo?.subscription_tier || 'free'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Companies Tracking</span>
                  <span className="font-semibold">{isTrackingSnowball ? 1 : 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>Upgrade for more credits and features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Current Plan: <span className="font-semibold capitalize">{creditsInfo?.subscription_tier || 'free'}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Credit Limit: <span className="font-semibold">{creditsInfo?.max_credits || 100}</span>
                </div>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    View Pricing Plans
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
