'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [investor, setInvestor] = useState<{ id: string; user_id: string; email?: string; investor_name?: string; firm_name?: string; title?: string; credits?: number; subscription_tier?: string; max_credits?: number } | null>(null)
  const router = useRouter()

  // Fetch real Snowball data - only major updates for investors
  const { data: snowballData, isLoading: isLoadingSnowball } = api.company.getSnowballMajorUpdates.useQuery()
  
  // Debug logging
  useEffect(() => {
    console.log('Investor dashboard debug:', {
      isAuthenticated,
      investor
    })
  }, [isAuthenticated, investor])
  
  // Load tracked startups
  const loadTrackedStartups = useCallback(async () => {
    if (!investor) return
    
    setIsLoadingTracked(true)
    try {
      const supabase = createClient()
      
      // Get tracked relationships
      const { data: relationships, error: relError } = await supabase
        .from('founder_investor_relationships')
        .select('id, founder_id, status')
        .eq('investor_id', investor.id)
        .eq('relationship_type', 'tracking')
        .eq('status', 'active')
      
      if (relError) {
        console.error('Error loading tracked startups:', relError)
        console.error('Error details:', JSON.stringify(relError, null, 2))
        return
      }
      
      // Debug logging
      console.log('Tracked relationships data:', relationships)
      
      if (!relationships || relationships.length === 0) {
        setTrackedStartups([])
        return
      }
      
      // Get founder details for each tracked relationship
      const founderIds = relationships.map(rel => rel.founder_id)
      const { data: founders, error: foundersError } = await supabase
        .from('founders')
        .select('id, company_name, mission, industry, stage, location')
        .in('id', founderIds)
      
      if (foundersError) {
        console.error('Error loading founders:', foundersError)
        return
      }
      
      // Create a map of founder data for quick lookup
      const foundersMap = new Map(founders?.map(f => [f.id, f]) || [])
      
      // Transform the data
      const startups = relationships.map(rel => {
        const founder = foundersMap.get(rel.founder_id)
        return {
          id: rel.id,
          founder_id: rel.founder_id,
          company_name: founder?.company_name || 'Unknown Company',
          description: founder?.mission || 'No description available',
          industry: founder?.industry || 'Unknown',
          stage: founder?.stage || 'Unknown',
          location: founder?.location || 'Unknown',
          status: rel.status
        }
      })
      
      console.log('Transformed startups:', startups)
      setTrackedStartups(startups)
    } catch (error) {
      console.error('Error loading tracked startups:', error)
    } finally {
      setIsLoadingTracked(false)
    }
  }, [investor])
  
  // Load tracked startups when investor is available
  useEffect(() => {
    if (investor) {
      loadTrackedStartups()
    }
  }, [investor])
  
  // Tracking functionality
  const [isTrackingSnowball, setIsTrackingSnowball] = useState(false)
  const [isTrackingLoading, setIsTrackingLoading] = useState(false)
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'featured' | 'tracked'>('featured')
  
  // Tracked startups state
  const [trackedStartups, setTrackedStartups] = useState<Array<{
    id: string
    founder_id: string
    company_name: string
    description: string
    industry: string
    stage: string
    location: string
    status: string
  }>>([])
  const [isLoadingTracked, setIsLoadingTracked] = useState(false)

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
            .select('id, user_id, email, investor_name, firm_name, title, credits, subscription_tier, max_credits')
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
    if (!investor || (investor.credits && investor.credits < 100 && !isTrackingSnowball)) {
      alert('Insufficient credits. Please upgrade your subscription to track more startups.')
      return
    }

    setIsTrackingLoading(true)
    try {
      const supabase = createClient()
      const snowballFounderId = 'f497a07f-18e7-45ad-a531-03a27c0a05ba'

      if (isTrackingSnowball) {
        // Untrack - refund credits
        const { error: deleteError } = await supabase
          .from('founder_investor_relationships')
          .delete()
          .eq('investor_id', investor.id)
          .eq('founder_id', snowballFounderId)
          .eq('relationship_type', 'tracking')

        if (deleteError) {
          throw new Error(`Failed to untrack company: ${deleteError.message}`)
        }

        // Refund 100 credits
        const newCredits = (investor.credits || 0) + 100
        const { error: updateError } = await supabase
          .from('investors')
          .update({ credits: newCredits })
          .eq('id', investor.id)

        if (updateError) {
          throw new Error(`Failed to update credits: ${updateError.message}`)
        }

        // Record the transaction
        await supabase
          .from('credit_transactions')
          .insert({
            investor_id: investor.id,
            amount: 100,
            transaction_type: 'untrack_startup',
            startup_id: snowballFounderId,
            description: 'Credits refunded for untracking startup'
          })

        setIsTrackingSnowball(false)
        setInvestor({ ...investor, credits: newCredits })
        await loadTrackedStartups() // Refresh tracked startups list
        alert(`You have stopped tracking Snowball. Your credits have been refunded to ${newCredits}.`)
      } else {
        // Track - check credits first
        if (!investor.credits || investor.credits < 100) {
          alert('Insufficient credits. Please upgrade your subscription to track more startups.')
          return
        }

        // Track the company
        const { error: insertError } = await supabase
          .from('founder_investor_relationships')
          .insert({
            investor_id: investor.id,
            founder_id: snowballFounderId,
            relationship_type: 'tracking',
            status: 'active',
            initiated_by: 'investor'
          })

        if (insertError) {
          throw new Error(`Failed to track company: ${insertError.message}`)
        }

        // Deduct 100 credits
        const newCredits = (investor.credits || 0) - 100
        const { error: updateError } = await supabase
          .from('investors')
          .update({ credits: newCredits })
          .eq('id', investor.id)

        if (updateError) {
          throw new Error(`Failed to update credits: ${updateError.message}`)
        }

        // Record the transaction
        await supabase
          .from('credit_transactions')
          .insert({
            investor_id: investor.id,
            amount: -100,
            transaction_type: 'track_startup',
            startup_id: snowballFounderId,
            description: 'Credits used for tracking startup'
          })

        setIsTrackingSnowball(true)
        setInvestor({ ...investor, credits: newCredits })
        await loadTrackedStartups() // Refresh tracked startups list
        alert(`Successfully started tracking Snowball! You now have ${newCredits} credits remaining.`)
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
          <div className="py-4 sm:py-6">
            {/* Mobile Layout */}
            <div className="flex flex-col space-y-4 sm:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Image
                    src="/snowball.png"
                    alt="Snowball Logo"
                    width={28}
                    height={28}
                    className="mr-2"
                  />
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
                    <p className="text-xs text-gray-600">Welcome back, {investor.investor_name}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
              
              {/* Credit Display - Mobile */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-700">
                    {investor?.credits || 0} Credits
                  </span>
                  <span className="text-xs text-blue-600">
                    ({investor?.subscription_tier || 'free'})
                  </span>
                </div>
                
                <div className="text-xs text-gray-600 text-right">
                  {investor.firm_name && `${investor.firm_name}`}
                  {investor.title && ` • ${investor.title}`}
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex justify-between items-center">
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
                    {investor?.credits || 0} Credits
                </span>
                <span className="text-xs text-blue-600">
                    ({investor?.subscription_tier || 'free'})
                </span>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-6 sm:mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('featured')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'featured'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">Featured Opportunity</span>
                <span className="sm:hidden">Featured</span>
              </button>
              <button
                onClick={() => setActiveTab('tracked')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'tracked'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">Tracked Startups ({trackedStartups.length})</span>
                <span className="sm:hidden">Tracked ({trackedStartups.length})</span>
              </button>
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Featured Opportunity Tab */}
          {activeTab === 'featured' && (
            <>
              {isTrackingSnowball ? (
                <Card className="lg:col-span-2">
                  <CardContent className="p-6 text-center">
                    <div className="text-gray-500">
                      <div className="text-4xl mb-4">🎯</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No New Recommendations</h3>
                      <p className="text-gray-600 mb-4">
                        You&apos;re all caught up! Check the Tracked Startups tab to see updates from companies you&apos;re following.
                      </p>
                      <Button 
                        onClick={() => setActiveTab('tracked')}
                        variant="outline"
                      >
                        View Tracked Startups
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Featured Opportunity</CardTitle>
                  <CardDescription className="text-sm">High-potential startup in your investment focus</CardDescription>
                </div>
                <Link href="/track/snowball">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
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
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center justify-between sm:block">
                      <h3 className="text-lg font-semibold text-gray-900">Snowball</h3>
                        <div className="sm:hidden">
                          {snowballData?.fundraisingStatus ? (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${fundraisingStatusConfig[snowballData.fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.color} ${fundraisingStatusConfig[snowballData.fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.borderColor}`}
                            >
                              {fundraisingStatusConfig[snowballData.fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.icon} {fundraisingStatusConfig[snowballData.fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.label}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                              🟢 Active Fundraising
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                        {snowballData?.profile?.mission || 'Two-sided marketplace connecting early-stage startups with investors through tribe-based networking. Leveraging communities built around accelerators, universities, and companies for high-quality deal flow.'}
                      </p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end space-y-2">
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
                    
                    // Only render if we have at least one metric value
                    const hasMetrics = metrics && (
                      typeof metrics.mrr === 'number' || 
                      typeof metrics.growth === 'number' || 
                      typeof metrics.users === 'number' || 
                      typeof metrics.retention === 'number'
                    )
                    
                    return hasMetrics ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
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

                  {/* Pitch Deck Button */}
                  {snowballData?.pitchDeck && (
                    <div className="pt-4">
                      <Link href={snowballData.pitchDeck.public_url || `/api/get-deck-url?user_id=snowball-demo-user`} target="_blank">
                        <Button variant="outline" className="w-full">
                          📄 View Pitch Deck
                        </Button>
                      </Link>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 space-y-3 sm:space-y-0">
                    <div className="text-sm text-gray-600">
                      B2B SaaS • Seed Stage • San Francisco, CA
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <Link href="/track/snowball" className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          👁️ Preview
                        </Button>
                      </Link>
                      {isTrackingSnowball ? (
                        <Button 
                          variant="outline" 
                          onClick={handleToggleTracking}
                          disabled={isTrackingLoading}
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          {isTrackingLoading ? 'Processing...' : '👀 Stop Tracking'}
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleToggleTracking}
                          disabled={isTrackingLoading || !investor || !investor.credits || investor.credits < 100}
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          {isTrackingLoading ? 'Processing...' : 
                           (!investor || !investor.credits || investor.credits < 100) ? 
                           `Need 100 Credits (${investor?.credits || 0} available)` : 
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
              )}
            </>
          )}

          {/* Tracked Startups Tab */}
          {activeTab === 'tracked' && (
            <div className="lg:col-span-2 space-y-6">
              {isLoadingTracked ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading tracked startups...</span>
                    </div>
                  </CardContent>
                </Card>
              ) : trackedStartups.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-gray-500">
                      <div className="text-4xl mb-4">📊</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Tracked Startups</h3>
                      <p className="text-gray-600 mb-4">
                        You haven&apos;t started tracking any startups yet. Use the Featured Opportunity tab to discover and track startups.
                      </p>
                      <Button 
                        onClick={() => setActiveTab('featured')}
                        variant="outline"
                      >
                        View Featured Opportunity
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {trackedStartups.map((startup) => (
                    <Card key={startup.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-lg">
                                {startup.company_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{startup.company_name}</h3>
                              <p className="text-sm text-gray-600">{startup.industry}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            👀 Tracking
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {startup.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>{startup.stage}</span>
                          <span>{startup.location}</span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <Link href={`/track/snowball`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              👁️ View Details
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={async () => {
                              if (!investor) return
                              
                              try {
                                const supabase = createClient()
                                
                                // Remove tracking relationship
                                const { error: deleteError } = await supabase
                                  .from('founder_investor_relationships')
                                  .delete()
                                  .eq('investor_id', investor.id)
                                  .eq('founder_id', startup.founder_id)
                                  .eq('relationship_type', 'tracking')

                                if (deleteError) {
                                  throw new Error(`Failed to untrack: ${deleteError.message}`)
                                }

                                // Refund 100 credits
                                const newCredits = (investor.credits || 0) + 100
                                const { error: updateError } = await supabase
                                  .from('investors')
                                  .update({ credits: newCredits })
                                  .eq('id', investor.id)

                                if (updateError) {
                                  throw new Error(`Failed to update credits: ${updateError.message}`)
                                }

                                // Record the transaction
                                await supabase
                                  .from('credit_transactions')
                                  .insert({
                                    investor_id: investor.id,
                                    amount: 100,
                                    transaction_type: 'untrack_startup',
                                    startup_id: startup.founder_id,
                                    description: `Credits refunded for untracking ${startup.company_name}`
                                  })

                                // Update local state
                                setInvestor({ ...investor, credits: newCredits })
                                setIsTrackingSnowball(false) // Update tracking status
                                await loadTrackedStartups() // Refresh the list
                                
                                alert(`Successfully untracked ${startup.company_name}. Your credits have been refunded to ${newCredits}.`)
                              } catch (error) {
                                console.error('Error untracking:', error)
                                alert('Failed to untrack startup. Please try again.')
                              }
                            }}
                          >
                            🚫 Untrack
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Stats - Only show on featured tab */}
          {activeTab === 'featured' && (
            <div className="space-y-4 lg:space-y-0">
          <Card>
            <CardHeader>
                  <CardTitle className="text-lg">Your Activity</CardTitle>
                  <CardDescription className="text-sm">Investment tracking overview</CardDescription>
            </CardHeader>
            <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-gray-600">Available Credits</span>
                      <span className="font-semibold text-sm sm:text-base">{investor?.credits || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-gray-600">Subscription Tier</span>
                      <span className="font-semibold text-sm sm:text-base capitalize">{investor?.subscription_tier || 'free'}</span>
                </div>
                <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-gray-600">Companies Tracking</span>
                      <span className="font-semibold text-sm sm:text-base">{trackedStartups.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card>
            <CardHeader>
                  <CardTitle className="text-lg">Subscription Management</CardTitle>
                  <CardDescription className="text-sm">Upgrade for more credits and features</CardDescription>
            </CardHeader>
            <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                <div className="text-sm text-gray-600">
                      Current Plan: <span className="font-semibold capitalize">{investor?.subscription_tier || 'free'}</span>
                </div>
                <div className="text-sm text-gray-600">
                      Credit Limit: <span className="font-semibold">{investor?.max_credits || 100}</span>
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
          )}
        </div>
      </main>
    </div>
  )
}
