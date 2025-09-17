'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  ArrowLeft, 
  Brain,
  Sparkles,
  Cloud,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface AIQueryInterfaceProps {
  selectedDatasetId: string | null
  onBackToDatasets: () => void
}

interface RecommendationPerson {
  id: string
  name: string
  title: string
  company: string
  match_score: number
  match_reasons: string[]
}

export function AIQueryInterface({ selectedDatasetId, onBackToDatasets }: AIQueryInterfaceProps) {
  const [query, setQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleQuery = async () => {
    if (!query.trim() || !selectedDatasetId) return

    setIsProcessing(true)
    setError(null)
    setResults(null)

    try {
      // This will call the Google Cloud Function
      console.log('🚀 Sending query to Cloud Function:', {
        query: query.trim(),
        datasetId: selectedDatasetId
      })

      // Placeholder for Cloud Function call
      // TODO: Replace with actual Cloud Function endpoint
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate processing

      // Mock response for demonstration
      const mockResults = {
        success: true,
        query: query.trim(),
        criteria_used: {
          intent: "networking",
          target_persona: {
            roles: ["investor", "founder"],
            experience_level: "experienced",
            industries: ["healthcare", "ai"]
          }
        },
        recommendations: [
          {
            id: "1",
            name: "Dr. Sarah Chen",
            title: "VP of Engineering",
            company: "HealthTech AI",
            match_score: 0.92,
            match_reasons: ["Healthcare expertise", "AI experience", "Leadership role"]
          },
          {
            id: "2", 
            name: "Michael Rodriguez",
            title: "Founder & CEO",
            company: "MedConnect",
            match_score: 0.88,
            match_reasons: ["Healthcare startup experience", "Fundraising success"]
          }
        ],
        metadata: {
          total_found: 2,
          processing_time: 1250
        }
      }

      setResults(mockResults)

    } catch (queryError) {
      console.error('❌ Query failed:', queryError)
      setError(queryError instanceof Error ? queryError.message : 'Failed to process query')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!selectedDatasetId) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No dataset selected</h3>
          <p className="text-gray-500 mb-6">
            Please select a dataset from your collection to start getting AI recommendations.
          </p>
          <Button onClick={onBackToDatasets}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Datasets
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>AI Query Interface</span>
              </CardTitle>
              <CardDescription>
                Ask natural language questions about your data using AI and BigQuery analytics
              </CardDescription>
            </div>
            <Button onClick={onBackToDatasets} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Datasets
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>Natural Language Query</span>
          </CardTitle>
          <CardDescription>
            Describe who you&apos;re looking for in natural language. Our AI will understand and find relevant matches.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="query">Your Query</Label>
            <Textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., &apos;Find healthcare founders with AI experience who have raised Series A&apos; or &apos;Show me the coolest people with investments in energy&apos;"
              className="min-h-[100px]"
              disabled={isProcessing}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Example queries:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• &quot;AI founder raising seed round looking for healthcare investors&quot;</li>
              <li>• &quot;10 of the coolest people with investments in energy&quot;</li>
              <li>• &quot;Senior engineers with fintech experience in San Francisco&quot;</li>
              <li>• &quot;Female founders in biotech who have raised Series A&quot;</li>
            </ul>
          </div>

          <Button
            onClick={handleQuery}
            disabled={!query.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing with AI & BigQuery...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Get AI Recommendations
              </>
            )}
          </Button>
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
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>AI Recommendations</span>
            </CardTitle>
            <CardDescription>
              Found {(results.metadata as {total_found: number, processing_time: number}).total_found} matches in {(results.metadata as {total_found: number, processing_time: number}).processing_time}ms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Query Analysis */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">AI Query Analysis:</h4>
                <p className="text-sm text-gray-600">AI processed your query and identified relevant matches.</p>
              </div>

              {/* Recommendations */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Top Recommendations:</h4>
                {(results.recommendations as RecommendationPerson[]).map((person: RecommendationPerson, index: number) => (
                  <div key={person.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <h3 className="font-semibold text-gray-900">{person.name}</h3>
                          <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                            {Math.round(person.match_score * 100)}% match
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{person.title} at {person.company}</p>
                        <div className="flex flex-wrap gap-2">
                          {person.match_reasons.map((reason: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cloud Function Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <Cloud className="h-4 w-4" />
            <span>Ready for Google Cloud Function integration</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
