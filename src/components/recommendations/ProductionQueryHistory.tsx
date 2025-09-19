'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
    data: Record<string, unknown>
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
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now())

  const loadHistory = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true)
    }
    try {
      const response = await fetch('/api/recommendations/query-history')
      
      if (response.ok) {
        const data = await response.json()
        // Transform database format to component format
        const transformedQueries = data.queries.map((query: Record<string, unknown>) => ({
          id: query.id as string,
          query: query.query as string,
          datasetId: query.dataset_id as string,
          datasetName: query.dataset_name as string,
          results: (query.results as Array<{id: string, data: Record<string, unknown>, match_score: number, match_reasons: string[]}>) || [],
          metadata: (query.metadata as {total_found?: number, processing_time?: number, error?: string}) || { total_found: 0, processing_time: 0 },
          timestamp: query.created_at as string,
          status: query.status as 'processing' | 'completed' | 'error',
          processingStages: (query.processing_stages as ProcessingStage[]) || []
        }))
        setHistory(transformedQueries)
        setLastUpdateTime(Date.now())
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
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  // Monitor active search with smart polling - only when not actively being updated elsewhere
  useEffect(() => {
    if (activeSearchId) {
      // Much less frequent polling since MultiStageQueryInterface handles real-time updates
      // Only refresh when user might have switched tabs or lost focus
      const interval = setInterval(() => {
        // Only poll if document is visible and we haven't updated recently
        const timeSinceLastUpdate = Date.now() - lastUpdateTime
        if (!document.hidden && timeSinceLastUpdate > 25000) {
          loadHistory(false) // Don't show loading spinner for background updates
        }
      }, 30000) // Refresh every 30 seconds when there's an active search

      return () => clearInterval(interval)
    }
  }, [activeSearchId, lastUpdateTime])

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
      return `Found: ${name}`
    }
    
    return `${results.length} results, top: ${name}`
  }

  const renderProcessingProgress = (entry: QueryHistoryEntry) => {
    // If completed, show success state
    if (entry.status === 'completed') {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-green-700">Search completed successfully!</span>
              <Progress value={100} className="h-3 mt-1" />
            </div>
            <span className="text-sm font-medium text-green-600">100%</span>
          </div>
        </div>
      )
    }

    // If error, show error state
    if (entry.status === 'error') {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-red-700">Search failed</span>
              <Progress value={0} className="h-3 mt-1" />
            </div>
            <span className="text-sm font-medium text-red-600">Error</span>
          </div>
        </div>
      )
    }

    // If processing, get progress directly from cloud function metadata
    const metadata = entry.metadata as { current_stage?: string, stage_message?: string, progress?: number } | undefined
    
    // Get current stage info from cloud function
    const currentStage = metadata?.current_stage || '🚀 CRITERIA'
    const stageMessage = metadata?.stage_message || 'Starting AI search...'
    const cloudFunctionProgress = metadata?.progress || 0

    // Calculate overall progress based on cloud function stage and progress
    const stageMap = {
      'CRITERIA': { base: 0, weight: 25 },    // 0-25%
      'DATASET': { base: 25, weight: 25 },    // 25-50% 
      'BM25': { base: 50, weight: 25 },       // 50-75%
      'LLM': { base: 75, weight: 25 }         // 75-100%
    }
    
    // Extract stage name from cloud function format (e.g. "🚀 CRITERIA" -> "CRITERIA")
    const stageName = currentStage.includes(' ') ? currentStage.split(' ')[1] : currentStage
    const stageConfig = stageMap[stageName as keyof typeof stageMap] || stageMap.CRITERIA
    
    // Calculate overall progress: base progress + (stage progress * stage weight / 100)
    const overallProgress = Math.min(100, stageConfig.base + (cloudFunctionProgress * stageConfig.weight / 100))

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900">{stageMessage}</span>
            <Progress value={overallProgress} className="h-3 mt-1" />
          </div>
          <span className="text-sm font-medium text-blue-600">{Math.round(overallProgress)}%</span>
        </div>
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
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <History className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
            Query History
          </h2>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Review and rerun your previous AI searches
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:gap-2">
          {onNewSearch && (
            <Button onClick={onNewSearch} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto min-h-[44px]">
              <Plus className="h-4 w-4 mr-2" />
              New Search
            </Button>
          )}
          <Button variant="outline" onClick={() => loadHistory()} size="sm" className="w-full sm:w-auto min-h-[44px]">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {history.length > 0 && (
            <Button variant="outline" onClick={clearHistory} size="sm" className="text-red-600 hover:text-red-700 w-full sm:w-auto min-h-[44px]">
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
            <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
              <span className="text-sm md:text-base">Search in progress! You can continue searching while we process your request.</span>
              {onNewSearch && (
                <Button variant="outline" size="sm" onClick={onNewSearch} className="w-full md:w-auto md:ml-4 min-h-[44px]">
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
          <CardContent className="text-center py-8 md:py-12 px-4">
            <History className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400 mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No queries yet</h3>
            <p className="text-sm md:text-base text-gray-500 mb-6">
              Your AI search history will appear here after you run some queries.
            </p>
            {onNewSearch ? (
              <Button onClick={onNewSearch} className="w-full sm:w-auto min-h-[44px]">
                <Search className="h-4 w-4 mr-2" />
                Start Searching
              </Button>
            ) : (
              <Button onClick={() => window.location.reload()} className="w-full sm:w-auto min-h-[44px]">
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
              <CardContent className="p-4 md:p-6">
                {/* Entry Header */}
                <div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        {isProcessing ? (
                          <Brain className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        ) : isError ? (
                          <Search className="h-4 w-4 text-red-600 flex-shrink-0" />
                        ) : (
                          <Search className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        )}
                        <span className="font-medium text-base md:text-lg truncate pr-2">&quot;{entry.query}&quot;</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
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
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Database className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{entry.datasetName}</span>
                      </div>
                      {entry.results && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 flex-shrink-0" />
                          <span>{entry.results.length} results</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>{formatTimeAgo(entry.timestamp)}</span>
                      </div>
                      {entry.metadata?.processing_time && (
                        <div className="flex items-center gap-1 hidden md:flex">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span>{entry.metadata.processing_time}ms</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:gap-2 md:ml-4">
                    {onRerunQuery && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRerunQuery(entry.query, entry.datasetId)}
                        className="w-full sm:w-auto min-h-[44px] px-4"
                      >
                        <Search className="h-3 w-3 mr-1" />
                        Rerun
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEntry(entry.id)}
                      className="text-red-600 hover:text-red-700 w-full sm:w-auto min-h-[44px] px-4"
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
                     {renderProcessingProgress(entry)}
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
                                {String(Object.values(result.data)[0]) || `Result ${index + 1}`}
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
