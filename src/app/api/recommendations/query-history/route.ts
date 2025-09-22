import { NextRequest, NextResponse } from 'next/server'
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

// GET: Fetch user's query history
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const supabase = createRecommendationClient()
    
    const { data: queries, error } = await supabase
      .from('query_history')
      .select(`
        *,
        query_processing_stages (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('❌ Error fetching query history:', error)
      return NextResponse.json({ error: 'Failed to fetch query history' }, { status: 500 })
    }

    return NextResponse.json({ queries })
  } catch (error) {
    console.error('❌ Query history fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create new query entry
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const body = await request.json()
    const { query, datasetId, datasetName, processingStages, customId } = body

    console.log('📝 Creating query:', { query, datasetId, datasetName, customId, userId })

    if (!query || !datasetId || !datasetName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createRecommendationClient()

    // Create query entry - let database generate the UUID
    const insertData = {
      query,
      dataset_id: datasetId,
      dataset_name: datasetName,
      status: 'processing' as const,
      user_id: userId,
      processing_stages: processingStages || [],
      metadata: customId ? { customId } : {}
    }

    const { data: queryData, error: queryError } = await supabase
      .from('query_history')
      .insert(insertData)
      .select()
      .single()

    if (queryError) {
      console.error('❌ Error creating query:', queryError)
      return NextResponse.json({ 
        error: 'Failed to create query',
        details: queryError.message
      }, { status: 500 })
    }

    console.log('✅ Query created with ID:', queryData.id)

    return NextResponse.json({ 
      success: true, 
      queryId: queryData.id,
      query: queryData
    })
  } catch (error) {
    console.error('❌ Query creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT: Update query status/results
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { queryId, status, results, metadata, processingStages } = body

    console.log('🔄 Updating query:', { queryId, status, resultCount: results?.length })

    if (!queryId) {
      return NextResponse.json({ error: 'Query ID is required' }, { status: 400 })
    }

    const supabase = createRecommendationClient()

    // Update query with proper typing
    const updateData: {
      status?: 'processing' | 'completed' | 'error'
      results?: unknown[]
      metadata?: Record<string, unknown>
      processing_stages?: unknown[]
      updated_at?: string
    } = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (results) updateData.results = results
    if (metadata) updateData.metadata = metadata
    if (processingStages) updateData.processing_stages = processingStages

    const { data: queryData, error: queryError } = await supabase
      .from('query_history')
      .update(updateData)
      .eq('id', queryId)
      .select()
      .single()

    if (queryError) {
      console.error('❌ Error updating query:', queryError)
      return NextResponse.json({ 
        error: 'Failed to update query',
        details: queryError.message
      }, { status: 500 })
    }

    console.log('✅ Query updated successfully')

    return NextResponse.json({ 
      success: true, 
      query: queryData
    })
  } catch (error) {
    console.error('❌ Query update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
