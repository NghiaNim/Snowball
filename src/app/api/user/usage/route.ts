import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth-helpers-server'
import { getUserUsageStatus } from '@/lib/usage-helpers'

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const usage = await getUserUsageStatus(userId)

    return NextResponse.json({
      success: true,
      usage
    })
  } catch (error) {
    console.error('Error getting user usage:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get usage information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
