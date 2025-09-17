'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  ChevronUp
} from 'lucide-react'

interface QueryHistoryEntry {
  id: string
  query: string
  datasetId: string
  datasetName: string
  results: Array<{
    id: string
    data: Record<string, unknown>
    match_score: number
    match_reasons: string[]
  }>
  metadata: {
    total_found: number
    processing_time: number
  }
  timestamp: string
}

interface QueryHistoryProps {
  onRerunQuery?: (query: string, datasetId: string) => void
}

export function ProductionQueryHistory({ onRerunQuery }: QueryHistoryProps) {
  const [history, setHistory] = useState<QueryHistoryEntry[]>([])
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  const loadHistory = () => {
    setIsLoading(true)
    try {
      const stored = localStorage.getItem('query-history')
      const data = stored ? JSON.parse(stored) : []
      setHistory(data)
    } catch (error) {
      console.error('Failed to load query history:', error)
      setHistory([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all query history? This action cannot be undone.')) {
      localStorage.removeItem('query-history')
      setHistory([])
    }
  }

  const deleteEntry = (id: string) => {
    const updated = history.filter(entry => entry.id !== id)
    setHistory(updated)
    localStorage.setItem('query-history', JSON.stringify(updated))
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
    if (results.length === 0) return 'No results found'
    
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

      {/* History Content */}
      {history.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No queries yet</h3>
            <p className="text-gray-500 mb-6">
              Your AI search history will appear here after you run some queries.
            </p>
            <Button onClick={() => window.location.reload()}>
              <Search className="h-4 w-4 mr-2" />
              Start Searching
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <Card key={entry.id} className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                {/* Entry Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-lg">&quot;{entry.query}&quot;</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        <span>{entry.datasetName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{entry.metadata.total_found} results</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{entry.metadata.processing_time}ms</span>
                      </div>
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

                {/* Quick Results Preview */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-700">{getResultPreview(entry.results)}</p>
                </div>

                {/* Expand/Collapse for Full Results */}
                {entry.results.length > 0 && (
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
          ))}
        </div>
      )}
    </div>
  )
}
