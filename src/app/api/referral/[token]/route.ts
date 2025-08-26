import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = await createClient()
    const { token } = await params

    // Get the referral link data
    const { data: linkData, error } = await supabase
      .from('referral_links')
      .select('*')
      .eq('link_token', token)
      .eq('is_active', true)
      .single()

    if (error || !linkData) {
      return NextResponse.json(
        { error: 'Referral link not found' },
        { status: 404 }
      )
    }

    // Check if link has expired
    if (new Date() > new Date(linkData.expires_at)) {
      // Mark as inactive
      await supabase
        .from('referral_links')
        .update({ is_active: false })
        .eq('id', linkData.id)

      return NextResponse.json(
        { error: 'Referral link has expired' },
        { status: 410 }
      )
    }

    return NextResponse.json({
      welcomeMessage: linkData.welcome_message,
      backgroundColor: linkData.background_color,
      targetRole: linkData.target_role,
      investorTemplateId: linkData.investor_template_id,
      founderTemplateId: linkData.founder_template_id
    })
  } catch (error) {
    console.error('Error fetching referral data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
