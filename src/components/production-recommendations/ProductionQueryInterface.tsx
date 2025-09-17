'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Search, ArrowLeft, Sparkles, User, Building, MapPin, Star, AlertCircle, Loader2 } from 'lucide-react'
import { formatSchemaForAI, type DatasetSchema } from '@/lib/dataset-analysis'

interface SelectedDataset {
  id: string
  originalName: string
  gcsPath: string
  uploadedAt: string
  fileSize: number
  status: 'uploaded' | 'processing' | 'completed' | 'failed'
  metadata?: Record<string, string>
}

interface QueryInterfaceProps {
  selectedDataset: SelectedDataset | null
  datasetSchema?: DatasetSchema
  onBackToDatasets: () => void
}

interface RecommendationResult {
  id: string
  data: Record<string, any>
  match_score: number
  match_reasons: string[]
}

interface QueryResponse {
  success: boolean
  query: string
  criteria_used: any
  recommendations: RecommendationResult[]
  metadata: {
    total_found: number
    processing_time: number
  }
  error?: string
}

export function ProductionQueryInterface({ 
  selectedDataset, 
  datasetSchema,
  onBackToDatasets 
}: QueryInterfaceProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<RecommendationResult[]>([])
  const [lastQuery, setLastQuery] = useState('')
  const [metadata, setMetadata] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Query history management
  const saveToHistory = (queryData: {
    query: string
    datasetId: string
    datasetName: string
    results: RecommendationResult[]
    metadata: any
    timestamp: string
  }) => {
    const history = JSON.parse(localStorage.getItem('query-history') || '[]')
    const newEntry = {
      id: Date.now().toString(),
      ...queryData
    }
    history.unshift(newEntry) // Add to beginning
    localStorage.setItem('query-history', JSON.stringify(history.slice(0, 50))) // Keep only last 50
  }

  const handleSearch = async () => {
    if (!query.trim() || !selectedDataset) return

    setIsSearching(true)
    setError(null)
    setResults([])

    try {
      const requestBody = {
        query: query.trim(),
        datasetId: selectedDataset.id,
        datasetSchema: datasetSchema ? formatSchemaForAI(datasetSchema) : undefined,
        limit: 10
      }

      console.log('🔍 Sending request to Cloud Function:', requestBody)

      const response = await fetch('https://us-central1-snowball-471001.cloudfunctions.net/getRecommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: QueryResponse = await response.json()
      
      if (data.success) {
        setResults(data.recommendations)
        setMetadata(data.metadata)
        setLastQuery(query)
        
        // Save to history
        saveToHistory({
          query: query.trim(),
          datasetId: selectedDataset.id,
          datasetName: selectedDataset.originalName,
          results: data.recommendations,
          metadata: data.metadata,
          timestamp: new Date().toISOString()
        })
        
        console.log('✅ Received recommendations:', data)
      } else {
        throw new Error(data.error || 'Unknown error occurred')
      }

    } catch (err: any) {
      console.error('❌ Search error:', err)
      setError(err.message || 'Failed to get recommendations. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  const getFieldValue = (person: Record<string, any>, fieldPattern: string[]) => {
    const field = Object.keys(person).find(key => 
      fieldPattern.some(pattern => key.toLowerCase().includes(pattern.toLowerCase()))
    )
    return field ? person[field] : null
  }

  const sampleQueries = [
    "Find healthcare investors in San Francisco",
    "Show me senior engineers with AI experience",
    "Find founders who have raised Series A funding",
    "Healthcare executives in Boston area",
    "Find VCs who invest in early stage startups"
  ]

  if (!selectedDataset) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Please select a dataset first to start searching.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-500" />
            AI-Powered Search
          </h2>
          <p className="text-gray-600 mt-1">
            Use natural language to find the perfect people in your dataset
          </p>
        </div>
        <Button variant="outline" onClick={onBackToDatasets}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Datasets
        </Button>
      </div>

      {/* Dataset Context */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 text-lg flex items-center gap-2">
                📊 Analyzing Dataset: {selectedDataset.originalName}
              </h3>
              <div className="flex items-center gap-4 text-sm text-blue-700 mt-2">
                {datasetSchema && (
                  <>
                    <span>📋 {datasetSchema.totalRows} records</span>
                    <span>🏷️ {datasetSchema.fields.length} fields</span>
                  </>
                )}
                <span>📅 Uploaded {new Date(selectedDataset.uploadedAt).toLocaleDateString()}</span>
                <span>💾 {(selectedDataset.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              {selectedDataset.status === 'uploaded' ? 'Ready for AI' : selectedDataset.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle>What are you looking for?</CardTitle>
          <CardDescription>
            Describe the type of person you want to find. Be specific about roles, industries, locations, or experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-query">Your query</Label>
            <Input
              id="search-query"
              placeholder="e.g., Find healthcare investors in San Francisco with 10+ years experience"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSearching}
              className="text-lg p-4"
            />
          </div>

            <Button 
              onClick={handleSearch} 
              disabled={!query.trim() || isSearching}
              size="lg"
              className="w-full"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Find People
                </>
              )}
            </Button>

            {/* Loading State Details */}
            {isSearching && (
              <Card className="border-orange-200 bg-orange-50/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-900">AI Processing Your Query</p>
                      <p className="text-sm text-orange-700">
                        Understanding your request → Analyzing dataset schema → Applying smart filters → Ranking results
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Sample Queries */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-500">Try these examples:</Label>
            <div className="flex flex-wrap gap-2">
              {sampleQueries.map((sample, index) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => setQuery(sample)}
                >
                  {sample}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {(results.length > 0 || lastQuery) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {results.length > 0 ? `Results for "${lastQuery}"` : 'No results found'}
              </CardTitle>
              {metadata && (
                <div className="text-sm text-gray-500">
                  {metadata.total_found} found • {metadata.processing_time}ms
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria or using different keywords.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <Card key={result.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-gray-400" />
                          <h3 className="font-medium text-lg">
                            {getFieldValue(result.data, ['name', 'full_name', 'fullname']) || 
                             getFieldValue(result.data, ['first_name', 'firstname']) || 
                             `Person ${index + 1}`}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">{result.match_score}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        {getFieldValue(result.data, ['title', 'role', 'position']) && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {getFieldValue(result.data, ['title', 'role', 'position'])}
                            </span>
                          </div>
                        )}
                        
                        {getFieldValue(result.data, ['company', 'organization', 'firm']) && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {getFieldValue(result.data, ['company', 'organization', 'firm'])}
                            </span>
                          </div>
                        )}

                        {getFieldValue(result.data, ['location', 'city', 'address']) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {getFieldValue(result.data, ['location', 'city', 'address'])}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Match Reasons */}
                      {result.match_reasons && result.match_reasons.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500">Why this person matches:</Label>
                          <div className="flex flex-wrap gap-1">
                            {result.match_reasons.map((reason, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Data */}
                      <details className="mt-3">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          View all data
                        </summary>
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
                          <pre>{JSON.stringify(result.data, null, 2)}</pre>
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
