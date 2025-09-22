'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  ArrowLeft, 
  Sparkles, 
  User, 
  Building, 
  MapPin, 
  Star, 
  AlertCircle, 
  Loader2,
  MessageSquare,
  Brain,
  Zap,
  Database,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import { formatSchemaForAI, type DatasetSchema } from '@/lib/dataset-analysis'
import { getAuthHeaders } from '@/lib/auth-helpers'

interface SelectedDataset {
  id: string
  originalName: string
  customName?: string
  gcsPath: string
  uploadedAt: string
  fileSize: number
  status: 'uploaded' | 'processing' | 'completed' | 'failed' | 'error' | 'processed'
  metadata?: Record<string, unknown>
}

interface RerunQueryData {
  query: string
  datasetId: string
  datasetName: string
}

interface MultiStageQueryProps {
  selectedDataset: SelectedDataset | null
  datasetSchema?: DatasetSchema
  onBackToDatasets: () => void
  onSearchStarted?: (searchId: string) => void
  onUsageLimitExceeded?: () => void // Callback when usage limit is exceeded
  forceReset?: boolean // Add prop to force component reset
  rerunData?: RerunQueryData | null // Data for rerunning a historical query
  onRerunComplete?: () => void // Callback when rerun setup is complete
}

interface FollowUpQuestion {
  id: string
  question: string
  type: 'multiple_choice'
  options: string[]
  required: boolean
}

interface ProcessingStage {
  stage: string
  message: string
  progress: number
  completed: boolean
}

interface EnhancedResult {
  id: string
  data: Record<string, unknown>
  bm25_score: number
  llm_relevance_score: number
  overall_score: number
  llm_analysis: string
  match_strengths: string[]
  potential_concerns: string[]
  cultural_fit_assessment: string
  recommendation: string
  field_matches: Record<string, string[]>
  match_reasons: string[]
  display_name?: string
}

