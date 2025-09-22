import { NextRequest, NextResponse } from 'next/server'
import { uploadDatasetToGCS } from '@/lib/gcs-production'
import { createClient as createServiceRoleClient } from '@supabase/supabase-js'
import { getCurrentUserId } from '@/lib/auth-helpers-server'

// Create service role client that bypasses RLS for demo system
function createRecommendationClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createServiceRoleClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
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

    // Save dataset info to database with user association
    const supabase = createRecommendationClient()
    
    const { data: dbDataset, error: dbError } = await supabase
      .from('datasets')
      .insert({
        name: datasetName,
        file_name: file.name,
        gcs_path: uploadedDataset.gcsPath,
        user_id: userId,
        processing_status: 'completed',
        row_count: 0, // Will be updated when dataset is processed
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Error saving dataset to database:', dbError)
      // Note: The file was uploaded to GCS but not tracked in DB
      return NextResponse.json({
        error: 'Failed to save dataset information',
        details: dbError.message
      }, { status: 500 })
    }

    console.log(`✅ Successfully uploaded dataset: ${file.name} for user ${userId}`)

    return NextResponse.json({
      success: true,
      dataset: {
        ...uploadedDataset,
        id: dbDataset.id,
        user_id: userId
      },
      message: 'Dataset uploaded successfully'
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
