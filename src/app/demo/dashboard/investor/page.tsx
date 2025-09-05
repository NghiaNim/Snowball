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
  
  // Check if in demo mode
  const [isDemoMode, setIsDemoMode] = useState(false)
  
  useEffect(() => {
    const tempSession = localStorage.getItem('temp-session')
    setIsDemoMode(tempSession === 'demo-investor')
  }, [])

  // Fetch investor credit information (disabled in demo mode)
  const { data: creditsInfo, refetch: refetchCredits, error: creditsError } = api.investor.getCreditsInfo.useQuery(undefined, {
    enabled: !isDemoMode, // Disable in demo mode
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
  
  // Demo credit state
  const [demoCredits, setDemoCredits] = useState(300)
  
  // Demo credit data
  const demoCreditsInfo = {
    credits: demoCredits,
    subscription_tier: 'premium',
    max_credits: 300,
    subscription_expires_at: null
  }
  
  // Use demo data when in demo mode, otherwise use real data
  const finalCreditsInfo = isDemoMode ? demoCreditsInfo : creditsInfo

  // Debug logging
  useEffect(() => {
    console.log('Credits info:', creditsInfo)
    console.log('Credits error:', creditsError)
  }, [creditsInfo, creditsError])
  
  // Tracking functionality
  const [isTrackingSnowball, setIsTrackingSnowball] = useState(false)
  const [isTrackingLoading, setIsTrackingLoading] = useState(false)
  const toggleTrackingMutation = api.investor.toggleTracking.useMutation()

  useEffect(() => {
    checkAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuth = async () => {
    try {
      // Check for demo session first
      const tempSession = localStorage.getItem('temp-session')
      const tempRole = localStorage.getItem('temp-role')
      
      if (tempSession === 'demo-investor' && tempRole === 'investor') {
        // Demo mode - use fake investor data
        setInvestor({
          id: 'demo-investor-id',
          email: 'demo@investor.com',
          investor_name: 'Demo Investor',
          firm_name: 'Demo Ventures',
          title: 'Partner'
        })
        setIsAuthenticated(true)
        setIsTrackingSnowball(false) // Default demo state
        setIsLoading(false)
        return
      }

      // Real authentication flow
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
      // Check if in demo mode
      const tempSession = localStorage.getItem('temp-session')
      
      if (tempSession === 'demo-investor') {
        // Demo mode - just clear demo session and go back to demo home
        localStorage.removeItem('temp-session')
        localStorage.removeItem('temp-role')
        router.push('/demo')
        return
      }

      // Real authentication flow
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleToggleTracking = async () => {
    if (isTrackingLoading) return
    
    // Check if investor has enough credits to track
    if (!isTrackingSnowball && finalCreditsInfo && finalCreditsInfo.credits < 100) {
      alert('Insufficient credits! You need at least 100 credits to track a startup. Please upgrade your subscription.')
      return
    }
    
    setIsTrackingLoading(true)
    
    // Demo mode - just toggle without real API calls
    if (isDemoMode) {
      setTimeout(() => {
        const newTrackingState = !isTrackingSnowball
        setIsTrackingSnowball(newTrackingState)
        
        // Update demo credits
        if (newTrackingState) {
          // Started tracking - deduct 100 credits
          setDemoCredits(200)
          alert('Demo: Successfully started tracking Snowball! You now have 200 credits remaining.')
        } else {
          // Stopped tracking - refund 100 credits
          setDemoCredits(300)
          alert('Demo: You have stopped tracking Snowball. Your credits have been refunded to 300.')
        }
        
        setIsTrackingLoading(false)
      }, 1000)
      return
    }
    
    try {
      // Use Snowball's founder user ID for tracking
      const result = await toggleTrackingMutation.mutateAsync({
        company_id: 'snowball-demo-user'
      })
      
      setIsTrackingSnowball(result.tracked)
      
      // Refresh credits info to show updated balance
      await refetchCredits()
      
      // Show success message
      if (result.tracked) {
        alert(`Successfully started tracking Snowball! Credits remaining: ${result.credits}`)
      } else {
        alert(`Stopped tracking Snowball. Credits refunded: ${result.credits}`)
      }
    } catch (error) {
      console.error('Tracking error:', error)
      alert(error instanceof Error ? error.message : 'Failed to update tracking status')
    } finally {
      setIsTrackingLoading(false)
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
              {/* Credit Display */}
                      <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-blue-700">
            {finalCreditsInfo?.credits || 0} Credits
          </span>
          <span className="text-xs text-blue-600">
            ({finalCreditsInfo?.subscription_tier || 'free'})
          </span>
          <button
            onClick={() => refetchCredits()}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Refresh
          </button>
          <button
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              router.push('/auth/investor/signin')
            }}
            className="text-xs text-red-600 hover:text-red-800 underline ml-2"
          >
            Sign Out
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
              {isLoadingSnowball ? (
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="animate-pulse">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="text-center">
                          <div className="h-6 bg-gray-200 rounded w-16 mx-auto mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-3">
                      <div className="h-10 bg-gray-200 rounded flex-1"></div>
                      <div className="h-10 bg-gray-200 rounded flex-1"></div>
                    </div>
                  </div>
                </div>
              ) : (
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
                        <p className="text-sm text-gray-600">
                          {snowballData?.profile?.description || 'Two-sided marketplace for startups & investors'}
                        </p>
                      </div>
                    </div>
                    {snowballData?.fundraisingStatus && (
                      <Badge 
                        variant="outline" 
                        className={`${fundraisingStatusConfig[snowballData.fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.color} ${fundraisingStatusConfig[snowballData.fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.borderColor}`}
                      >
                        {fundraisingStatusConfig[snowballData.fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.icon} {fundraisingStatusConfig[snowballData.fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.label}
                      </Badge>
                    )}
                  </div>

                  {/* Get latest metrics from the most recent major update */}
                  {snowballData?.updates && snowballData.updates.length > 0 && (
                    (() => {
                      const latestMajorUpdate = snowballData.updates.find(update => update.type === 'major' && update.metrics)
                      const metrics = latestMajorUpdate?.metrics as { mrr?: number; growth?: number; users?: number; retention?: number } || {}
                      
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {metrics.mrr && typeof metrics.mrr === 'number' && (
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">
                                ${(metrics.mrr / 1000).toFixed(0)}K
                              </div>
                              <div className="text-xs text-gray-600">MRR</div>
                            </div>
                          )}
                          {metrics.growth && typeof metrics.growth === 'number' && (
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">
                                +{metrics.growth}%
                              </div>
                              <div className="text-xs text-gray-600">Growth</div>
                            </div>
                          )}
                          {metrics.users && typeof metrics.users === 'number' && (
                            <div className="text-center">
                              <div className="text-lg font-bold text-purple-600">
                                {(metrics.users / 1000).toFixed(0)}K
                              </div>
                              <div className="text-xs text-gray-600">Users</div>
                            </div>
                          )}
                          {metrics.retention && typeof metrics.retention === 'number' && (
                            <div className="text-center">
                              <div className="text-lg font-bold text-yellow-600">
                                {metrics.retention}%
                              </div>
                              <div className="text-xs text-gray-600">Retention</div>
                            </div>
                          )}
                        </div>
                      )
                    })()
                  )}

                  <div className="flex space-x-3">
                    <Link href="/track/snowball">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        View Details
                      </Button>
                    </Link>
                    <Button 
                      variant={isTrackingSnowball ? "destructive" : "outline"}
                      onClick={handleToggleTracking}
                      disabled={isTrackingLoading || (!isTrackingSnowball && finalCreditsInfo && finalCreditsInfo.credits < 100)}
                      className={`${isTrackingLoading ? "opacity-50 cursor-not-allowed" : ""} ${
                        isTrackingSnowball ? "bg-red-600 hover:bg-red-700 text-white" : ""
                      }`}
                    >
                      {isTrackingLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : isTrackingSnowball ? (
                        'Stop Tracking'
                      ) : finalCreditsInfo && finalCreditsInfo.credits < 100 ? (
                        `Need 100 Credits (${finalCreditsInfo.credits} available)`
                      ) : (
                        'Track Startup'
                      )}
                    </Button>
                  </div>
                </div>
              )}
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