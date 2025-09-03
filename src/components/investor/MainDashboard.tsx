'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/trpc/client'
import FeedbackButtons from './FeedbackButtons'
import type { User, InvestorProfile } from '@/types/database'

interface InvestorMainDashboardProps {
  user: User
  profile: InvestorProfile
  onLogout: () => void
}

// Mock company data for MVP - this will be replaced with real data
const mockCompanies = [
  {
    id: '1',
    company_name: 'TechFlow AI',
    description: 'AI-powered workflow automation for enterprise',
    industry: 'Enterprise Software',
    stage: 'Series A',
    geography: 'San Francisco, CA',
    funding_target: '$5M',
    fundraising_status: 'closing' as const,
    logo_emoji: '🤖',
    tribe: 'Stanford Alumni',
    metrics: {
      mrr: '$125K',
      growth: '+40% MoM',
      customers: '50+ Enterprise'
    }
  },
  {
    id: '2',
    company_name: 'GreenTech Solutions',
    description: 'Sustainable energy storage systems',
    industry: 'CleanTech',
    stage: 'Seed',
    geography: 'Austin, TX',
    funding_target: '$2.5M',
    fundraising_status: 'starting' as const,
    logo_emoji: '🌱',
    tribe: 'Y Combinator',
    metrics: {
      revenue: '$50K ARR',
      growth: '+80% QoQ',
      partnerships: '3 Major Utilities'
    }
  },
  {
    id: '3',
    company_name: 'HealthAI Diagnostics', 
    description: 'AI-powered medical imaging analysis',
    industry: 'HealthTech',
    stage: 'Series A',
    geography: 'Boston, MA',
    funding_target: '$8M',
    fundraising_status: 'preparing' as const,
    logo_emoji: '🏥',
    tribe: 'MIT Network',
    metrics: {
      revenue: '$500K ARR',
      growth: '+25% MoM',
      hospitals: '15 Pilot Programs'
    }
  }
]

const statusConfig = {
  preparing: { color: 'purple', dot: '🟣', label: 'Preparing to raise' },
  starting: { color: 'yellow', dot: '🟡', label: 'Starting fundraise' },
  closing: { color: 'red', dot: '🔴', label: 'Closing soon' },
  closed: { color: 'green', dot: '🟢', label: 'Successfully funded' }
}

