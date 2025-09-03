'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useTemplateCustomizations } from '@/hooks/useTemplateCustomizations'
import type { CompanyData } from '@/hooks/useTemplateCustomizations'

// Types for updates
type UpdateType = 'major' | 'minor' | 'coolsies'

interface Update {
  id: string
  type: UpdateType
  title?: string
  content: string
  metrics?: {
    mrr: number
    growth: number
    users: number
    retention: number
  }
  createdAt: Date
  companyName: string
}

// Sample updates data
const sampleUpdates: Update[] = [
  {
    id: '1',
    type: 'major' as const,
    title: 'Series A Progress Update',
    content: 'Exciting news! We\'ve secured our lead investor and are making great progress on our Series A round. MRR continues to grow at 12% month-over-month.',
    companyName: 'TechFlow AI',
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
    companyName: 'TechFlow AI',
    createdAt: new Date('2024-12-10')
  },
  {
    id: '3',
    type: 'coolsies' as const,
    content: 'Great meeting with Microsoft partnership team today. Exciting opportunities ahead! 🚀',
    companyName: 'TechFlow AI',
    createdAt: new Date('2024-12-08')
  },
  {
    id: '4',
    type: 'major' as const,
    title: 'Q4 Investor Update',
    content: 'Strong Q4 results with significant customer growth and successful pilot programs with major hospitals.',
    companyName: 'HealthAI Diagnostics',
    metrics: {
      mrr: 50000,
      growth: 25,
      users: 5000,
      retention: 89
    },
    createdAt: new Date('2024-12-12')
  },
  {
    id: '5',
    type: 'minor' as const,
    title: 'New Partnership Announcement',
    content: 'Excited to announce our partnership with Tesla Energy for pilot deployment.',
    companyName: 'GreenTech Solutions',
    createdAt: new Date('2024-12-05')
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

// Default company data (used when no template companies are provided)
const defaultCompanies: CompanyData[] = [
  {
    id: 1,
    name: 'TechFlow AI',
    description: 'AI-powered workflow automation for enterprise',
    industry: 'Enterprise Software',
    stage: 'Series A',
    location: 'San Francisco, CA',
    fundingTarget: '$5M',
    status: 'closing' as const,
    tribe: 'Stanford Alumni',
    logo: '🤖',
    metrics: {
      mrr: '$125K',
      growth: '+40% MoM',
      customers: '50+ Enterprise'
    }
  },
  {
    id: 2,
    name: 'GreenTech Solutions',
    description: 'Sustainable energy storage systems',
    industry: 'CleanTech',
    stage: 'Seed',
    location: 'Austin, TX',
    fundingTarget: '$2.5M',
    status: 'starting' as const,
    tribe: 'Y Combinator',
    logo: '🌱',
    metrics: {
      revenue: '$50K ARR',
      growth: '+80% QoQ',
      partnerships: '3 Major Utilities'
    }
  },
  {
    id: 3,
    name: 'HealthAI Diagnostics',
    description: 'AI-powered medical imaging analysis',
    industry: 'HealthTech',
    stage: 'Series A',
    location: 'Boston, MA',
    fundingTarget: '$8M',
    status: 'preparing' as const,
    tribe: 'MIT Network',
    logo: '🏥',
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

export default function DemoInvestorDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('companies')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('all')
  const [selectedStage, setSelectedStage] = useState('all')
  const [trackedCompanies, setTrackedCompanies] = useState<number[]>([])

  const router = useRouter()
  const customizations = useTemplateCustomizations('investor')
  
  // Use template companies if available, otherwise use defaults
  const companies = customizations.companies || defaultCompanies

  useEffect(() => {
    const session = localStorage.getItem('temp-session')
    const role = localStorage.getItem('temp-role')
    if (!session || role !== 'investor') {
      router.push('/demo')
      return
    }
    setIsAuthenticated(true)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('temp-session')
    localStorage.removeItem('temp-role')
    router.push('/demo')
  }

  const toggleTracking = (companyId: number) => {
    setTrackedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    )
  }

  const sendKnock = (companyName: string) => {
    alert(`Meeting request sent to ${companyName}! 🚀\n\nThis is a demo - no real request was sent.`)
  }

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesIndustry = selectedIndustry === 'all' || company.industry === selectedIndustry
    const matchesStage = selectedStage === 'all' || company.stage === selectedStage
    return matchesSearch && matchesIndustry && matchesStage
  })

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 
                className="text-2xl font-bold"
                style={{ color: customizations.styling?.primaryColor || '#1F2937' }}
              >
                {customizations.header?.title || 'Investor Dashboard'}
              </h1>
              <p className="text-sm text-gray-600">{customizations.header?.subtitle || 'Deal Flow Demo'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                👤 Demo Investor
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'companies', label: 'Deal Flow', icon: '🏢' },
              { key: 'updates', label: 'Updates', icon: '📈' },
              { key: 'tracked', label: 'Tracked Companies', icon: '📌' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? 'text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                style={activeTab === tab.key ? { borderColor: customizations.styling?.primaryColor || '#3B82F6', color: customizations.styling?.primaryColor || '#3B82F6' } : {}}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'companies' && (
          <div>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Companies
              </label>
              <Input
                placeholder={customizations.content?.searchPlaceholder || "Search by name or description..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="all">All Industries</option>
                <option value="Enterprise Software">Enterprise Software</option>
                <option value="CleanTech">CleanTech</option>
                <option value="HealthTech">HealthTech</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stage
              </label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="all">All Stages</option>
                <option value="Pre-Seed">Pre-Seed</option>
                <option value="Seed">Seed</option>
                <option value="Series A">Series A</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                {filteredCompanies.length} companies • {trackedCompanies.length} tracked
              </div>
            </div>
          </div>
        </div>

        {/* Company Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <div key={company.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{company.logo}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                      <p className="text-sm text-gray-600">{company.tribe}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs">{statusConfig[company.status].dot}</span>
                    <span className="text-xs text-gray-600">{statusConfig[company.status].label}</span>
                  </div>
                </div>

                <p className="text-gray-700 text-sm mb-4">{company.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{customizations.content?.companyCardTexts?.industryLabel || 'Industry:'}</span>
                    <span className="font-medium">{company.industry}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{customizations.content?.companyCardTexts?.stageLabel || 'Stage:'}</span>
                    <span className="font-medium">{company.stage}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{customizations.content?.companyCardTexts?.targetLabel || 'Target:'}</span>
                    <span className="font-medium">{company.fundingTarget}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{customizations.content?.companyCardTexts?.locationLabel || 'Location:'}</span>
                    <span className="font-medium">{company.location}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">{customizations.content?.companyCardTexts?.metricsTitle || 'Key Metrics'}</h4>
                  <div className="space-y-1">
                    {Object.entries(company.metrics).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-gray-600 capitalize">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant={trackedCompanies.includes(company.id) ? "default" : "outline"}
                    onClick={() => toggleTracking(company.id)}
                    className="flex-1"
                  >
                    {trackedCompanies.includes(company.id) ? '✓ Tracked' : (customizations.content?.companyCardTexts?.trackButtonText || 'Track')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => sendKnock(company.name)}
                    className="flex-1"
                  >
                    {customizations.content?.companyCardTexts?.knockButtonText || '🚪 Knock'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-600">Try adjusting your search criteria.</p>
          </div>
        )}

            {/* Demo Notice */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-blue-500">ℹ️</span>
                <div>
                  <p className="text-sm text-blue-700">
                    <strong>Demo Mode:</strong> This is sample data showcasing the investor experience. 
                    All companies and metrics are fictional for demonstration purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Company Updates</h2>
              <div className="text-sm text-gray-600">
                {sampleUpdates.length} updates from portfolio companies
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
                            {update.companyName} • {update.createdAt.toLocaleDateString()}
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
                          <div className="text-xl font-bold text-purple-600">{update.metrics.users.toLocaleString()}</div>
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

        {activeTab === 'tracked' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Tracked Companies</h2>
              <div className="text-sm text-gray-600">
                {trackedCompanies.length} companies being tracked
              </div>
            </div>

            {trackedCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.filter(company => trackedCompanies.includes(company.id)).map((company) => (
                  <div key={company.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{company.logo}</div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                            <p className="text-sm text-gray-600">{company.tribe}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">{statusConfig[company.status].dot}</span>
                          <span className="text-xs text-gray-600">{statusConfig[company.status].label}</span>
                        </div>
                      </div>

                      <p className="text-gray-700 text-sm mb-4">{company.description}</p>

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

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleTracking(company.id)}
                          className="flex-1"
                        >
                          ✓ Tracking
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => sendKnock(company.name)}
                          className="flex-1"
                        >
                          🚪 Knock
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📌</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tracked companies yet</h3>
                <p className="text-gray-600 mb-4">Start tracking companies from the Deal Flow tab to see them here.</p>
                <Button onClick={() => setActiveTab('companies')}>
                  Browse Deal Flow
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}