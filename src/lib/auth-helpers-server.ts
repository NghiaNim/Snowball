import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * SERVER-SIDE ONLY: Gets the current user ID from the request, handling both admin and Supabase auth
 * Returns null if no valid authentication is found
 */
export async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Check for admin session first
  const adminAuth = request.headers.get('x-admin-auth')
  if (adminAuth === 'true') {
    // For admin users, we'll use a special admin UUID
    return '00000000-0000-0000-0000-000000000000' // Different from the demo UUID
  }

  // Check Supabase authentication
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user.id
  } catch {
    return null
  }
}
