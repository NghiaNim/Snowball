'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { useTemplateCustomizations } from '@/hooks/useTemplateCustomizations'
import type { CompanyData } from '@/hooks/useTemplateCustomizations'

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

export default function InvestorDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
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
      router.push('/')
      return
    }
    setIsAuthenticated(true)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('temp-session')
    localStorage.removeItem('temp-role')
    router.push('/')
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
              <p className="text-sm text-gray-600">{customizations.header?.subtitle || 'Stanford Alumni Network • Deal Flow'}</p>
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

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
    </div>
  )
}
