'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Database, Search, History, LogOut } from 'lucide-react'
import { ProductionUploadInterface } from '@/components/recommendations/ProductionUploadInterface'
import { ProductionDatasetManager } from '@/components/recommendations/ProductionDatasetManager'
import { MultiStageQueryInterface } from '@/components/recommendations/MultiStageQueryInterface'
import { ProductionQueryHistory } from '@/components/recommendations/ProductionQueryHistory'
import { type DatasetSchema } from '@/lib/dataset-analysis'

type TabType = 'upload' | 'datasets' | 'query' | 'history'

interface SelectedDataset {
  id: string
  originalName: string
  gcsPath: string
  uploadedAt: string
  fileSize: number
  status: 'uploaded' | 'processing' | 'completed' | 'failed' | 'error' | 'processed'
  metadata?: Record<string, any>
}

export default function RecommendationsDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('upload')
  const [selectedDataset, setSelectedDataset] = useState<SelectedDataset | null>(null)
  const [selectedDatasetSchema, setSelectedDatasetSchema] = useState<DatasetSchema | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [user, setUser] = useState<{ username: string; loginTime: string } | null>(null)
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null)
  const [forceQueryReset, setForceQueryReset] = useState<boolean>(false)
  const router = useRouter()

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem('production-auth')
      const userData = localStorage.getItem('production-user')
      
      if (auth === 'true' && userData) {
        setIsAuthenticated(true)
        setUser(JSON.parse(userData))
      } else {
        setIsAuthenticated(false)
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/recommendations/login')
    }
  }, [isLoading, isAuthenticated, router])

  const handleLogout = () => {
    localStorage.removeItem('production-auth')
    localStorage.removeItem('production-user')
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
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  AI Recommendation System
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Upload your data and find the perfect people using AI-powered recommendations
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {user && (
                  <div className="text-sm text-gray-600">
                    Welcome, <span className="font-medium">{user.username}</span>
                    <div className="text-xs text-gray-500">
                      Since {new Date(user.loginTime).toLocaleString()}
                    </div>
                  </div>
                )}
                <Button onClick={handleLogout} variant="outline">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  className={`flex items-center space-x-2 flex-1 justify-center ${
                    activeTab === tab.id 
                      ? 'bg-white shadow-sm' 
                      : 'hover:bg-gray-200'
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
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
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
                <ProductionUploadInterface 
                  onUploadSuccess={() => setActiveTab('datasets')}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'datasets' && (
            <ProductionDatasetManager 
              onSelectDataset={(dataset) => {
                console.log('Selected dataset:', dataset)
                setSelectedDataset(dataset)
                setActiveTab('query')
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
              forceReset={forceQueryReset}
            />
          )}

          {activeTab === 'history' && (
            <ProductionQueryHistory 
              activeSearchId={activeSearchId}
              onRerunQuery={(query, datasetId) => {
                // Find the dataset in our current datasets and select it
                // For now, we'll just switch to query tab with the query filled
                setActiveTab('query')
                // Note: We'd need to implement query prefilling in the QueryInterface
                console.log('Rerun query:', query, 'for dataset:', datasetId)
              }}
              onNewSearch={() => setActiveTab('query')}
            />
          )}
        </div>
      </div>
    </div>
  )
}