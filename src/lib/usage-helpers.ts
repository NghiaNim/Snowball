import { createClient as createServiceRoleClient } from '@supabase/supabase-js'

// Create service role client for usage operations
function createUsageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createServiceRoleClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export interface UserUsage {
  searchCount: number
  planType: 'free' | 'pro'
  hasReachedLimit: boolean
  isSubscribed: boolean
}

/**
 * Get user's current usage and subscription status
 */
export async function getUserUsageStatus(userId: string): Promise<UserUsage> {
  const supabase = createUsageClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

  try {
    // Get user subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('plan_type, subscription_status')
      .eq('user_id', userId)
      .single()

    const planType = subscription?.plan_type || 'free'
    const isSubscribed = subscription?.subscription_status === 'active' && planType === 'pro'

    // Get today's usage
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('search_count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .single()

    const searchCount = usage?.search_count || 0
    const hasReachedLimit = !isSubscribed && searchCount >= 5 // Free users limited to 5 searches

    return {
      searchCount,
      planType,
      hasReachedLimit,
      isSubscribed
    }
  } catch (error) {
    console.error('Error getting user usage status:', error)
    // Default to free plan with no usage if there's an error
    return {
      searchCount: 0,
      planType: 'free',
      hasReachedLimit: false,
      isSubscribed: false
    }
  }
}

/**
 * Increment user's daily search count
 */
export async function incrementSearchUsage(userId: string): Promise<boolean> {
  const supabase = createUsageClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

  try {
    // Try to increment existing record or create new one
    const { error } = await supabase
      .rpc('increment_daily_usage', {
        p_user_id: userId,
        p_usage_date: today
      })

    return !error
  } catch (error) {
    console.error('Error incrementing search usage:', error)
    return false
  }
}

/**
 * Check if user can perform a search (hasn't exceeded limits)
 */
export async function canUserSearch(userId: string): Promise<{
  canSearch: boolean
  usage: UserUsage
}> {
  const usage = await getUserUsageStatus(userId)
  
  return {
    canSearch: !usage.hasReachedLimit,
    usage
  }
}
