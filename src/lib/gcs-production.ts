import { Storage } from '@google-cloud/storage'

// Initialize Google Cloud Storage for production recommendations
let storage: Storage | null = null
let bucket: import('@google-cloud/storage').Bucket | null = null

const BUCKET_NAME = 'chief_of_staff_datasets'
const RAW_DATASETS_FOLDER = 'raw_datasets'
const PROCESSED_DATASETS_FOLDER = 'processed_datasets'

try {
  // Use the existing snowball project credentials
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'snowball-471001'
  const credentialsPath = process.env.GOOGLE_CLOUD_CREDENTIALS_PATH || './secret/snowball-471001-1bb26b3b5cd0.json'
  
  const storageConfig: {
    projectId: string
    keyFilename?: string
    credentials?: object
  } = {
    projectId: projectId,
  }

  // Use either credentials file path or JSON content
  if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
    try {
      storageConfig.credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
      console.log('Using GOOGLE_CLOUD_CREDENTIALS from environment variable')
    } catch {
      console.warn('Failed to parse GOOGLE_CLOUD_CREDENTIALS, falling back to key file')
      storageConfig.keyFilename = credentialsPath
      console.log(`Using credentials file: ${credentialsPath}`)
    }
  } else {
    storageConfig.keyFilename = credentialsPath
    console.log(`Using credentials file: ${credentialsPath}`)
  }

  storage = new Storage(storageConfig)
  bucket = storage.bucket(BUCKET_NAME)
  
  console.log(`✅ Google Cloud Storage initialized for project: ${projectId}, bucket: ${BUCKET_NAME}`)
  
  // Test bucket access (async operation)
  bucket.exists().then(([exists]: [boolean]) => {
    if (exists) {
      console.log(`✅ Bucket ${BUCKET_NAME} exists and is accessible`)
    } else {
      console.log(`⚠️ Bucket ${BUCKET_NAME} does not exist or is not accessible`)
    }
  }).catch((err: Error) => {
    console.log(`⚠️ Could not verify bucket access: ${err.message}`)
  })
  
} catch (error) {
  console.error('❌ Failed to initialize Google Cloud Storage:', error)
  console.error('Make sure you have:')
  console.error('1. Created the chief_of_staff_datasets bucket in Google Cloud Storage')
  console.error('2. Given your service account proper permissions')
  console.error('3. Enabled the Cloud Storage API')
  throw error
}

export interface UploadedDataset {
  id: string
  originalName: string
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

/**
 * Upload a file to Google Cloud Storage raw_datasets folder
 */
export async function uploadDatasetToGCS(
  file: Buffer, 
  originalName: string,
  metadata: { fileSize: number; fileType: string }
): Promise<UploadedDataset> {
  if (!storage || !bucket) {
    throw new Error('Google Cloud Storage not properly initialized')
  }

  const timestamp = Date.now()
  const fileExtension = originalName.split('.').pop()
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const gcsFileName = `${RAW_DATASETS_FOLDER}/${timestamp}_${sanitizedName}`
  
  try {
    const gcsFile = bucket.file(gcsFileName)
    
    // Upload the file
    await gcsFile.save(file, {
      metadata: {
        contentType: getContentType(fileExtension || ''),
        metadata: {
          originalName,
          uploadedAt: new Date().toISOString(),
          fileSize: metadata.fileSize.toString(),
          fileType: metadata.fileType,
        },
      },
    })

    console.log(`✅ File uploaded to GCS: ${gcsFileName}`)

    const dataset: UploadedDataset = {
      id: timestamp.toString(),
      originalName,
      gcsPath: gcsFileName,
      uploadedAt: new Date().toISOString(),
      fileSize: metadata.fileSize,
      status: 'uploaded',
      metadata: {
        fileType: metadata.fileType,
      }
    }

    return dataset
  } catch (error) {
    console.error('❌ Error uploading to GCS:', error)
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * List all datasets in the raw_datasets folder
 */
export async function listDatasetsFromGCS(): Promise<UploadedDataset[]> {
  if (!storage || !bucket) {
    throw new Error('Google Cloud Storage not properly initialized')
  }

  try {
    const [files] = await bucket.getFiles({
      prefix: `${RAW_DATASETS_FOLDER}/`,
    })

    const datasets: UploadedDataset[] = []

    for (const file of files) {
      // Skip folder markers
      if (file.name.endsWith('/')) continue

      const [metadata] = await file.getMetadata()
      const fileName = file.name.split('/').pop() || ''
      const timestamp = fileName.split('_')[0]
      
      datasets.push({
        id: timestamp,
        originalName: String(metadata.metadata?.originalName || fileName),
        gcsPath: file.name,
        uploadedAt: String(metadata.metadata?.uploadedAt || metadata.timeCreated || ''),
        fileSize: parseInt(String(metadata.size || '0')),
        status: 'uploaded', // We'll enhance this later with processing status
        metadata: {
          fileType: String(metadata.metadata?.fileType || 'unknown'),
        }
      })
    }

    // Sort by upload date (newest first)
    return datasets.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  } catch (error) {
    console.error('❌ Error listing datasets from GCS:', error)
    throw new Error(`Failed to list datasets: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Download a dataset from GCS
 */
export async function downloadDatasetFromGCS(gcsPath: string): Promise<Buffer> {
  if (!storage || !bucket) {
    throw new Error('Google Cloud Storage not properly initialized')
  }

  try {
    const file = bucket.file(gcsPath)
    const [buffer] = await file.download()
    
    console.log(`✅ Downloaded dataset: ${gcsPath}`)
    return buffer
  } catch (error) {
    console.error('❌ Error downloading from GCS:', error)
    throw new Error(`Failed to download dataset: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete a dataset from GCS
 */
export async function deleteDatasetFromGCS(gcsPath: string): Promise<void> {
  if (!storage || !bucket) {
    throw new Error('Google Cloud Storage not properly initialized')
  }

  try {
    const file = bucket.file(gcsPath)
    await file.delete()
    
    console.log(`✅ Deleted dataset: ${gcsPath}`)
  } catch (error) {
    console.error('❌ Error deleting from GCS:', error)
    throw new Error(`Failed to delete dataset: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get the appropriate content type for file uploads
 */
function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
    'csv': 'text/csv',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
  }
  
  return contentTypes[extension.toLowerCase()] || 'application/octet-stream'
}

export { RAW_DATASETS_FOLDER, PROCESSED_DATASETS_FOLDER, BUCKET_NAME }
