import { NextRequest, NextResponse } from 'next/server'
import { deleteDatasetFromGCS } from '@/lib/gcs-production'
import { getCurrentUserId } from '@/lib/auth-helpers-server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceRoleClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
  try {
    // Get current user ID
    const userId = await getCurrentUserId(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const datasetId = searchParams.get('id')
    const gcsPath = searchParams.get('gcsPath')

    if (!datasetId) {
      return NextResponse.json(
        { error: 'Dataset ID is required' },
        { status: 400 }
      )
    }

    if (!gcsPath) {
      return NextResponse.json(
        { error: 'GCS path is required' },
        { status: 400 }
      )
    }

    // Check if this is an admin user
    const isAdmin = request.headers.get('x-admin-auth') === 'true'
    
    // Create appropriate Supabase client
    const supabase = isAdmin 
      ? createServiceRoleClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
      : await createClient()

    // First, verify the dataset belongs to this user
    const { data: dataset, error: fetchError } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', datasetId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !dataset) {
      return NextResponse.json(
        { error: 'Dataset not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete from database first
    const { error: deleteError } = await supabase
      .from('datasets')
      .delete()
      .eq('id', datasetId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('❌ Failed to delete dataset from database:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete dataset from database' },
        { status: 500 }
      )
    }

    // Then delete from Google Cloud Storage
    try {
      await deleteDatasetFromGCS(gcsPath)
      console.log(`✅ Successfully deleted dataset from GCS: ${gcsPath}`)
    } catch (gcsError) {
      console.warn('⚠️ Failed to delete from GCS, but database deletion successful:', gcsError)
      // Don't fail the request if GCS deletion fails since database is already cleaned up
    }

    console.log(`✅ Successfully deleted dataset: ${datasetId}`)

    return NextResponse.json({
      success: true,
      message: 'Dataset deleted successfully'
    })

  } catch (error) {
    console.error('❌ Delete dataset API error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete dataset',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    )
  }
}
