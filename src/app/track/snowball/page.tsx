'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'

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

// Sample updates (would come from database)
const sampleUpdates = [
  {
    id: '1',
    type: 'major' as const,
    title: 'December 2024 Investor Update',
    content: 'Major progress this month with significant traction growth. We closed a partnership with Microsoft for enterprise distribution and hired our VP of Sales from Salesforce.',
    metrics: {
      mrr: 140000,
      growth: 12,
      users: 15000,
      retention: 94
    },
    createdAt: new Date('2024-12-15')
  },
  {
    id: '2',
    type: 'minor' as const,
    title: 'Product Feature Launch',
    content: 'Just launched our new AI-powered automation features. Early user feedback is very positive!',
    createdAt: new Date('2024-12-10')
  },
  {
    id: '3',
    type: 'coolsies' as const,
    content: 'Great meeting with Microsoft partnership team today. Exciting opportunities ahead! 🚀',
    createdAt: new Date('2024-12-08')
  }
]

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

export default function SnowballTrackingPage() {
  const [isTracking, setIsTracking] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [deckUrl, setDeckUrl] = useState<string | null>(null)
  const [deckName, setDeckName] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already tracking
    const tracking = localStorage.getItem('tracking-snowball')
    if (tracking === 'true') {
      setIsTracking(true)
    }

    // Load deck data if available
    const savedDeckFilePath = localStorage.getItem('snowball-deck-file-path')
    const savedDeckName = localStorage.getItem('snowball-deck-name')
    if (savedDeckFilePath && savedDeckName) {
      setDeckUrl(savedDeckFilePath) // Use the GCS file path
      setDeckName(savedDeckName)
    }
  }, [])

  const handleStartTracking = () => {
    setIsTracking(true)
    localStorage.setItem('tracking-snowball', 'true')
    // In a real app, this would create a database entry
    alert('You are now tracking Snowball! You will receive major updates via email if you have an account.')
  }

  const handleStopTracking = () => {
    setIsTracking(false)
    localStorage.removeItem('tracking-snowball')
    alert('You have stopped tracking Snowball.')
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
                <h1 className="text-2xl font-bold text-gray-900">Snowball</h1>
                <p className="text-sm text-gray-600">Two-sided marketplace for startups & investors</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                🟢 Active Fundraising
              </Badge>
              {isTracking ? (
                <Button variant="outline" onClick={handleStopTracking}>
                  👀 Tracking
                </Button>
              ) : (
                <Button onClick={handleStartTracking}>
                  Track Snowball
                </Button>
              )}
              <Link href="/">
                <Button variant="outline">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'updates', label: 'Updates' },
              { key: 'deck', label: 'Pitch Deck' },
              { key: 'team', label: 'Team' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
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
          <div className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{snowballData.company.name}</span>
                  <Badge variant="outline">{snowballData.company.stage}</Badge>
                </CardTitle>
                <CardDescription>{snowballData.company.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Industry</div>
                    <div className="font-medium">{snowballData.company.industry}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Location</div>
                    <div className="font-medium">{snowballData.company.location}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Founded</div>
                    <div className="font-medium">{snowballData.company.founded}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600">Website</div>
                  <Link href={snowballData.company.website} target="_blank" className="text-blue-600 hover:underline">
                    {snowballData.company.website}
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
                <CardDescription>Current performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      ${Math.round(snowballData.metrics.current.mrr / 1000)}K
                    </div>
                    <div className="text-sm text-gray-600">Monthly Recurring Revenue</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      +{snowballData.metrics.current.growth}%
                    </div>
                    <div className="text-sm text-gray-600">Month-over-Month Growth</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {snowballData.metrics.current.users.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Active Users</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {snowballData.metrics.current.retention}%
                    </div>
                    <div className="text-sm text-gray-600">User Retention</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fundraising Status */}
            <Card>
              <CardHeader>
                <CardTitle>Fundraising Status</CardTitle>
                <CardDescription>Current funding round progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ${snowballData.fundraising.target.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Target</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${snowballData.fundraising.raised.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Raised</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {snowballData.fundraising.stage}
                    </div>
                    <div className="text-sm text-gray-600">Stage</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA for Tracking */}
            {!isTracking && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Stay Updated on Snowball&apos;s Progress
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Track Snowball to receive major updates and stay informed about their fundraising journey.
                  </p>
                  <Button onClick={handleStartTracking} className="bg-blue-600 hover:bg-blue-700">
                    🎯 Start Tracking Snowball
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Company Updates</h2>
              <div className="text-sm text-gray-600">
                {sampleUpdates.length} updates posted
              </div>
            </div>

            <div className="space-y-4">
              {sampleUpdates.map((update) => (
                <Card key={update.id} className={updateTypeConfig[update.type].bgColor}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{updateTypeConfig[update.type].icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {update.title || updateTypeConfig[update.type].label}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {update.createdAt.toLocaleDateString()} • {update.createdAt.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {updateTypeConfig[update.type].label}
                      </Badge>
                    </div>
                    
                    <div className="prose max-w-none">
                      <p className="text-gray-700">{update.content}</p>
                    </div>

                    {update.metrics && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/70 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-blue-600">${update.metrics.mrr / 1000}K</div>
                          <div className="text-xs text-gray-600">MRR</div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-green-600">+{update.metrics.growth}%</div>
                          <div className="text-xs text-gray-600">Growth</div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-purple-600">{update.metrics.users}</div>
                          <div className="text-xs text-gray-600">Users</div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-yellow-600">{update.metrics.retention}%</div>
                          <div className="text-xs text-gray-600">Retention</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'deck' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Pitch Deck</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Snowball Pitch Deck</CardTitle>
                <CardDescription>
                  View our latest investor presentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deckUrl ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-6xl mb-4">📄</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Pitch Deck Available</h3>
                    <p className="text-gray-600 mb-2">
                      Snowball&apos;s investor presentation showcasing our vision, traction, and growth plans.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                      File: {deckName}
                    </p>
                    <div className="space-y-3">
                      <Button 
                        className="mr-3"
                        onClick={async () => {
                          try {
                            // Get fresh signed URL
                            const response = await fetch(`/api/get-deck-url?file=${encodeURIComponent(deckUrl)}`)
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
                        onClick={async () => {
                          try {
                            // Get fresh signed URL for download
                            const response = await fetch(`/api/get-deck-url?file=${encodeURIComponent(deckUrl)}`)
                            const result = await response.json()
                            
                            if (result.success) {
                              const link = document.createElement('a')
                              link.href = result.publicUrl
                              link.download = deckName || 'snowball-deck'
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
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-6xl mb-4">📄</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Pitch Deck Coming Soon</h3>
                    <p className="text-gray-600 mb-6">
                      Snowball&apos;s pitch deck will be available here once uploaded.
                    </p>
                    <p className="text-sm text-gray-500">
                      Check back later or contact the team directly for access.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Team</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Leadership Team</CardTitle>
                <CardDescription>
                  Meet the founders building Snowball
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {snowballData.company.team.map((member, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        <p className="text-gray-600">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Demo Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-blue-500">ℹ️</span>
            <div>
              <p className="text-sm text-blue-700">
                <strong>Public Tracking Page:</strong> This is Snowball&apos;s public company page. 
                Investors can track the company and view updates without requiring an account.
                {isTracking && ' You are currently tracking this company.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
