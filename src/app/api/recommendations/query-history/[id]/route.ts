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

// DELETE: Delete a specific query
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const { id: queryId } = await params

    if (!queryId) {
      return NextResponse.json({ error: 'Query ID is required' }, { status: 400 })
    }

    const supabase = createRecommendationClient()

    // Delete the query (processing stages will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('query_history')
      .delete()
      .eq('id', queryId)
      .eq('user_id', userId) // Ensure user can only delete their own queries

    if (error) {
      console.error('❌ Error deleting query:', error)
      return NextResponse.json({ error: 'Failed to delete query' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Query deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Get a specific query
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const { id: queryId } = await params

    console.log('🔍 Fetching query with ID:', queryId)

    if (!queryId) {
      return NextResponse.json({ error: 'Query ID is required' }, { status: 400 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(queryId)) {
      console.log('❌ Invalid UUID format:', queryId)
      return NextResponse.json({ 
        error: 'Invalid query ID format',
        details: 'Query ID must be a valid UUID'
      }, { status: 400 })
    }

    const supabase = createRecommendationClient()

    const { data: query, error } = await supabase
      .from('query_history')
      .select(`
        *,
        query_processing_stages (*)
      `)
      .eq('id', queryId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('❌ Error fetching query:', error)
      
      // Check if it's a not found error vs other database error
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Query not found',
          details: 'No query found with the provided ID'
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        error: 'Database error',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ Query found:', { id: query.id, status: query.status })

    return NextResponse.json({ query })
  } catch (error) {
    console.error('❌ Query fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