export function MultiStageQueryInterface({ 
  selectedDataset, 
  datasetSchema,
  onBackToDatasets,
  onSearchStarted,
  onUsageLimitExceeded,
  forceReset = false,
  rerunData = null,
  onRerunComplete
}: MultiStageQueryProps) {
  const [currentStage, setCurrentStage] = useState<'input' | 'questions' | 'processing' | 'results'>('input')
  const [query, setQuery] = useState('')
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [candidateCount, setCandidateCount] = useState<number>(10)
  const [wantExtensiveQuestions, setWantExtensiveQuestions] = useState<boolean>(false)
  const [excludedQuestions, setExcludedQuestions] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([])
  const [results, setResults] = useState<EnhancedResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null)
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [pollingStartTime, setPollingStartTime] = useState<number | null>(null)
  const [, setTimerTick] = useState(0) // Force re-renders for timer updates
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // Function to cancel any ongoing query
  const cancelOngoingQuery = useCallback(() => {
    if (abortController) {
      console.log('🛑 Cancelling ongoing query...')
      abortController.abort()
      setAbortController(null)
    }
    if (processing) {
      setProcessing(false)
      setProcessingStages([])
      console.log('✅ Query cancelled')
    }
  }, [abortController, processing])

  // Function to reset all component state
  const resetComponentState = useCallback(() => {
    // Cancel any ongoing operations first
    cancelOngoingQuery()
    
    setCurrentStage('input')
    setQuery('')
    setAnswers({})
    setFollowUpQuestions([])
    setResults([])
    setError(null)
    setMetadata(null)
    setProcessing(false)
    setActiveQueryId(null)
    setProcessingStages([])
    setHasUserInteracted(false)
    setPollingStartTime(null)
    localStorage.removeItem('ai-search-state')
  }, [cancelOngoingQuery])

  // Reset component when forceReset prop changes or when no active search
  useEffect(() => {
    if (forceReset) {
      console.log('🔄 Force reset triggered - resetting component state')
      resetComponentState()
    }
  }, [forceReset, resetComponentState])

  // Handle rerun data - pre-fill query and cancel any ongoing operations
  useEffect(() => {
    if (rerunData) {
      console.log('🔄 Rerun data provided - setting up query rerun:', rerunData)
      
      // Cancel any ongoing queries first
      cancelOngoingQuery()
      
      // Reset state but keep the query from rerun data
      setCurrentStage('input')
      setQuery(rerunData.query)
      setAnswers({})
      setFollowUpQuestions([])
      setResults([])
      setError(null)
      setMetadata(null)
      setProcessing(false)
      setActiveQueryId(null)
      setProcessingStages([])
      setHasUserInteracted(true) // Mark as interacted since we're pre-filling
      setPollingStartTime(null)
      
      // Call callback to let parent know rerun setup is complete
      if (onRerunComplete) {
        onRerunComplete()
      }
    }
  }, [rerunData, onRerunComplete, cancelOngoingQuery])

  // Auto-reset when component mounts if no valid active search
  useEffect(() => {
    const savedState = localStorage.getItem('ai-search-state')
    if (savedState && selectedDataset?.id) {
      try {
        const parsed = JSON.parse(savedState)
        // Only restore if it's for the current dataset and has recent activity
        const lastSaved = new Date(parsed.lastSaved || 0).getTime()
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
        
        if (parsed.datasetId === selectedDataset.id && lastSaved > fiveMinutesAgo) {
          // Valid saved state - restore it
          console.log('🔄 Restoring valid saved state')
          return // Don't reset, will be restored below
        }
      } catch {
        console.warn('❌ Invalid saved state, resetting')
      }
    }
    
    // No valid saved state or different dataset - reset to fresh start
    console.log('🔄 No valid saved state - starting fresh')
    resetComponentState()
  }, [selectedDataset?.id, resetComponentState])

  // Save and restore state
  useEffect(() => {
    // Always try to restore state when component mounts or dataset changes
    const restoreState = () => {
      const savedState = localStorage.getItem('ai-search-state')
      if (savedState && selectedDataset?.id) {
        try {
          const parsed = JSON.parse(savedState)
          if (parsed.datasetId === selectedDataset.id) {
            setCurrentStage(parsed.currentStage || 'input')
            setQuery(parsed.query || '')
            setFollowUpQuestions(parsed.followUpQuestions || [])
            setAnswers(parsed.answers || {})
            setCandidateCount(parsed.candidateCount || 10)
            setProcessing(parsed.processing || false)
            setResults(parsed.results || [])
            setError(parsed.error || null)
            setMetadata(parsed.metadata || null)
            setProcessingStages(parsed.processingStages || [])
            setActiveQueryId(parsed.activeQueryId || null)
            setHasUserInteracted(parsed.hasUserInteracted || false)
            setPollingStartTime(parsed.pollingStartTime || null)
          } else {
            localStorage.removeItem('ai-search-state')
          }
        } catch (e) {
          console.warn('❌ Failed to restore AI search state:', e)
          localStorage.removeItem('ai-search-state')
        }
      }
    }

    restoreState()
  }, [selectedDataset?.id])

  // Also restore state when component becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedDataset?.id) {
        const savedState = localStorage.getItem('ai-search-state')
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState)
            if (parsed.datasetId === selectedDataset.id && parsed.currentStage !== currentStage) {
              setCurrentStage(parsed.currentStage || 'input')
              setQuery(parsed.query || '')
              setFollowUpQuestions(parsed.followUpQuestions || [])
              setAnswers(parsed.answers || {})
              setCandidateCount(parsed.candidateCount || 10)
              setProcessing(parsed.processing || false)
              setResults(parsed.results || [])
              setError(parsed.error || null)
              setMetadata(parsed.metadata || null)
              setProcessingStages(parsed.processingStages || [])
              setActiveQueryId(parsed.activeQueryId || null)
              setHasUserInteracted(parsed.hasUserInteracted || false)
              setPollingStartTime(parsed.pollingStartTime || null)
            }
          } catch (e) {
            console.warn('❌ Failed to restore state on visibility change:', e)
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [selectedDataset?.id, currentStage])

  // Save state with debouncing and better performance
  useEffect(() => {
    if (selectedDataset?.id) {
      const timeoutId = setTimeout(() => {
        const stateToSave = {
          datasetId: selectedDataset.id,
          currentStage,
          query,
          followUpQuestions,
          answers,
          candidateCount,
          processing,
          results,
          error,
          metadata,
          processingStages,
          activeQueryId,
          hasUserInteracted,
          pollingStartTime,
          lastSaved: new Date().toISOString()
        }
        
        try {
          localStorage.setItem('ai-search-state', JSON.stringify(stateToSave))
        } catch (e) {
          console.warn('Failed to save AI search state:', e)
        }
      }, 300) // Debounce saves by 300ms
      
      return () => clearTimeout(timeoutId)
    }
  }, [selectedDataset?.id, currentStage, query, followUpQuestions, answers, candidateCount, processing, results, error, metadata, processingStages, activeQueryId, hasUserInteracted, pollingStartTime])

  // Force save state before component unmounts or dataset changes
  useEffect(() => {
    return () => {
      if (selectedDataset?.id && (query || currentStage !== 'input')) {
        const stateToSave = {
          datasetId: selectedDataset.id,
          currentStage,
          query,
          followUpQuestions,
          answers,
          candidateCount,
          processing,
          results,
          error,
          metadata,
          processingStages,
          activeQueryId,
          hasUserInteracted,
          pollingStartTime,
          lastSaved: new Date().toISOString()
        }
        
        try {
          localStorage.setItem('ai-search-state', JSON.stringify(stateToSave))
        } catch (e) {
          console.warn('Failed to force save state:', e)
        }
      }
    }
  }, [selectedDataset?.id, currentStage, query, followUpQuestions, answers, candidateCount, processing, results, error, metadata, processingStages, activeQueryId, hasUserInteracted, pollingStartTime])

  // Polling mechanism to check for query completion
  useEffect(() => {
    if (!activeQueryId || !processing) {
      setPollingStartTime(null)
      return
    }

    // Set polling start time when we begin polling
    if (!pollingStartTime) {
      setPollingStartTime(Date.now())
    }

    const POLLING_TIMEOUT = 5 * 60 * 1000 // 5 minutes timeout
    
    let timeoutId: NodeJS.Timeout | null = null
    let isCancelled = false
    
    const pollForCompletion = async () => {
      if (isCancelled) return
      
      try {
        // Check if we've exceeded the timeout
        if (pollingStartTime && Date.now() - pollingStartTime > POLLING_TIMEOUT) {
          console.warn('⏰ Polling timeout reached - stopping search')
          setError('Search is taking longer than expected. Please try again or contact support.')
          setProcessing(false)
          setCurrentStage('questions')
          setActiveQueryId(null)
          setPollingStartTime(null)
          return
        }

        const response = await fetch(`/api/recommendations/query-history/${activeQueryId}`, {
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const data = await response.json()
          const query = data.query
          
          if (query.status === 'completed' && query.results) {
            // Query completed - update UI
            setResults(query.results)
            setMetadata(query.metadata)
            setProcessing(false)
            setCurrentStage('results')
            setActiveQueryId(null)
            setPollingStartTime(null)
            
            // Update processing stages to show completion
            setProcessingStages(prev => prev.map(stage => ({ 
              ...stage, 
              progress: 100, 
              completed: true 
            })))
          } else if (query.status === 'processing') {
            // Update progress from cloud function
            const currentStage = query.metadata?.current_stage
            const stageMessage = query.metadata?.stage_message
            const progress = query.metadata?.progress || 0
            
            console.log(`📊 Cloud function progress: ${currentStage} - ${stageMessage} (${progress}%)`)
            console.log(`🔍 Full metadata:`, query.metadata)
            
            // Update processing stages based on cloud function feedback
            if (currentStage && stageMessage) {
              setProcessingStages(prev => {
                const stageMap: Record<string, number> = {
                  'questions': 0,
                  'criteria': 0,
                  'CRITERIA': 0,
                  'dataset': 1,
                  'DATASET': 1,
                  'search': 2,
                  'bm25': 2,
                  'BM25': 2,
                  'llm': 3,
                  'LLM': 3,
                  'refinement': 3
                }
                
                // Extract stage name - handle various formats
                let stageName = currentStage.toLowerCase()
                if (currentStage.includes(':')) {
                  stageName = currentStage.split(':')[0].toLowerCase().trim()
                }
                if (currentStage.includes(' ')) {
                  const parts = currentStage.split(' ')
                  stageName = parts[parts.length - 1].toLowerCase()
                }
                
                console.log(`🎯 Mapped stage "${currentStage}" → "${stageName}"`)
                
                const stageIndex = stageMap[stageName]
                if (stageIndex !== undefined) {
                  const updatedStages = prev.map((stage, index) => {
                    if (index < stageIndex) {
                      return { ...stage, progress: 100, completed: true }
                    } else if (index === stageIndex) {
                      return { ...stage, message: stageMessage, progress, completed: false }
                    }
                    return stage
                  })
                  console.log(`🔄 Updated stages:`, updatedStages)
                  return updatedStages
                } else {
                  console.warn(`❌ Unknown stage: ${stageName}`)
                }
                return prev
              })
            } else {
              console.warn(`⚠️ Missing stage info: currentStage=${currentStage}, stageMessage=${stageMessage}`)
            }
          } else if (query.status === 'error') {
            // Query failed
            setError(query.metadata?.error || 'Search failed')
            setProcessing(false)
            setCurrentStage('questions')
            setActiveQueryId(null)
            setPollingStartTime(null)
          }
          // If status is still 'processing', keep polling
        } else {
          // API call failed, but don't stop polling immediately
          console.warn('Failed to poll query status - API call failed')
        }
      } catch (error) {
        console.warn('Failed to poll query status:', error)
        // Don't stop polling immediately on network errors
      }
    }

    // Smart polling with exponential backoff and visibility check
    let pollCount = 0
    const maxPollCount = 150 // Maximum polls (10 minutes at 4s intervals)
    
    const smartPoll = () => {
      if (isCancelled) return
      
      // Only poll if document is visible to reduce unnecessary requests
      if (!document.hidden) {
        pollForCompletion()
      }
      
      pollCount++
      
      // Faster polling for better progress updates: start at 2s, increase to 4s after 20 polls
      const baseInterval = pollCount > 20 ? 4000 : 2000
      
      if (pollCount < maxPollCount && !isCancelled) {
        timeoutId = setTimeout(smartPoll, baseInterval)
      } else {
        console.warn('⏰ Maximum polling attempts reached')
        setError('Search is taking longer than expected. Please check Query History or try again.')
        setProcessing(false)
        setActiveQueryId(null)
        setPollingStartTime(null)
      }
    }
    
    // Initial poll
    smartPoll()
    
    // Return cleanup function
    return () => {
      isCancelled = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [activeQueryId, processing, pollingStartTime])

  // Auto-refresh when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && activeQueryId && processing) {
        // Trigger a fresh poll when user returns to the tab
        const pollOnce = async () => {
          try {
            const response = await fetch(`/api/recommendations/query-history/${activeQueryId}`, {
          headers: getAuthHeaders()
        })
            if (response.ok) {
              const data = await response.json()
              const query = data.query
              
              if (query.status === 'completed' && query.results) {
                setResults(query.results)
                setMetadata(query.metadata)
                setProcessing(false)
                setCurrentStage('results')
                setActiveQueryId(null)
                setPollingStartTime(null)
                setProcessingStages(prev => prev.map(stage => ({ 
                  ...stage, 
                  progress: 100, 
                  completed: true 
                })))
              }
            }
          } catch (error) {
            console.warn('Failed to refresh on visibility change:', error)
          }
        }
        
        pollOnce()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [activeQueryId, processing])

  // Update UI every 5 seconds when processing to show elapsed time (reduced frequency)
  useEffect(() => {
    if (!processing || !pollingStartTime) return

    const updateTimer = setInterval(() => {
      // Force a re-render to update the elapsed time display
      setTimerTick(prev => prev + 1)
    }, 5000) // Reduced from 1s to 5s to minimize re-renders

    return () => clearInterval(updateTimer)
  }, [processing, pollingStartTime])

  const saveToHistory = async (queryData: {
    id?: string
    query: string
    datasetId: string
    datasetName: string
    results?: EnhancedResult[]
    metadata?: Record<string, unknown>
    timestamp: string
    status?: 'processing' | 'completed' | 'error'
    processingStages?: ProcessingStage[]
    customId?: string
  }) => {
    try {
      if (queryData.id) {
        // Update existing query
        console.log('🔄 Updating query in database:', queryData.id)
        const response = await fetch('/api/recommendations/query-history', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            queryId: queryData.id,
            status: queryData.status,
            results: queryData.results,
            metadata: queryData.metadata,
            processingStages: queryData.processingStages
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`Failed to update query history: ${errorData.details || errorData.error}`)
        }
        
        return queryData.id
      } else {
        // Create new query
        console.log('📝 Creating new query in database')
        const response = await fetch('/api/recommendations/query-history', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            query: queryData.query,
            datasetId: queryData.datasetId,
            datasetName: queryData.datasetName,
            processingStages: queryData.processingStages,
            customId: queryData.customId
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          
          // Handle usage limit exceeded
          if (response.status === 429 && errorData.code === 'USAGE_LIMIT_EXCEEDED') {
            onUsageLimitExceeded?.()
            throw new Error(errorData.message || 'Daily search limit exceeded')
          }
          
          throw new Error(`Failed to save query history: ${errorData.details || errorData.error}`)
        }
        
        const result = await response.json()
        console.log('✅ Query created with UUID:', result.queryId)
        return result.queryId
      }
    } catch (error) {
      console.error('❌ Failed to save query history:', error)
      throw error // Don't fallback to localStorage, let the calling code handle the error
    }
  }

  const handleInitialQuery = async () => {
    if (!query.trim() || !selectedDataset) return

    setError(null)
    setProcessing(true)

    try {
      // Create AbortController for this request
      const controller = new AbortController()
      setAbortController(controller)

      // Stage 1: Get follow-up questions
      const response = await fetch('https://us-central1-snowball-471001.cloudfunctions.net/getRecommendationsV2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          stage: 'questions',
          query: query.trim(),
          datasetSchema: datasetSchema ? formatSchemaForAI(datasetSchema) : undefined,
          extensive_questions: wantExtensiveQuestions,
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.questions && Array.isArray(data.questions)) {
        setFollowUpQuestions(data.questions)
        setCurrentStage('questions')
      } else {
        throw new Error(data.error || 'Failed to generate follow-up questions')
      }

    } catch (err: unknown) {
      // Handle cancellation gracefully
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🛑 Request cancelled by user')
        return // Don't set error for cancellation
      }
      
      console.error('❌ Error getting follow-up questions:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate follow-up questions')
    } finally {
      setProcessing(false)
      setAbortController(null) // Clear the controller
    }
  }

  const handleFinalSearch = async () => {
    if (!selectedDataset) return

    setError(null)
    setProcessing(true)
    setCurrentStage('processing')
    
    // Initialize processing stages to match cloud function output
    const initialStages = [
      { stage: 'CRITERIA', message: 'Analyzing your requirements...', progress: 0, completed: false },
      { stage: 'DATASET', message: 'Searching through dataset...', progress: 0, completed: false },
      { stage: 'BM25', message: 'Finding relevant matches...', progress: 0, completed: false },
      { stage: 'LLM', message: 'AI analyzing candidates...', progress: 0, completed: false }
    ]
    setProcessingStages(initialStages)
    
    try {
      // Generate a custom ID for tracking (will be stored in metadata)
      const customTrackingId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Save initial search entry to database and get the actual UUID
      const actualQueryId = await saveToHistory({
        query: query.trim(),
        datasetId: selectedDataset.id,
        datasetName: selectedDataset.customName || selectedDataset.originalName,
        timestamp: new Date().toISOString(),
        status: 'processing',
        processingStages: initialStages,
        customId: customTrackingId
      })
      
      // Set the actual UUID returned from database
      setActiveQueryId(actualQueryId)
      
      // Call callback to redirect user to history tab
      if (onSearchStarted) {
        onSearchStarted(actualQueryId)
      }

      // Reset component state immediately to allow new searches (async processing)
      setTimeout(() => {
        console.log('🔄 Resetting component for new search after async start')
        resetComponentState()
      }, 2000) // Reset after 2 seconds to allow user to see the process started

      // Start progress animation
      let currentStageIndex = 0
      const progressTimer = setInterval(() => {
        setProcessingStages(prev => {
          return prev.map((stage, index) => {
            if (stage.completed) return stage
            
            if (index === currentStageIndex) {
              const newProgress = Math.min(stage.progress + Math.random() * 20 + 5, 95)
              const completed = newProgress >= 95 && currentStageIndex < prev.length - 1
              
              if (completed) {
                currentStageIndex++
              }
              
              return { ...stage, progress: newProgress, completed }
            }
            return stage
          })
        })
      }, 1500)

      // Process answers for cloud function
      const processedAnswers = Object.keys(answers).reduce((acc, key) => {
        if (key.endsWith('_other_text')) return acc
        
        const value = answers[key]
        if (value === 'Other') {
          const otherTextKey = `${key}_other_text`
          const customText = answers[otherTextKey]
          acc[key] = customText || 'Other'
        } else {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, string>)

      // Create AbortController for this search
      const controller = new AbortController()
      setAbortController(controller)

      // Start cloud function asynchronously (fire and forget)
      try {
        fetch('https://us-central1-snowball-471001.cloudfunctions.net/getRecommendationsV2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            stage: 'search',
            query: query.trim(),
            datasetId: selectedDataset.gcsPath,  // Send GCS path instead of database UUID
            datasetSchema: datasetSchema ? formatSchemaForAI(datasetSchema) : undefined,
            followUpAnswers: processedAnswers,
            limit: candidateCount,
            topK: Math.max(candidateCount * 3, 30),
            queryId: actualQueryId // Pass the actual UUID so cloud function can update database
          })
        }).catch(error => {
          // Handle cancellation gracefully
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('🛑 Search request cancelled by user')
            return
          }
          console.error('Cloud function error:', error)
          // Error will be handled by polling mechanism
        })
      } catch (error) {
        console.error('Failed to start cloud function:', error)
      }

      // Clean up progress timer after 30 seconds (polling will take over)
      setTimeout(() => {
        clearInterval(progressTimer)
      }, 30000)
    } catch (error) {
      console.error('❌ Failed to save search to database:', error)
      setError(`Failed to start search: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setProcessing(false)
      setCurrentStage('questions')
    }
  }



  const handleOtherTextChange = (questionId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [`${questionId}_other_text`]: text }))
  }

  const getMultipleChoiceValues = (questionId: string): string[] => {
    const value = answers[questionId]
    if (!value) return []
    return Array.isArray(value) ? value : value.split(', ').filter(v => v.trim() !== '')
  }

  const handleMultipleChoiceChange = (questionId: string, option: string, checked: boolean) => {
    const currentValues = getMultipleChoiceValues(questionId)
    let newValues: string[]
    
    if (checked) {
      newValues = [...currentValues, option]
    } else {
      newValues = currentValues.filter(v => v !== option)
    }
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: newValues.join(', ')
    }))
  }

  const getFieldValue = (person: Record<string, unknown>, fieldPattern: string[]) => {
    const field = Object.keys(person).find(key => 
      fieldPattern.some(pattern => key.toLowerCase().includes(pattern.toLowerCase()))
    )
    return field ? person[field] : null
  }

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            AI-Powered Search
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Find exactly who you&apos;re looking for with intelligent assistance
          </p>
        </div>
        <Button variant="ghost" onClick={onBackToDatasets} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Dataset Context */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Database className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{selectedDataset.customName || selectedDataset.originalName}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                {datasetSchema && (
                  <>
                    <span>{datasetSchema.totalRows?.toLocaleString()} people</span>
                    <span>•</span>
                    <span>{datasetSchema.fields.length} data fields</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            Ready
          </Badge>
        </div>
      </div>

      {/* Stage 1: Initial Query Input */}
      {currentStage === 'input' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What are you looking for?</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Describe the type of person you want to find. Our AI will ask smart follow-up questions to get you exactly what you need.
            </p>
          </div>

          {/* Restored State Notification */}
          {query && !processing && currentStage === 'input' && followUpQuestions.length === 0 && !hasUserInteracted && (
            <Alert className="border-amber-200 bg-amber-50 max-w-lg mx-auto">
              <RefreshCw className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Previous search restored</p>
                    <p className="text-sm">Your query &quot;{query}&quot; was saved. Click &quot;Start AI Search&quot; to continue.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setQuery('')
                      setAnswers({})
                      setError(null)
                      setHasUserInteracted(false)
                      localStorage.removeItem('ai-search-state')
                    }}
                    className="ml-4 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="max-w-lg mx-auto space-y-4">
            <div>
              <Input
                placeholder="e.g., Healthcare investors for my AI startup"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setHasUserInteracted(true)
                }}
                disabled={processing}
                className="text-center text-lg py-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <Label htmlFor="candidate-count" className="text-sm text-gray-600">Results:</Label>
                <Input
                  id="candidate-count"
                  type="number"
                  min="1"
                  max="50"
                  value={candidateCount === 0 ? '' : candidateCount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setCandidateCount(0);
                    } else {
                      const num = parseInt(value);
                      if (!isNaN(num)) {
                        setCandidateCount(Math.min(50, Math.max(1, num)));
                      }
                    }
                  }}
                  disabled={processing}
                  className="w-20 text-center"
                />
              </div>
              
              {/* Extensive Questions Option */}
              <div className="flex items-center justify-center gap-4">
                <label className="relative flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wantExtensiveQuestions}
                    onChange={(e) => setWantExtensiveQuestions(e.target.checked)}
                    disabled={processing}
                    className="sr-only"
                  />
                  <div className={`w-12 h-6 rounded-full border-2 transition-all duration-200 ${
                    wantExtensiveQuestions
                      ? 'bg-blue-500 border-blue-500' 
                      : 'bg-gray-200 border-gray-300'
                  } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                      wantExtensiveQuestions 
                        ? 'translate-x-7' 
                        : 'translate-x-1'
                    } mt-0.5`} />
                  </div>
                  <span className={`ml-3 text-sm font-medium transition-colors ${
                    wantExtensiveQuestions 
                      ? 'text-blue-600' 
                      : 'text-gray-600'
                  } ${processing ? 'opacity-50' : ''}`}>
                    Ask me extensive follow-up questions for better results
                  </span>
                </label>
              </div>
            </div>

            <Button 
              onClick={handleInitialQuery} 
              disabled={!query.trim() || processing || candidateCount === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start AI Search
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Stage 2: Follow-up Questions */}
      {currentStage === 'questions' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Let&apos;s get more specific</h3>
            <div className="bg-blue-50 rounded-lg p-3 max-w-md mx-auto">
              <p className="text-sm text-blue-900 font-medium">Searching for:</p>
              <p className="text-blue-800 italic">&quot;{query}&quot;</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            {followUpQuestions.map((question, index) => (
              <div key={question.id} className={`rounded-lg border p-5 transition-colors ${
                excludedQuestions.has(question.id) 
                  ? 'border-gray-200 bg-gray-50 opacity-60' 
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className={`font-medium transition-colors ${
                          !excludedQuestions.has(question.id) 
                            ? 'text-gray-900' 
                            : 'text-gray-500'
                        }`}>
                          {question.question}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </h4>
                      </div>
                      
                      {/* Modern toggle-style checkbox on the right */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {excludedQuestions.has(question.id) && (
                          <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full font-medium">
                            Excluded
                          </span>
                        )}
                        <label className="relative flex items-center cursor-pointer">
                          <span className={`mr-3 text-sm font-medium transition-colors ${
                            !excludedQuestions.has(question.id) 
                              ? 'text-blue-600' 
                              : 'text-gray-500'
                          }`}>
                            {!excludedQuestions.has(question.id) ? 'Include' : 'Skip'}
                          </span>
                          <input
                            type="checkbox"
                            checked={!excludedQuestions.has(question.id)}
                            onChange={(e) => {
                              const newExcluded = new Set(excludedQuestions)
                              if (e.target.checked) {
                                newExcluded.delete(question.id)
                              } else {
                                newExcluded.add(question.id)
                                // Clear answers for excluded questions
                                setAnswers(prev => {
                                  const newAnswers = { ...prev }
                                  delete newAnswers[question.id]
                                  delete newAnswers[`${question.id}_other_text`]
                                  return newAnswers
                                })
                              }
                              setExcludedQuestions(newExcluded)
                            }}
                            className="sr-only"
                          />
                          <div className={`w-12 h-6 rounded-full border-2 transition-all duration-200 ${
                            !excludedQuestions.has(question.id)
                              ? 'bg-blue-500 border-blue-500' 
                              : 'bg-gray-200 border-gray-300'
                          }`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                              !excludedQuestions.has(question.id) 
                                ? 'translate-x-7' 
                                : 'translate-x-1'
                            } mt-0.5`} />
                          </div>
                        </label>
                      </div>
                    </div>
                    
                    {!excludedQuestions.has(question.id) ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <label key={option} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                name={question.id}
                                value={option}
                                checked={getMultipleChoiceValues(question.id).includes(option)}
                                onChange={(e) => handleMultipleChoiceChange(question.id, option, e.target.checked)}
                                className="text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <span className="text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                        
                        {/* Show text input when "Other" is selected */}
                        {getMultipleChoiceValues(question.id).includes('Other') && (
                          <div className="ml-6 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <Label className="text-sm text-blue-800 mb-2 block">Please specify:</Label>
                            <Input
                              value={answers[`${question.id}_other_text`] || ''}
                              onChange={(e) => handleOtherTextChange(question.id, e.target.value)}
                              placeholder="Type your custom answer here..."
                              className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                              autoFocus
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 italic">
                        This question has been excluded from your search
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStage('input')}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleFinalSearch}
                disabled={processing || candidateCount === 0}
                className="flex-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Find {candidateCount} Best Matches
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stage 3: Processing */}
      {currentStage === 'processing' && (
        <div className="py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin mr-3" />
              <span className="text-lg font-medium text-gray-900">
                AI Search in Progress
              </span>
            </div>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Our AI is analyzing your query and searching through the dataset for the best matches.
            </p>
          </div>
          
          {/* Progress Stages */}
          <div className="max-w-2xl mx-auto space-y-4 mb-8">
            {processingStages.map((stage) => (
              <div key={stage.stage} className="flex items-center gap-4 p-4 bg-white border rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  stage.completed 
                    ? 'bg-green-100 text-green-600' 
                    : stage.progress > 0 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {stage.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : stage.progress > 0 ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-current opacity-30" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-medium ${
                      stage.completed 
                        ? 'text-green-900' 
                        : stage.progress > 0 
                          ? 'text-blue-900' 
                          : 'text-gray-500'
                    }`}>
                      {stage.stage}
                    </h3>
                    <span className={`text-sm font-medium ${
                      stage.completed 
                        ? 'text-green-600' 
                        : stage.progress > 0 
                          ? 'text-blue-600' 
                          : 'text-gray-400'
                    }`}>
                      {stage.completed ? '100%' : `${Math.round(stage.progress)}%`}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-2 ${
                    stage.completed 
                      ? 'text-green-700' 
                      : stage.progress > 0 
                        ? 'text-blue-700' 
                        : 'text-gray-500'
                  }`}>
                    {stage.message}
                  </p>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        stage.completed 
                          ? 'bg-green-500' 
                          : stage.progress > 0 
                            ? 'bg-blue-500' 
                            : 'bg-gray-300'
                      }`}
                      style={{ width: `${stage.completed ? 100 : stage.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              Search will complete automatically. You can start a new search or check the Query History tab.
            </p>
            <Button 
              variant="outline" 
              onClick={resetComponentState}
              className="text-blue-600 hover:text-blue-700"
            >
              <Search className="h-4 w-4 mr-2" />
              Start New Search
            </Button>
          </div>
        </div>
      )}

      {/* Stage 4: Results */}
      {currentStage === 'results' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                AI-Curated Results
              </CardTitle>
              {metadata && (
                <div className="text-sm text-gray-500">
                  {metadata.final_results as number} candidates • {Math.round((metadata.processing_time as number) / 1000)}s processing
                </div>
              )}
            </div>
            <CardDescription>
              Each candidate has been analyzed by our AI for contextual fit and relevance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={result.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-400" />
                        <h3 className="font-medium text-lg">
                          {result.display_name || `Candidate ${index + 1}`}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={result.recommendation === 'Highly recommended' ? 'default' : 'secondary'}>
                          {result.recommendation}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">{result.overall_score}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {Boolean(getFieldValue(result.data, ['title', 'role', 'position'])) && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {String(getFieldValue(result.data, ['title', 'role', 'position']))}
                          </span>
                        </div>
                      )}
                      
                      {Boolean(getFieldValue(result.data, ['location', 'city', 'address'])) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {String(getFieldValue(result.data, ['location', 'city', 'address']))}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* AI Analysis */}
                    <div className="bg-purple-50 rounded-lg p-3 mb-3">
                      <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        AI Analysis
                      </h4>
                      <p className="text-sm text-purple-800">{result.llm_analysis}</p>
                    </div>

                    {/* Match Strengths */}
                    {result.match_strengths && result.match_strengths.length > 0 && (
                      <div className="mb-3">
                        <Label className="text-xs text-gray-500 mb-2 block">Strengths:</Label>
                        <div className="flex flex-wrap gap-1">
                          {result.match_strengths.map((strength, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs bg-green-100 text-green-800">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Potential Concerns */}
                    {result.potential_concerns && result.potential_concerns.length > 0 && (
                      <div className="mb-3">
                        <Label className="text-xs text-gray-500 mb-2 block">Considerations:</Label>
                        <div className="flex flex-wrap gap-1">
                          {result.potential_concerns.map((concern, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs text-orange-700 border-orange-300">
                              {concern}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <details className="mt-3">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        View detailed scores and data
                      </summary>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-2">
                        <div>
                          <strong>Scores:</strong> BM25: {result.bm25_score} | LLM: {result.llm_relevance_score} | Overall: {result.overall_score}
                        </div>
                        <div>
                          <strong>Cultural Fit:</strong> {result.cultural_fit_assessment}
                        </div>
                        <details>
                          <summary className="cursor-pointer text-gray-600">Raw data</summary>
                          <pre className="mt-1 text-xs overflow-x-auto">{JSON.stringify(result.data, null, 2)}</pre>
                        </details>
                      </div>
                    </details>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={resetComponentState}>
                New Search
              </Button>
              <Button variant="outline" onClick={() => setCurrentStage('questions')}>
                Refine Search
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
