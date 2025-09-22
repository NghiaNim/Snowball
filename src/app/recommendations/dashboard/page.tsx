'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Database, Search, History, LogOut } from 'lucide-react'
import { UploadInterface } from '@/components/recommendations/UploadInterface'
import { DatasetManager } from '@/components/recommendations/DatasetManager'
import { MultiStageQueryInterface } from '@/components/recommendations/MultiStageQueryInterface'
import { QueryHistory } from '@/components/recommendations/QueryHistory'
import { UpgradeButton } from '@/components/recommendations/UpgradeButton'
import { getAuthHeaders } from '@/lib/auth-helpers'
import { type DatasetSchema } from '@/lib/dataset-analysis'

type TabType = 'upload' | 'datasets' | 'query' | 'history'

interface SelectedDataset {
  id: string
  originalName: string
  gcsPath: string
  uploadedAt: string
  fileSize: number
  status: 'uploaded' | 'processing' | 'completed' | 'failed' | 'error' | 'processed'
  metadata?: Record<string, unknown>
}

export default function RecommendationsDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('upload')
  const [selectedDataset, setSelectedDataset] = useState<SelectedDataset | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedDatasetSchema, _setSelectedDatasetSchema] = useState<DatasetSchema | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [user, setUser] = useState<{ username: string; loginTime: string; type: 'admin' | 'google'; email?: string } | null>(null)
  const supabase = createClient()
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null)
  const [forceQueryReset, setForceQueryReset] = useState<boolean>(false)
  const [rerunData, setRerunData] = useState<{query: string, datasetId: string, datasetName: string} | null>(null)
  const [availableDatasets, setAvailableDatasets] = useState<SelectedDataset[]>([])
  const [userUsage, setUserUsage] = useState<{
    searchCount: number
    planType: 'free' | 'pro'
    hasReachedLimit: boolean
    isSubscribed: boolean
  } | null>(null)
  const router = useRouter()

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check admin auth first
      const adminAuth = localStorage.getItem('production-auth')
      const adminUserData = localStorage.getItem('production-user')
      
      if (adminAuth === 'true' && adminUserData) {
        const adminUser = JSON.parse(adminUserData)
        setIsAuthenticated(true)
        setUser({
          ...adminUser,
          type: 'admin'
        })
        setIsLoading(false)
        return
      }

      // Check Supabase/Google auth
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setIsAuthenticated(true)
        setUser({
          username: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          loginTime: session.user.created_at,
          type: 'google'
        })
      } else {
        setIsAuthenticated(false)
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [supabase.auth])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/recommendations/login')
    }
  }, [isLoading, isAuthenticated, router])

  // Fetch user usage status
  const fetchUserUsage = async () => {
    try {
      const response = await fetch('/api/user/usage', {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserUsage(data.usage)
      }
    } catch (error) {
      console.error('Error fetching user usage:', error)
    }
  }

  // Fetch usage when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserUsage()
    }
  }, [isAuthenticated, user])

  const handleLogout = async () => {
    // Clear admin auth
    localStorage.removeItem('production-auth')
    localStorage.removeItem('production-user')
    
    // Clear Supabase auth
    await supabase.auth.signOut()
    
    router.push('/recommendations/login')
  }

  const tabs = [
    { id: 'upload' as TabType, label: 'Upload Data', icon: Upload },
    { id: 'datasets' as TabType, label: 'My Datasets', icon: Database },
    { id: 'query' as TabType, label: 'AI Search', icon: Search },
    { id: 'history' as TabType, label: 'Query History', icon: History },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 md:py-6">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
                  AI Recommendation System
                </h1>
                <p className="mt-1 md:mt-2 text-sm md:text-lg text-gray-600">
                  Upload your data and find the perfect people using AI-powered recommendations
                </p>
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                {user && (
                  <div className="text-sm text-gray-600 text-center sm:text-left">
                    Welcome, <span className="font-medium">{user.username}</span>
                    {user.email && (
                      <div className="text-xs text-gray-500">{user.email}</div>
                    )}
                    <div className="text-xs text-gray-500">
                      {user.type === 'admin' ? 'Admin' : 'Google User'} • Since {new Date(user.loginTime).toLocaleDateString()}
                    </div>
                  </div>
                )}
                <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Upgrade Button */}
        {userUsage && (
          <div className="mb-6">
            <UpgradeButton 
              usage={userUsage} 
              onUpgradeClick={() => {
                // Refresh usage after potential upgrade
                setTimeout(() => fetchUserUsage(), 1000)
              }}
            />
          </div>
        )}
        {/* Navigation Tabs */}
        <div className="mb-6 md:mb-8">
          <nav className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  className={`flex items-center justify-center space-x-2 flex-1 py-3 px-4 min-h-[44px] text-sm md:text-base ${
                    activeTab === tab.id 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'hover:bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => {
                    setActiveTab(tab.id)
                    // Force reset when switching to query tab
                    if (tab.id === 'query') {
                      setForceQueryReset(true)
                      // Reset the force flag after component has time to process it
                      setTimeout(() => setForceQueryReset(false), 100)
                    }
                  }}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </Button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'upload' && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Your Dataset</CardTitle>
                <CardDescription>
                  Upload a CSV or Excel file containing people data. It will be stored in Google Cloud Storage and analyzed for AI recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UploadInterface 
                  onUploadSuccess={() => setActiveTab('datasets')}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'datasets' && (
            <DatasetManager 
              onSelectDataset={(dataset) => {
                console.log('Selected dataset:', dataset)
                setSelectedDataset(dataset)
                setActiveTab('query')
              }}
              onDatasetsChange={(datasets) => {
                // Keep track of available datasets for rerun functionality
                setAvailableDatasets(datasets)
              }}
            />
          )}

          {activeTab === 'query' && (
            <MultiStageQueryInterface 
              selectedDataset={selectedDataset}
              datasetSchema={selectedDatasetSchema || undefined}
              onBackToDatasets={() => setActiveTab('datasets')}
              onSearchStarted={(searchId) => {
                setActiveSearchId(searchId)
                setActiveTab('history')
              }}
              onUsageLimitExceeded={() => {
                // Refresh usage status to show updated limits
                fetchUserUsage()
              }}
              forceReset={forceQueryReset}
              rerunData={rerunData}
              onRerunComplete={() => {
                // Clear rerun data after it's been processed
                setRerunData(null)
              }}
            />
          )}

          {activeTab === 'history' && (
            <QueryHistory 
              activeSearchId={activeSearchId}
              onRerunQuery={async (query, datasetId) => {
                console.log('🔄 Rerun requested for query:', query, 'dataset:', datasetId)
                
                // First, try to find the dataset in available datasets
                let targetDataset = availableDatasets.find(d => d.id === datasetId)
                
                // If not found, try to fetch dataset information 
                if (!targetDataset) {
                  try {
                    const response = await fetch('/api/recommendations/list-datasets')
                    if (response.ok) {
                      const data = await response.json()
                      const datasets = data.datasets || []
                      setAvailableDatasets(datasets)
                      targetDataset = datasets.find((d: SelectedDataset) => d.id === datasetId)
                    }
                  } catch (error) {
                    console.error('Failed to fetch datasets:', error)
                  }
                }
                
                if (targetDataset) {
                  // Select the dataset and setup rerun data
                  setSelectedDataset(targetDataset)
                  setRerunData({
                    query,
                    datasetId,
                    datasetName: targetDataset.originalName
                  })
                  setActiveTab('query')
                } else {
                  console.error('Dataset not found for rerun:', datasetId)
                  // Fallback: just switch to query tab with rerun data
                  setRerunData({
                    query,
                    datasetId,
                    datasetName: 'Unknown Dataset'
                  })
                  setActiveTab('query')
                }
              }}
              onNewSearch={() => setActiveTab('query')}
            />
          )}
        </div>
      </div>
    </div>
  )
}