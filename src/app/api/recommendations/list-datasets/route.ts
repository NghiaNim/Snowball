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

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const supabase = createRecommendationClient()
    
    // Get datasets from the database, filtered by user
    const { data: datasets, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching datasets:', error)
      return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: 500 })
    }
    
    console.log(`✅ Retrieved ${datasets.length} datasets for user ${userId}`)

    return NextResponse.json({
      success: true,
      datasets,
      count: datasets.length
    })

  } catch (error) {
    console.error('❌ List datasets API error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to list datasets',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    )
  }
}
