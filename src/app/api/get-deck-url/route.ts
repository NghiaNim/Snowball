import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
})

const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'snowball-pitch-decks'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('file')
    
    if (!fileName) {
      return NextResponse.json({ error: 'No file specified' }, { status: 400 })
    }

    // Check if GCS is configured
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_CLOUD_STORAGE_BUCKET) {
      // Demo mode - return a fake URL
      const fakeUrl = `/demo-decks/${fileName}`
      return NextResponse.json({
        success: true,
        url: fakeUrl,
        publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}${fakeUrl}`,
        message: 'Demo mode: Signed URL simulated'
      })
    }

    // Generate a fresh signed URL
    const bucket = storage.bucket(bucketName)
    const file = bucket.file(fileName)

    // Check if file exists
    const [exists] = await file.exists()
    if (!exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Generate signed URL (valid for 1 hour for security)
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
    })

    return NextResponse.json({
      success: true,
      url: fileName,
      publicUrl: signedUrl,
      expiresIn: '1 hour'
    })

  } catch (error) {
    console.error('Get signed URL error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate access URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
