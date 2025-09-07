'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { api } from '@/lib/trpc/client'
import { createClient } from '@/lib/supabase/client'

// Sample Snowball data (would come from database in real app)
const snowballData = {
  company: {
    name: 'Snowball',
    description: 'Two-sided marketplace connecting early-stage startups with investors through tribe-based networking. Leveraging communities built around accelerators, universities, and companies for high-quality deal flow.',
    industry: 'B2B SaaS - Marketplace',
    stage: 'Seed',
    location: 'San Francisco, CA',
    fundingTarget: '$2,000,000',
    website: 'https://joinsnowball.io',
    founded: '2024',
    team: [
      { name: 'CEO', role: 'Co-founder & CEO' },
      { name: 'CTO', role: 'Co-founder & CTO' }
    ]
  },
  metrics: {
    current: {
      mrr: 140000,
      growth: 12,
      users: 15000,
      retention: 94
    }
  },
  fundraising: {
    status: 'active',
    target: 2000000,
    raised: 0,
    stage: 'Seed'
  }
}

// These will be fetched from the database via tRPC

const updateTypeConfig = {
  major: { 
    color: 'red', 
    label: 'Major Update', 
    icon: '📧',
    bgColor: 'bg-red-50 border-red-200'
  },
  minor: { 
    color: 'blue', 
    label: 'Minor Update', 
    icon: '📝',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  coolsies: { 
    color: 'green', 
    label: 'Coolsies', 
    icon: '💭',
    bgColor: 'bg-green-50 border-green-200'
  }
}

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

export default function SnowballTrackingPage() {
  const [isTracking, setIsTracking] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const router = useRouter()

  // Fetch real Snowball data using tRPC
  const { data: snowballRealData, isLoading } = api.company.getSnowballData.useQuery()
  
  // Fetch investor credit information if authenticated
  const { data: creditsInfo, refetch: refetchCredits } = api.investor.getCreditsInfo.useQuery(undefined, {
    enabled: isAuthenticated, // Only fetch if user is authenticated
    refetchOnMount: true,
  })

  // tRPC mutation for tracking with credit system
  const toggleTrackingMutation = api.investor.toggleTracking.useMutation()
  
  const updates = snowballRealData?.updates || []
  const pitchDeck = snowballRealData?.pitchDeck || null
  const profile = snowballRealData?.profile || null
  const team = snowballRealData?.team || []
  const fundraisingStatus = snowballRealData?.fundraisingStatus || null

  // Check authentication and tracking status
  useEffect(() => {
    checkAuthStatus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuthStatus = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        setIsAuthenticated(true)
        
        // Check if this user is tracking Snowball
        await checkTrackingStatus(user.email || '')
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthenticated(false)
    } finally {
      setIsCheckingAuth(false)
    }
  }

  const checkTrackingStatus = async (email: string) => {
    try {
      const supabase = createClient()
      
      // Get investor by email
      const { data: investor } = await supabase
        .from('investors')
        .select('id, user_id')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (!investor) return

      // Get Snowball's founder ID
      const { data: snowballFounder } = await supabase
        .from('founders')
        .select('id')
        .eq('user_id', 'snowball-demo-user')
        .single()

      if (!snowballFounder) return

      // Check if tracking relationship exists
      const { data: tracking } = await supabase
        .from('founder_investor_relationships')
        .select('id, status')
        .eq('founder_id', snowballFounder.id)
        .eq('investor_id', investor.id)
        .eq('relationship_type', 'tracking')
        .single()

      setIsTracking(!!tracking && tracking.status === 'active')
    } catch (error) {
      console.error('Error checking tracking status:', error)
    }
  }

  const handleStartTracking = () => {
    if (!isAuthenticated) {
      // Redirect to sign in with return URL
      const returnUrl = encodeURIComponent(window.location.pathname)
      router.push(`/auth/investor/signin?returnTo=${returnUrl}`)
      return
    }
    
    // If authenticated, start tracking immediately
    startTracking()
  }

  const startTracking = async () => {
    if (!user?.email) return

    try {
      // Use tRPC mutation with credit system
      const result = await toggleTrackingMutation.mutateAsync({
        company_id: 'f497a07f-18e7-45ad-a531-03a27c0a05ba' // Snowball founder ID
      })

      setIsTracking(result.tracked)
      
      // Refetch credits to update the UI
      await refetchCredits()
      
      if (result.tracked) {
        alert(`Successfully started tracking Snowball! You now have ${result.credits} credits remaining. You will receive major updates via email.`)
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
    }
  }

  const handleStopTracking = async () => {
    if (!user?.email) return

    try {
      // Use tRPC mutation with credit system (this will toggle off tracking and refund credits)
      const result = await toggleTrackingMutation.mutateAsync({
        company_id: 'f497a07f-18e7-45ad-a531-03a27c0a05ba' // Snowball founder ID
      })

      setIsTracking(result.tracked)
      
      // Refetch credits to update the UI
      await refetchCredits()
      
      if (!result.tracked) {
        alert(`You have stopped tracking Snowball. Your credits have been refunded to ${result.credits}.`)
      }
    } catch (error: unknown) {
      console.error('Error toggling tracking:', error)
      alert('Failed to stop tracking. Please try again.')
    }
  }

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setIsAuthenticated(false)
      setUser(null)
      setIsTracking(false)
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <Image
                src="/snowball.png"
                alt="Snowball Logo"
                width={32}
                height={32}
                className="mr-3"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Snowball</h1>
              </div>
            </div>
            
            {/* Mobile-first button layout */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 sm:items-center">
              <div className="flex items-center justify-between sm:justify-start">
                {fundraisingStatus ? (
                  <Badge 
                    variant="outline" 
                    className={`${fundraisingStatusConfig[fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.color} ${fundraisingStatusConfig[fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.borderColor} text-xs sm:text-sm`}
                  >
                    {fundraisingStatusConfig[fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.icon} {fundraisingStatusConfig[fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.label}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-green-600 border-green-600 text-xs sm:text-sm">
                    🟢 Active Fundraising
                  </Badge>
                )}
                <Link href="/dashboard/investor" className="sm:hidden">
                  <Button variant="outline" size="sm">
                    ← Dashboard
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                {isCheckingAuth ? (
                  <div className="text-sm text-gray-600 text-center sm:text-left">Loading...</div>
                ) : isAuthenticated ? (
                  <>
                    {/* Credit Display */}
                    <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg text-xs sm:text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-blue-700">
                        {creditsInfo?.credits || 0} Credits
                      </span>
                      <span className="text-blue-600">
                        ({creditsInfo?.subscription_tier || 'free'})
                      </span>
                    </div>
                    
                    {isTracking ? (
                      <Button variant="outline" onClick={handleStopTracking} size="sm" className="w-full sm:w-auto">
                        👀 Tracking
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleStartTracking} 
                        size="sm" 
                        className="w-full sm:w-auto"
                        disabled={!creditsInfo || creditsInfo.credits < 100}
                      >
                        {!creditsInfo || creditsInfo.credits < 100 
                          ? `Need 100 Credits (${creditsInfo?.credits || 0} available)`
                          : 'Track Snowball'
                        }
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleSignOut} size="sm" className="w-full sm:w-auto">
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleStartTracking} size="sm" className="w-full sm:w-auto">
                      Track Snowball
                    </Button>
                    <Link href="/auth/investor/signin" className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
                
                <Link href="/dashboard/investor" className="hidden sm:block">
                  <Button variant="outline" size="sm">
                    ← Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'updates', label: 'Updates' },
              { key: 'deck', label: 'Pitch Deck' },
              { key: 'team', label: 'Team' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Company Info */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <span className="text-lg sm:text-xl">{profile?.company_name || snowballData.company.name}</span>
                  <Badge variant="outline" className="w-fit">{profile?.stage || snowballData.company.stage}</Badge>
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">{profile?.bio || snowballData.company.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs sm:text-sm text-gray-600">Industry</div>
                    <div className="font-medium text-sm sm:text-base">{profile?.industry || snowballData.company.industry}</div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-600">Location</div>
                    <div className="font-medium text-sm sm:text-base">{profile?.location || snowballData.company.location}</div>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <div className="text-xs sm:text-sm text-gray-600">Funding Target</div>
                    <div className="font-medium text-sm sm:text-base">{profile?.funding_target || snowballData.company.fundingTarget}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-xs sm:text-sm text-gray-600">Website</div>
                  <Link href={profile?.website || snowballData.company.website} target="_blank" className="text-blue-600 hover:underline text-sm sm:text-base break-all">
                    {profile?.website || snowballData.company.website}
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Key Metrics</CardTitle>
                <CardDescription className="text-sm">Current performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Check if user is authenticated and tracking this company
                  if (!isAuthenticated || !isTracking) {
                    return (
                      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="max-w-md mx-auto">
                          <div className="text-4xl mb-4">🔒</div>
                          <h3 className="text-lg font-semibold mb-2 text-gray-700">Metrics are Private</h3>
                          <p className="text-sm mb-4">
                            Company performance metrics are only visible to investors who are tracking this startup.
                          </p>
                          {!isAuthenticated ? (
                            <p className="text-xs text-gray-600">
                              <a href="/auth/investor/signin" className="text-blue-600 hover:text-blue-800 underline">
                                Sign in as an investor
                              </a> to track companies and view their metrics.
                            </p>
                          ) : (
                            <p className="text-xs text-gray-600">
                              Click &ldquo;Track Startup&rdquo; above to start following Snowball and unlock access to their metrics.
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  }

                  // Get the latest major update with metrics
                  const latestMajorUpdate = updates
                    .filter(update => update.type === 'major' && update.metrics)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                  
                  const metrics = latestMajorUpdate?.metrics as { mrr?: number; growth?: number; users?: number; retention?: number } | undefined
                  
                  if (!metrics) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-lg font-semibold mb-2">No Metrics Available</p>
                        <p className="text-sm">This company hasn&apos;t shared any performance metrics yet.</p>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                        {typeof metrics.mrr === 'number' && (
                          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                            <div className="text-lg sm:text-2xl font-bold text-blue-600">
                              ${Math.round(metrics.mrr / 1000)}K
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">Monthly Recurring Revenue</div>
                          </div>
                        )}
                        {typeof metrics.growth === 'number' && (
                          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                            <div className="text-lg sm:text-2xl font-bold text-green-600">
                              +{metrics.growth}%
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">Month-over-Month Growth</div>
                          </div>
                        )}
                        {typeof metrics.users === 'number' && (
                          <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                            <div className="text-lg sm:text-2xl font-bold text-purple-600">
                              {metrics.users.toLocaleString()}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">Active Users</div>
                          </div>
                        )}
                        {typeof metrics.retention === 'number' && (
                          <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                            <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                              {metrics.retention}%
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">User Retention</div>
                          </div>
                        )}
                      </div>
                      
                      {/* Show when metrics were last updated */}
                      <div className="pt-4 border-t border-gray-200 text-center">
                        <p className="text-xs text-gray-500">
                          Last updated: {new Date(latestMajorUpdate.created_at).toLocaleDateString()} • From update: &ldquo;{latestMajorUpdate.title || 'Major Update'}&rdquo;
                        </p>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Fundraising Status */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Fundraising Status</CardTitle>
                <CardDescription className="text-sm">Current funding round progress</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Check if user is authenticated and tracking this company
                  if (!isAuthenticated || !isTracking) {
                    return (
                      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="max-w-md mx-auto">
                          <div className="text-4xl mb-4">🔒</div>
                          <h3 className="text-lg font-semibold mb-2 text-gray-700">Fundraising Status is Private</h3>
                          <p className="text-sm mb-4">
                            Company fundraising information is only visible to investors who are tracking this startup.
                          </p>
                          {!isAuthenticated ? (
                            <p className="text-xs text-gray-600">
                              <a href="/auth/investor/signin" className="text-blue-600 hover:text-blue-800 underline">
                                Sign in as an investor
                              </a> to track companies and view their fundraising status.
                            </p>
                          ) : (
                            <p className="text-xs text-gray-600">
                              Track this company to view their fundraising information.
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  }
                  
                  const fundraisingStatus = snowballRealData?.fundraisingStatus
                  
                  if (!fundraisingStatus || fundraisingStatus.status === 'not_fundraising') {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-lg font-semibold mb-2">Not Currently Fundraising</p>
                        <p className="text-sm">This company is not actively raising funds at the moment.</p>
                      </div>
                    )
                  }
                  
                  const statusConfig = {
                    preparing_to_raise: { label: 'Preparing to Raise', color: 'text-yellow-600' },
                    actively_fundraising: { label: 'Active Fundraising', color: 'text-green-600' }
                  }
                  
                  const config = statusConfig[fundraisingStatus.status as keyof typeof statusConfig]
                  
                  return (
                    <div className="space-y-4">
                      <div className="text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${config.color} bg-gray-100`}>
                          {config.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 sm:gap-6">
                        {fundraisingStatus.target_amount && (
                          <div className="text-center">
                            <div className="text-lg sm:text-2xl font-bold text-blue-600">
                              ${fundraisingStatus.target_amount.toLocaleString()}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">Target</div>
                          </div>
                        )}
                        
                        {fundraisingStatus.raised_amount !== undefined && (
                          <div className="text-center">
                            <div className="text-lg sm:text-2xl font-bold text-green-600">
                              ${fundraisingStatus.raised_amount.toLocaleString()}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">Raised</div>
                          </div>
                        )}
                        
                        {fundraisingStatus.stage && (
                          <div className="text-center">
                            <div className="text-lg sm:text-2xl font-bold text-purple-600">
                              {fundraisingStatus.stage}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">Stage</div>
                          </div>
                        )}
                      </div>
                      
                      {fundraisingStatus.deadline && (
                        <div className="text-center pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Target Close:</span> {new Date(fundraisingStatus.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* CTA for Tracking */}
            {!isTracking && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 sm:p-6 text-center">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">
                    Stay Updated on Snowball&apos;s Progress
                  </h3>
                  <p className="text-sm sm:text-base text-blue-700 mb-4">
                    Track Snowball to receive major updates and stay informed about their fundraising journey.
                  </p>
                  <Button onClick={handleStartTracking} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    🎯 Start Tracking Snowball
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="space-y-4 sm:space-y-6">
            {!isTracking ? (
              <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                <div className="text-4xl sm:text-6xl mb-4">🔒</div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Updates Locked</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  You need to track Snowball to see their company updates.
                </p>
                <Button onClick={handleStartTracking} className="bg-blue-600 hover:bg-blue-700">
                  Track Snowball
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Company Updates</h2>
                  <div className="text-xs sm:text-sm text-gray-600">
                    {isLoading ? 'Loading...' : `${updates.length} updates posted`}
                  </div>
                </div>

            {isLoading ? (
              <div className="text-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-8 sm:h-12 w-8 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading updates...</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {updates.map((update) => (
                  <Card key={update.id} className={updateTypeConfig[update.type].bgColor}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-2 sm:space-y-0">
                        <div className="flex items-start space-x-3">
                          <span className="text-xl sm:text-2xl">{updateTypeConfig[update.type].icon}</span>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                              {update.title || updateTypeConfig[update.type].label}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {new Date(update.created_at).toLocaleDateString()} • {new Date(update.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="w-fit text-xs">
                          {updateTypeConfig[update.type].label}
                        </Badge>
                      </div>
                      
                      <div className="prose max-w-none">
                        <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{update.content}</p>
                      </div>

                      {update.metrics && typeof update.metrics === 'object' && (
                        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                          {'mrr' in update.metrics && (
                            <div className="bg-white/70 rounded-lg p-3 text-center">
                              <div className="text-lg sm:text-xl font-bold text-blue-600">${Number(update.metrics.mrr) / 1000}K</div>
                              <div className="text-xs text-gray-600">MRR</div>
                            </div>
                          )}
                          {'growth' in update.metrics && (
                            <div className="bg-white/70 rounded-lg p-3 text-center">
                              <div className="text-lg sm:text-xl font-bold text-green-600">+{String(update.metrics.growth)}%</div>
                              <div className="text-xs text-gray-600">Growth</div>
                            </div>
                          )}
                          {'users' in update.metrics && (
                            <div className="bg-white/70 rounded-lg p-3 text-center">
                              <div className="text-lg sm:text-xl font-bold text-purple-600">{String(update.metrics.users)}</div>
                              <div className="text-xs text-gray-600">Users</div>
                            </div>
                          )}
                          {'retention' in update.metrics && (
                            <div className="bg-white/70 rounded-lg p-3 text-center">
                              <div className="text-lg sm:text-xl font-bold text-yellow-600">{String(update.metrics.retention)}%</div>
                              <div className="text-xs text-gray-600">Retention</div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {updates.length === 0 && !isLoading && (
                  <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                    <div className="text-4xl sm:text-6xl mb-4">📝</div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Updates Yet</h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Snowball will post company updates here as they become available.
                    </p>
                  </div>
                )}
              </div>
            )}
              </>
            )}
          </div>
        )}

        {activeTab === 'deck' && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Pitch Deck</h2>
            
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Snowball Pitch Deck</CardTitle>
                <CardDescription className="text-sm">
                  View our latest investor presentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-8 sm:h-12 w-8 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading pitch deck...</p>
                  </div>
                ) : pitchDeck ? (
                  <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                    <div className="text-4xl sm:text-6xl mb-4">📄</div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Pitch Deck Available</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-2 px-4">
                      Snowball&apos;s investor presentation showcasing our vision, traction, and growth plans.
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mb-6 break-all px-4">
                      File: {pitchDeck.file_name}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        className="w-full sm:w-auto"
                        onClick={async () => {
                          try {
                            // Get fresh signed URL
                            const response = await fetch(`/api/get-deck-url?file=${encodeURIComponent(pitchDeck.file_url)}`)
                            const result = await response.json()
                            
                            if (result.success) {
                              window.open(result.publicUrl, '_blank')
                            } else {
                              alert('Failed to access deck. Please contact the team.')
                            }
                          } catch (error) {
                            console.error('Error getting deck URL:', error)
                            alert('Failed to access deck. Please contact the team.')
                          }
                        }}
                      >
                        📖 View Deck
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={async () => {
                          try {
                            // Get fresh signed URL for download
                            const response = await fetch(`/api/get-deck-url?file=${encodeURIComponent(pitchDeck.file_url)}`)
                            const result = await response.json()
                            
                            if (result.success) {
                              const link = document.createElement('a')
                              link.href = result.publicUrl
                              link.download = pitchDeck.file_name || 'snowball-deck'
                              link.click()
                            } else {
                              alert('Failed to download deck. Please contact the team.')
                            }
                          } catch (error) {
                            console.error('Error getting deck URL:', error)
                            alert('Failed to download deck. Please contact the team.')
                          }
                        }}
                      >
                        📥 Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                    <div className="text-4xl sm:text-6xl mb-4">📄</div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Pitch Deck Coming Soon</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-6 px-4">
                      Snowball&apos;s pitch deck will be available here once uploaded.
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 px-4">
                      Check back later or contact the team directly for access.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Leadership Team</h2>
              <p className="text-gray-600 text-sm sm:text-base">Meet the founders building Snowball</p>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : team.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
                {team.map((member, index) => (
                  <Card key={member.id || index} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white">
                    <CardContent className="p-6 sm:p-8">
                      <div className="flex flex-col items-center text-center space-y-4">
                        {/* Profile Picture */}
                        <div className="relative">
                          {member.profile_picture_url ? (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-blue-100 group-hover:ring-blue-200 transition-all duration-300">
                              <Image
                                src={member.profile_picture_url}
                                alt={`${member.name} profile picture`}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold ring-4 ring-blue-100 group-hover:ring-blue-200 transition-all duration-300">
                              {member.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                          )}
                          {/* Status indicator */}
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>

                        {/* Name and Role */}
                        <div className="space-y-1">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                            {member.name}
                          </h3>
                          <p className="text-blue-600 font-medium text-sm sm:text-base">
                            {member.role}
                          </p>
                        </div>

                        {/* Bio */}
                        {member.bio && (
                          <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-sm">
                            {member.bio}
                          </p>
                        )}

                        {/* Social Links */}
                        <div className="flex space-x-3 pt-2">
                          {member.linkedin_url && (
                            <a
                              href={member.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors duration-200 cursor-pointer group"
                            >
                              <span className="text-blue-600 text-sm font-semibold group-hover:text-blue-700">in</span>
                            </a>
                          )}
                          {member.email && (
                            <a
                              href={`mailto:${member.email}`}
                              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200 cursor-pointer group"
                            >
                              <span className="text-gray-600 text-sm group-hover:text-gray-700">📧</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Information Yet</h3>
                <p className="text-gray-500 text-sm sm:text-base">
                  Team information will be available here once the founders update their profiles.
                </p>
              </div>
            )}

            {/* Company Culture Section */}
            <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8">
              <div className="text-center max-w-2xl mx-auto">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-6">
                  {profile?.mission || 'We\'re building the future of startup-investor connections through tribe-based networking. Our team combines deep product experience from Stripe with technical expertise from Google to create meaningful relationships in the startup ecosystem.'}
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                  <span className="bg-white px-3 py-1 rounded-full">🚀 Product-First</span>
                  <span className="bg-white px-3 py-1 rounded-full">🤝 Community-Driven</span>
                  <span className="bg-white px-3 py-1 rounded-full">📈 Data-Informed</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-blue-500">ℹ️</span>
            <div>
              <p className="text-sm text-blue-700">
                <strong>Public Tracking Page:</strong> This is Snowball&apos;s public company page. 
                {isAuthenticated ? (
                  isTracking ? 
                    ' You are currently tracking this company.' :
                    ' Click "Track Snowball" to start following their updates.'
                ) : (
                  ' Sign in or create an account to track this company and receive updates.'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