export default function InvestorMainDashboard({ user, onLogout }: Omit<InvestorMainDashboardProps, 'profile'>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('all')
  const [selectedStage, setSelectedStage] = useState('all')
  const [trackedCompanies, setTrackedCompanies] = useState<string[]>([])
  const [currentView, setCurrentView] = useState<'feed' | 'tribes' | 'tracked'>('feed')

  // tRPC queries
  const { data: tribes = [] } = api.investor.getTribes.useQuery()
  const { data: userTribes = [] } = api.investor.getMyTribes.useQuery()
  
  // Mutations
  const toggleTrackingMutation = api.investor.toggleTracking.useMutation({
    onSuccess: (result) => {
      if (result.tracked) {
        setTrackedCompanies(prev => [...prev, ''])
      } else {
        setTrackedCompanies(prev => prev.filter(id => id !== ''))
      }
    }
  })

  const sendKnockMutation = api.investor.sendKnock.useMutation({
    onSuccess: () => {
      alert('Meeting request sent successfully! 🚀')
    },
    onError: (error) => {
      alert(`Failed to send meeting request: ${error.message}`)
    }
  })

  const joinTribeMutation = api.investor.joinTribe.useMutation({
    onSuccess: () => {
      alert('Successfully joined tribe! 🎉')
    },
    onError: (error) => {
      alert(`Failed to join tribe: ${error.message}`)
    }
  })

  const toggleTracking = (companyId: string) => {
    toggleTrackingMutation.mutate({ company_id: companyId })
    
    // Optimistic update
    setTrackedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    )
  }

  const sendKnock = (companyId: string, companyName: string) => {
    sendKnockMutation.mutate({ 
      company_id: companyId,
      message: `Hi! I'm interested in learning more about ${companyName}. Would you be open to a brief call to discuss your fundraising?`
    })
  }

  const joinTribe = (tribeId: string) => {
    joinTribeMutation.mutate({ tribe_id: tribeId })
  }

  const filteredCompanies = mockCompanies.filter(company => {
    const matchesSearch = company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesIndustry = selectedIndustry === 'all' || company.industry === selectedIndustry
    const matchesStage = selectedStage === 'all' || company.stage === selectedStage
    return matchesSearch && matchesIndustry && matchesStage
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center py-4 md:py-6 space-y-4 md:space-y-0">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Investor Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                {userTribes.length > 0 
                  ? `${userTribes.map(ut => ut.tribe?.name).join(', ')} • Deal Flow`
                  : 'Complete your profile to see curated deals'
                }
              </p>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="text-sm text-gray-600 hidden md:block">
                👤 {user.email}
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-0 md:space-x-8 overflow-x-auto">
            <button
              onClick={() => setCurrentView('feed')}
              className={`py-3 px-4 md:px-0 border-b-2 font-medium text-sm whitespace-nowrap ${
                currentView === 'feed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Deal Flow
            </button>
            <button
              onClick={() => setCurrentView('tribes')}
              className={`py-3 px-4 md:px-0 border-b-2 font-medium text-sm whitespace-nowrap ${
                currentView === 'tribes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Tribes ({userTribes.length})
            </button>
            <button
              onClick={() => setCurrentView('tracked')}
              className={`py-3 px-4 md:px-0 border-b-2 font-medium text-sm whitespace-nowrap ${
                currentView === 'tracked'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Tracked ({trackedCompanies.length})
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Deal Flow View */}
        {currentView === 'feed' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Companies
                  </label>
                  <Input
                    placeholder="Search by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      <SelectItem value="Enterprise Software">Enterprise Software</SelectItem>
                      <SelectItem value="CleanTech">CleanTech</SelectItem>
                      <SelectItem value="HealthTech">HealthTech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stage
                  </label>
                  <Select value={selectedStage} onValueChange={setSelectedStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Stages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      <SelectItem value="Pre-Seed">Pre-Seed</SelectItem>
                      <SelectItem value="Seed">Seed</SelectItem>
                      <SelectItem value="Series A">Series A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    {filteredCompanies.length} companies • {trackedCompanies.length} tracked
                  </div>
                </div>
              </div>
            </div>

            {/* Company Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredCompanies.map((company) => (
                <Card key={company.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{company.logo_emoji}</div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{company.company_name}</h3>
                          <p className="text-sm text-gray-600">{company.tribe}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs">{statusConfig[company.fundraising_status].dot}</span>
                        <span className="text-xs text-gray-600">{statusConfig[company.fundraising_status].label}</span>
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm mb-4">{company.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Industry:</span>
                        <span className="font-medium">{company.industry}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Stage:</span>
                        <span className="font-medium">{company.stage}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-medium">{company.funding_target}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{company.geography}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <h4 className="text-xs font-medium text-gray-700 mb-2">Key Metrics</h4>
                      <div className="space-y-1">
                        {Object.entries(company.metrics).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-gray-600 capitalize">{key}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button
                          size="sm"
                          variant={trackedCompanies.includes(company.id) ? "default" : "outline"}
                          onClick={() => toggleTracking(company.id)}
                          className="flex-1"
                          disabled={toggleTrackingMutation.isPending}
                        >
                          {trackedCompanies.includes(company.id) ? '✓ Tracked' : 'Track'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => sendKnock(company.id, company.company_name)}
                          className="flex-1"
                          disabled={sendKnockMutation.isPending}
                        >
                          🚪 Knock
                        </Button>
                      </div>
                      <FeedbackButtons companyId={company.id} companyName={company.company_name} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCompanies.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl md:text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
                <p className="text-gray-600">Try adjusting your search criteria.</p>
              </div>
            )}
          </>
        )}

        {/* Tribes View */}
        {currentView === 'tribes' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Tribes</CardTitle>
              </CardHeader>
              <CardContent>
                {userTribes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userTribes.map((membership) => (
                      <div key={membership.tribe_id} className="border rounded-lg p-4">
                        <h3 className="font-semibold">{membership.tribe?.name}</h3>
                        <p className="text-sm text-gray-600">{membership.tribe?.description}</p>
                        <Badge className="mt-2" variant="secondary">
                          {membership.tribe?.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">You haven&apos;t joined any tribes yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Tribes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tribes.filter(tribe => !userTribes.some(ut => ut.tribe_id === tribe.id)).map((tribe) => (
                    <div key={tribe.id} className="border rounded-lg p-4">
                      <h3 className="font-semibold">{tribe.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{tribe.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{tribe.type}</Badge>
                        <Button 
                          size="sm" 
                          onClick={() => joinTribe(tribe.id)}
                          disabled={joinTribeMutation.isPending}
                        >
                          Join
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tracked Companies View */}
        {currentView === 'tracked' && (
          <Card>
            <CardHeader>
              <CardTitle>Tracked Companies</CardTitle>
            </CardHeader>
            <CardContent>
              {trackedCompanies.length > 0 ? (
                <p className="text-gray-600">Your tracked companies will appear here.</p>
              ) : (
                <p className="text-gray-600">You haven&apos;t tracked any companies yet. Browse the deal flow to get started!</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
