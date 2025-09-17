'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  History, 
  Search, 
  Trash2, 
  Calendar, 
  Database, 
  Users, 
  Star,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Brain,
  Plus
} from 'lucide-react'

interface ProcessingStage {
  stage: string
  message: string
  progress: number
  completed: boolean
}

interface QueryHistoryEntry {
  id: string
  query: string
  datasetId: string
  datasetName: string
  results?: Array<{
    id: string
    data: Record<string, any>
    match_score: number
    match_reasons: string[]
  }>
  metadata?: {
    total_found?: number
    processing_time?: number
    error?: string
  }
  timestamp: string
  status?: 'processing' | 'completed' | 'error'
  processingStages?: ProcessingStage[]
}

interface QueryHistoryProps {
  activeSearchId?: string | null
  onRerunQuery?: (query: string, datasetId: string) => void
  onNewSearch?: () => void
}

export function ProductionQueryHistory({ 
  activeSearchId, 
  onRerunQuery, 
  onNewSearch 
}: QueryHistoryProps) {
  const [history, setHistory] = useState<QueryHistoryEntry[]>([])
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  const loadHistory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/recommendations/query-history')
      
      if (response.ok) {
        const data = await response.json()
        // Transform database format to component format
        const transformedQueries = data.queries.map((query: any) => ({
          id: query.id,
          query: query.query,
          datasetId: query.dataset_id,
          datasetName: query.dataset_name,
          results: query.results || [],
          metadata: query.metadata || { total_found: 0, processing_time: 0 },
          timestamp: query.created_at,
          status: query.status,
          processingStages: query.processing_stages || []
        }))
        setHistory(transformedQueries)
      } else {
        console.warn('Failed to fetch from database, falling back to localStorage')
        // Fallback to localStorage
        const stored = localStorage.getItem('query-history')
        const data = stored ? JSON.parse(stored) : []
        setHistory(data)
      }
    } catch (error) {
      console.error('Failed to load query history:', error)
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('query-history')
        const data = stored ? JSON.parse(stored) : []
        setHistory(data)
      } catch (localError) {
        console.error('Failed to load from localStorage too:', localError)
        setHistory([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  // Monitor active search and refresh history (less frequently to reduce load)
  useEffect(() => {
    if (activeSearchId) {
      // Only refresh every 10 seconds since MultiStageQueryInterface is already polling every 2 seconds
      const interval = setInterval(() => {
        loadHistory()
      }, 10000) // Refresh every 10 seconds when there's an active search

      return () => clearInterval(interval)
    }
  }, [activeSearchId])

  const clearHistory = async () => {
    if (confirm('Are you sure you want to clear all query history? This action cannot be undone.')) {
      try {
        // Delete all queries for the user (we'd need a bulk delete endpoint)
        // For now, delete each query individually
        const deletePromises = history.map(entry => 
          fetch(`/api/recommendations/query-history/${entry.id}`, { method: 'DELETE' })
        )
        await Promise.all(deletePromises)
        setHistory([])
      } catch (error) {
        console.error('Failed to clear history from database:', error)
        // Fallback to localStorage
        localStorage.removeItem('query-history')
        setHistory([])
      }
    }
  }

  const deleteEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/recommendations/query-history/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setHistory(prev => prev.filter(entry => entry.id !== id))
      } else {
        throw new Error('Failed to delete from database')
      }
    } catch (error) {
      console.error('Failed to delete entry from database:', error)
      // Fallback to localStorage
      const updated = history.filter(entry => entry.id !== id)
      setHistory(updated)
      localStorage.setItem('query-history', JSON.stringify(updated))
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedEntries)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedEntries(newExpanded)
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getResultPreview = (results: QueryHistoryEntry['results']) => {
    if (!results || results.length === 0) return 'No results found'
    
    const topResult = results[0]
    const nameField = Object.keys(topResult.data).find(key => 
      key.toLowerCase().includes('name')
    )
    const name = nameField ? topResult.data[nameField] : 'Person'
    
    if (results.length === 1) {
      return `Found: ${name} (score: ${topResult.match_score})`
    }
    
    return `${results.length} results, top: ${name} (score: ${topResult.match_score})`
  }

  const renderProcessingStages = (stages: ProcessingStage[]) => {
    return (
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={stage.stage} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {stage.completed ? (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                    {stage.progress > 0 ? (
                      <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                    ) : (
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900">{stage.message}</span>
              </div>
              <span className="text-xs text-gray-500">{Math.round(stage.progress)}%</span>
            </div>
            <Progress value={stage.progress} className="h-2" />
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading query history...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-purple-500" />
            Query History
          </h2>
          <p className="text-gray-600 mt-1">
            Review and rerun your previous AI searches
          </p>
        </div>
        <div className="flex gap-2">
          {onNewSearch && (
            <Button onClick={onNewSearch} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Search
            </Button>
          )}
          <Button variant="outline" onClick={loadHistory} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {history.length > 0 && (
            <Button variant="outline" onClick={clearHistory} size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Active search notice */}
      {activeSearchId && (
        <Alert className="border-blue-200 bg-blue-50">
          <Brain className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <span>Search in progress! You can continue searching while we process your request.</span>
              {onNewSearch && (
                <Button variant="outline" size="sm" onClick={onNewSearch} className="ml-4">
                  <Plus className="h-3 w-3 mr-1" />
                  New Search
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* History Content */}
      {history.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No queries yet</h3>
            <p className="text-gray-500 mb-6">
              Your AI search history will appear here after you run some queries.
            </p>
            {onNewSearch ? (
              <Button onClick={onNewSearch}>
                <Search className="h-4 w-4 mr-2" />
                Start Searching
              </Button>
            ) : (
              <Button onClick={() => window.location.reload()}>
                <Search className="h-4 w-4 mr-2" />
                Start Searching
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => {
            const isActiveSearch = activeSearchId === entry.id
            const isProcessing = entry.status === 'processing'
            const isError = entry.status === 'error'
            const isCompleted = entry.status === 'completed'
            
            return (
            <Card key={entry.id} className={`border-l-4 ${
              isProcessing ? 'border-l-blue-500' : 
              isError ? 'border-l-red-500' : 
              'border-l-purple-500'
            } ${isActiveSearch ? 'ring-2 ring-blue-300' : ''}`}>
              <CardContent className="p-4">
                {/* Entry Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {isProcessing ? (
                        <Brain className="h-4 w-4 text-blue-600" />
                      ) : isError ? (
                        <Search className="h-4 w-4 text-red-600" />
                      ) : (
                        <Search className="h-4 w-4 text-purple-600" />
                      )}
                      <span className="font-medium text-lg">"{entry.query}"</span>
                      
                      {isProcessing && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processing
                        </Badge>
                      )}
                      {isError && (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          Error
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Completed
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        <span>{entry.datasetName}</span>
                      </div>
                      {entry.results && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{entry.results.length} results</span>
                        </div>
                      )}
                      {entry.metadata?.processing_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{entry.metadata.processing_time}ms</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatTimeAgo(entry.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {onRerunQuery && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRerunQuery(entry.query, entry.datasetId)}
                      >
                        <Search className="h-3 w-3 mr-1" />
                        Rerun
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEntry(entry.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Content based on status */}
                {isProcessing && entry.processingStages ? (
                  <div className="bg-blue-50 rounded-lg p-4 mb-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">AI Processing in Progress</span>
                    </div>
                    {renderProcessingStages(entry.processingStages)}
                  </div>
                ) : isError ? (
                  <div className="bg-red-50 rounded-lg p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium text-red-900">Search Failed</span>
                    </div>
                    <p className="text-sm text-red-700">
                      {entry.metadata?.error || 'An error occurred while processing your search.'}
                    </p>
                  </div>
                ) : entry.results ? (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-700">{getResultPreview(entry.results)}</p>
                  </div>
                ) : null}

                {/* Expand/Collapse for Full Results */}
                {entry.results && entry.results.length > 0 && (
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(entry.id)}
                      className="w-full justify-center"
                    >
                      {expandedEntries.has(entry.id) ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-2" />
                          Hide Results
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Show All {entry.results.length} Results
                        </>
                      )}
                    </Button>

                    {/* Expanded Results */}
                    {expandedEntries.has(entry.id) && (
                      <div className="mt-4 space-y-3 border-t pt-4">
                        {entry.results.map((result, index) => (
                          <div key={result.id} className="bg-white border rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">
                                {Object.values(result.data)[0] || `Result ${index + 1}`}
                              </h4>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-sm font-medium">{result.match_score}</span>
                              </div>
                            </div>
                            
                            {result.match_reasons.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {result.match_reasons.map((reason, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            <details className="text-xs">
                              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                                View raw data
                              </summary>
                              <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </details>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
