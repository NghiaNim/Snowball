// CLIENT-SIDE authentication helpers only

/**
 * Client-side helper to get current user ID
 * Used in browser context where we have access to localStorage and Supabase client
 */
export async function getClientUserId(): Promise<string | null> {
  // Check admin auth in localStorage
  const adminAuth = localStorage.getItem('production-auth')
  if (adminAuth === 'true') {
    return '00000000-0000-0000-0000-000000000001' // Demo user UUID from auth.users
  }

  // Check Supabase auth
  try {
    const { createClient: createBrowserClient } = await import('@/lib/supabase/client')
    const supabase = createBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    return session?.user?.id || null
  } catch {
    return null
  }
}

/**
 * Headers to include when making API requests from the client
 * Includes admin auth flag if user is admin
 */
export function getAuthHeaders(): HeadersInit {
  const adminAuth = localStorage.getItem('production-auth')
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }
  
  if (adminAuth === 'true') {
    headers['x-admin-auth'] = 'true'
  }
  
  return headers
}
