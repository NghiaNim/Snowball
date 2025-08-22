import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { createClient } from '@/lib/supabase/server'

export const adminRouter = createTRPCRouter({
  // Admin login
  login: publicProcedure
    .input(z.object({
      username: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Hard-coded admin credentials for MVP
      const adminUsername = process.env.ADMIN_USERNAME || 'admin'
      const adminPassword = process.env.ADMIN_PASSWORD || 'password123'
      
      if (input.username === adminUsername && input.password === adminPassword) {
        return {
          success: true,
          token: 'admin-session-token', // Simple token for MVP
        }
      }
      
      throw new Error('Invalid credentials')
    }),

  // Generate referral links
  generateReferralLinks: publicProcedure
    .input(z.object({
      welcomeMessage: z.string().min(1),
      backgroundColor: z.enum(['blue', 'green', 'purple', 'orange', 'red', 'gray']),
    }))
    .mutation(async ({ input }) => {
      const supabase = await createClient()
      
      const baseToken = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      
      // Create investor link
      const investorToken = `${baseToken}_investor`
      const { error: investorError } = await supabase
        .from('referral_links')
        .insert({
          link_token: investorToken,
          welcome_message: input.welcomeMessage,
          background_color: input.backgroundColor,
          target_role: 'investor',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()
      
      if (investorError) {
        throw new Error(`Failed to create investor link: ${investorError.message}`)
      }
      
      // Create founder link
      const founderToken = `${baseToken}_founder`
      const { error: founderError } = await supabase
        .from('referral_links')
        .insert({
          link_token: founderToken,
          welcome_message: input.welcomeMessage,
          background_color: input.backgroundColor,
          target_role: 'founder',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()
      
      if (founderError) {
        throw new Error(`Failed to create founder link: ${founderError.message}`)
      }
      
      return {
        investorLink: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${investorToken}`,
        founderLink: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${founderToken}`,
        expiresAt: expiresAt.toISOString(),
      }
    }),

  // Get referral link data
  getReferralLink: publicProcedure
    .input(z.object({
      linkId: z.string(),
    }))
    .query(async ({ input }) => {
      const supabase = await createClient()
      
      // First clean up expired links
      await supabase.rpc('cleanup_expired_referral_links')
      
      // Get the referral link
      const { data: linkData, error } = await supabase
        .from('referral_links')
        .select('*')
        .eq('link_token', input.linkId)
        .eq('is_active', true)
        .single()
      
      if (error || !linkData) {
        throw new Error('Referral link not found')
      }
      
      // Double-check expiration (in case cleanup function didn't run)
      if (new Date() > new Date(linkData.expires_at)) {
        // Mark as inactive
        await supabase
          .from('referral_links')
          .update({ is_active: false })
          .eq('id', linkData.id)
        
        throw new Error('Referral link has expired')
      }
      
      return {
        welcomeMessage: linkData.welcome_message,
        backgroundColor: linkData.background_color,
        targetRole: linkData.target_role,
      }
    }),
})
