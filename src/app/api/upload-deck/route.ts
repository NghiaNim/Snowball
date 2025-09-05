import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

// Initialize Google Cloud Storage with proper error handling
let storage: Storage

try {
  const storageConfig: Record<string, unknown> = {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'snowball-471001',
  }

  // Try to parse credentials from environment variable
  if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
    try {
      storageConfig.credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
    } catch {
      console.warn('Failed to parse GOOGLE_CLOUD_CREDENTIALS, falling back to key file')
    }
  }

  // Fallback to key file if credentials parsing failed or not available
  if (!storageConfig.credentials && process.env.GOOGLE_CLOUD_KEY_FILE) {
    storageConfig.keyFilename = process.env.GOOGLE_CLOUD_KEY_FILE
  }

  // Final fallback to local secret file (development only)
  if (!storageConfig.credentials && !storageConfig.keyFilename) {
    storageConfig.keyFilename = './secret/snowball-471001-1bb26b3b5cd0.json'
  }

  storage = new Storage(storageConfig)
} catch (error) {
  console.error('Failed to initialize Google Cloud Storage:', error)
  // Create a dummy storage object that will trigger demo mode
  storage = {} as Storage
}

const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'snowball-pitch-decks'

export async function POST(request: NextRequest) {
  try {
    // Check if GCS is configured
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_CLOUD_STORAGE_BUCKET) {
      console.log('Google Cloud Storage not configured, running in demo mode')
      
      // Demo mode - just return a fake URL
      const formData = await request.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      // Simulate upload with a fake URL
      const fakeUrl = `/demo-decks/${file.name}`
      
      return NextResponse.json({
        success: true,
        url: fakeUrl,
        publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}${fakeUrl}`,
        fileName: file.name,
        originalName: file.name,
        size: file.size,
        type: file.type,
        gcs_bucket: 'snowball-pitch-decks',
        gcs_object_path: fakeUrl,
        message: 'Demo mode: File upload simulated'
      })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload PDF or PowerPoint files only.' }, { status: 400 })
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `snowball-deck-${timestamp}.${fileExtension}`
    
    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Google Cloud Storage
    const bucket = storage.bucket(bucketName)
    const gcsFile = bucket.file(`pitch-decks/${fileName}`)

    await gcsFile.save(buffer, {
      metadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
    })

    // Generate a signed URL for viewing (valid for 7 days)
    const [signedUrl] = await gcsFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    })

    // For UBLA buckets, we use signed URLs instead of public URLs
    const publicUrl = signedUrl

    return NextResponse.json({
      success: true,
      url: `pitch-decks/${fileName}`,
      publicUrl: publicUrl,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      gcs_bucket: bucketName,
      gcs_object_path: `pitch-decks/${fileName}`
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('file')
    
    if (!fileName) {
      return NextResponse.json({ error: 'No file specified' }, { status: 400 })
    }

    // Check if GCS is configured
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_CLOUD_STORAGE_BUCKET) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode: File deletion simulated'
      })
    }

    // Delete from Google Cloud Storage
    const bucket = storage.bucket(bucketName)
    const file = bucket.file(fileName)
    
    await file.delete()

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ 
      error: 'Delete failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
