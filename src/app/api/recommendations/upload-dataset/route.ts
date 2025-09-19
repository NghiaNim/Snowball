import { NextRequest, NextResponse } from 'next/server'
import { uploadDatasetToGCS } from '@/lib/gcs-production'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const datasetName = formData.get('datasetName') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!datasetName) {
      return NextResponse.json(
        { error: 'Dataset name is required' },
        { status: 400 }
      )
    }

    // Validate file type
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Only CSV and Excel files are supported (.csv, .xlsx, .xls)' },
        { status: 400 }
      )
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 100MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Determine file type
    let fileType = 'csv'
    if (fileName.endsWith('.xlsx')) fileType = 'xlsx'
    if (fileName.endsWith('.xls')) fileType = 'xls'

    // Upload to Google Cloud Storage
    const uploadedDataset = await uploadDatasetToGCS(buffer, file.name, {
      fileSize: file.size,
      fileType,
      customName: datasetName,
    })

    console.log(`✅ Successfully uploaded dataset: ${file.name}`)

    return NextResponse.json({
      success: true,
      dataset: uploadedDataset,
      message: 'Dataset uploaded successfully to Google Cloud Storage'
    })

  } catch (error) {
    console.error('❌ Upload API error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to upload dataset',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'AI Recommendations Upload API is running' },
    { status: 200 }
  )
}
