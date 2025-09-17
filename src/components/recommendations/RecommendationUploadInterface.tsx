'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, CheckCircle, AlertCircle, X, Cloud } from 'lucide-react'
import * as XLSX from 'xlsx'

interface RecommendationUploadInterfaceProps {
  onUploadSuccess: () => void
}

interface UploadedFile {
  file: File
  preview: string[]
  error?: string
}

export function RecommendationUploadInterface({ onUploadSuccess }: RecommendationUploadInterfaceProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [datasetName, setDatasetName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const parseFilePreview = useCallback((file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const result = e.target?.result
          let lines: string[] = []

          if (file.name.toLowerCase().endsWith('.csv')) {
            // Handle CSV files
            const text = result as string
            lines = text.split('\n').slice(0, 5)
          } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
            // Handle Excel files
            const data = new Uint8Array(result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: 'array' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
            
            // Convert first 5 rows to CSV-like format for preview
            lines = jsonData.slice(0, 5).map(row => row.join(','))
          }

          resolve(lines)
        } catch (parseError) {
          reject(parseError)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      
      // Read as text for CSV, as ArrayBuffer for Excel
      if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file)
      } else {
        reader.readAsArrayBuffer(file)
      }
    })
  }, [])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setError(null)
    setSuccessMessage(null)
    
    // Validate file type
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
      return
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB')
      return
    }

    try {
      const preview = await parseFilePreview(file)
      setUploadedFile({
        file,
        preview
      })
      
      // Auto-generate dataset name from filename
      const name = file.name.replace(/\.(csv|xlsx?|xls)$/i, '').replace(/[_-]/g, ' ')
      setDatasetName(name.charAt(0).toUpperCase() + name.slice(1))
    } catch (parseError) {
      setError('Failed to parse file. Please check the file format.')
    }
  }, [parseFilePreview])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  })

  const handleUpload = async () => {
    if (!uploadedFile || !datasetName.trim()) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    setSuccessMessage(null)

    try {
      // Create form data
      const formData = new FormData()
      formData.append('file', uploadedFile.file)
      formData.append('datasetName', datasetName.trim())

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Upload to API
      const response = await fetch('/api/recommendations/upload-dataset', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setUploadProgress(100)
      setSuccessMessage(`Dataset "${datasetName}" uploaded successfully to Google Cloud Storage!`)
      
      // Clear form after successful upload
      setTimeout(() => {
        clearFile()
        onUploadSuccess()
      }, 2000)

    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setDatasetName('')
    setError(null)
    setSuccessMessage(null)
    setUploadProgress(0)
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!uploadedFile && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }`}
        >
          <input {...getInputProps()} />
          <Cloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
              <p className="text-lg text-blue-600">Drop the file here...</p>
          ) : (
            <div>
              <p className="text-lg text-gray-600 mb-2">
                Drag and drop your dataset here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Supported formats: CSV, Excel (.csv, .xlsx, .xls) up to 100MB
              </p>
              <p className="text-xs text-blue-600 font-medium">
                Files will be uploaded to Google Cloud Storage and processed with BigQuery
              </p>
            </div>
          )}
        </div>
      )}

      {/* File Preview */}
      {uploadedFile && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-medium">{uploadedFile.file.name}</h3>
                  <p className="text-sm text-gray-500">
                    {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFile}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* File Preview */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-sm text-gray-700 mb-2">File Preview:</h4>
              <div className="font-mono text-xs space-y-1">
                {uploadedFile.preview.map((line, index) => (
                  <div key={index} className="truncate">
                    {line || <span className="text-gray-400">(empty line)</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Dataset Name Input */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="dataset-name">Dataset Name</Label>
              <Input
                id="dataset-name"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                placeholder="Enter a name for your dataset"
                disabled={isUploading}
              />
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading to Google Cloud Storage...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!datasetName.trim() || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload to Cloud Storage
                </>
              )}
            </Button>
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

      {/* Success Display */}
      {successMessage && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
