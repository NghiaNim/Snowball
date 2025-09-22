'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getAuthHeaders } from '@/lib/auth-helpers'
import { 
  Database, 
  FileText, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Cloud,
  Eye
} from 'lucide-react'

interface DatasetManagerProps {
  onSelectDataset: (dataset: UploadedDataset) => void
  onDatasetsChange?: (datasets: UploadedDataset[]) => void
}

interface UploadedDataset {
  id: string
  originalName: string
  customName?: string
  gcsPath: string
  uploadedAt: string
  fileSize: number
  status: 'uploaded' | 'processing' | 'processed' | 'error'
  metadata?: {
    rowCount?: number
    columns?: string[]
    fileType: string
  }
}

interface DatabaseDataset {
  id: string
  name: string
  file_name: string
  gcs_path: string
  schema_analysis: { columns?: string[] } | null
  field_mappings: Record<string, unknown>
  row_count: number
  processing_status: string
  error_message: string | null
  user_id: string
  created_at: string
  updated_at: string
  file_size: number
}

export function DatasetManager({ onSelectDataset, onDatasetsChange }: DatasetManagerProps) {
  const [datasets, setDatasets] = useState<UploadedDataset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingDataset, setDeletingDataset] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<{ dataset: UploadedDataset; content: string[] } | null>(null)

  const fetchDatasets = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/recommendations/list-datasets', {
        headers: getAuthHeaders()
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch datasets')
      }

      // Transform database response to match expected interface
      const transformedDatasets = (result.datasets || []).map((dataset: DatabaseDataset) => ({
        id: dataset.id,
        originalName: dataset.file_name || dataset.name,
        customName: dataset.name !== dataset.file_name ? dataset.name : undefined,
        gcsPath: dataset.gcs_path,
        uploadedAt: dataset.created_at,
        fileSize: dataset.file_size || 0,
        status: dataset.processing_status === 'completed' ? 'processed' : 
                dataset.processing_status === 'pending' ? 'processing' :
                dataset.processing_status === 'failed' ? 'error' : 'uploaded',
        metadata: {
          rowCount: dataset.row_count || 0,
          columns: dataset.schema_analysis?.columns || [],
          fileType: dataset.file_name?.split('.').pop() || 'unknown'
        }
      }))
      
      setDatasets(transformedDatasets)
      // Notify parent component of dataset changes
      if (onDatasetsChange) {
        onDatasetsChange(transformedDatasets)
      }
    } catch (fetchError) {
      console.error('Error fetching datasets:', fetchError)
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load datasets')
    } finally {
      setIsLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteDataset = async (dataset: UploadedDataset) => {
    if (!confirm(`Are you sure you want to delete "${dataset.originalName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingDataset(dataset.id)

    try {
      const response = await fetch(`/api/recommendations/delete-dataset?id=${encodeURIComponent(dataset.id)}&gcsPath=${encodeURIComponent(dataset.gcsPath)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete dataset')
      }

      // Remove from local state
      const updatedDatasets = datasets.filter(d => d.id !== dataset.id)
      setDatasets(updatedDatasets)
      // Notify parent component of dataset changes
      if (onDatasetsChange) {
        onDatasetsChange(updatedDatasets)
      }
    } catch (deleteError) {
      console.error('Error deleting dataset:', deleteError)
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete dataset')
    } finally {
      setDeletingDataset(null)
    }
  }

  const handlePreviewDataset = async (dataset: UploadedDataset) => {
    try {
      const response = await fetch(`/api/recommendations/preview-dataset?gcsPath=${encodeURIComponent(dataset.gcsPath)}`)
      
      if (!response.ok) {
        throw new Error('Failed to preview dataset')
      }
      
      const result = await response.json()
      setPreviewData({
        dataset,
        content: result.preview || []
      })
    } catch (error) {
      console.error('Error previewing dataset:', error)
      setError(error instanceof Error ? error.message : 'Failed to preview dataset')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string | undefined) => {
    const variants = {
      uploaded: 'bg-green-100 text-green-800',
      processing: 'bg-yellow-100 text-yellow-800',
      processed: 'bg-blue-100 text-blue-800',
      error: 'bg-red-100 text-red-800',
    }
    
    const displayStatus = status || 'unknown'
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </Badge>
    )
  }

  const formatFileSize = (bytes: number): string => {
    if (!bytes || isNaN(bytes) || bytes === 0) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Unknown date'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Load datasets on component mount
  useEffect(() => {
    fetchDatasets()
  }, [fetchDatasets])

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex-1">
              <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
                <Database className="h-5 w-5" />
                <span>Dataset Manager</span>
              </CardTitle>
              <CardDescription className="mt-1 text-sm md:text-base">
                Manage datasets stored in Google Cloud Storage
              </CardDescription>
            </div>
            <Button
              onClick={fetchDatasets}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="w-full md:w-auto min-h-[44px]"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading datasets from Google Cloud Storage...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && datasets.length === 0 && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <Cloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No datasets found</h3>
            <p className="text-gray-500 mb-6">
              Upload your first dataset to get started with AI recommendations.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Datasets List */}
      {!isLoading && datasets.length > 0 && (
        <div className="grid gap-4">
          {datasets.map((dataset) => (
            <Card key={dataset.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                  <div className="flex items-start space-x-3 md:space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      <FileText className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-2 mb-2">
                        <h3 className="text-base md:text-lg font-medium text-gray-900 truncate">
                          {dataset.customName || dataset.originalName}
                        </h3>
                        {dataset.customName && (
                          <p className="text-xs text-gray-500 truncate">
                            File: {dataset.originalName}
                          </p>
                        )}
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(dataset.status)}
                          {getStatusBadge(dataset.status)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-1 md:flex-row md:items-center md:space-y-0 md:space-x-4 text-sm text-gray-500">
                        <span>Size: {formatFileSize(dataset.fileSize)}</span>
                        <span>Type: {dataset.metadata?.fileType?.toUpperCase() || 'Unknown'}</span>
                        <span className="md:hidden">Uploaded: {formatDate(dataset.uploadedAt).split(',')[0]}</span>
                        <span className="hidden md:inline">Uploaded: {formatDate(dataset.uploadedAt)}</span>
                      </div>
                      
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 md:ml-4">
                    <Button
                      onClick={() => handlePreviewDataset(dataset)}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto min-h-[44px] px-4"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    
                    <Button
                      onClick={() => onSelectDataset(dataset)}
                      size="sm"
                      disabled={dataset.status === 'error'}
                      className="w-full sm:w-auto min-h-[44px] px-4"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Use for AI
                    </Button>
                    
                    <Button
                      onClick={() => handleDeleteDataset(dataset)}
                      disabled={deletingDataset === dataset.id}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto min-h-[44px] px-4"
                    >
                      {deletingDataset === dataset.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewData} onOpenChange={() => setPreviewData(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview: {previewData?.dataset.customName || previewData?.dataset.originalName}
            </DialogTitle>
            <DialogDescription>
              First 10 rows of your dataset
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[60vh]">
            {previewData?.content && previewData.content.length > 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {previewData.content.slice(0, 10).join('\n')}
                </pre>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No preview available
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setPreviewData(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
