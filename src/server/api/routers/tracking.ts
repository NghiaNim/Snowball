import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { createClient } from '@/lib/supabase/server'
import type { Investor, FounderInvestorRelationship } from '@/types/database'

// Helper function to get or create investor
async function getOrCreateInvestor(email: string, name?: string, firm?: string) {
  const supabase = await createClient()

  // Try to find existing investor
  const { data: existing } = await supabase
    .from('investors')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single()

  if (existing) {
    return existing as Investor
  }

  // Create new investor
  const { data, error } = await supabase
    .from('investors')
    .insert({
      user_id: `investor-${Date.now()}`, // Temporary user ID for anonymous investors
      investor_name: name || 'Anonymous Investor',
      email: email,
      firm_name: firm,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create investor: ${error.message}`)
  }

  return data as Investor
}

const trackFounderSchema = z.object({
  investor_email: z.string().email(),
  founder_user_id: z.string(),
  notes: z.string().optional(),
})

const updateTrackingSchema = z.object({
  relationship_id: z.string().uuid(),
  relationship_type: z.enum(['tracking', 'interested', 'contacted', 'meeting_scheduled', 'passed', 'invested']).optional(),
  notes: z.string().optional(),
})

export const trackingRouter = createTRPCRouter({
  // Create or get investor by email (for anonymous tracking)
  getOrCreateInvestor: publicProcedure
    .input(z.object({ 
      email: z.string().email(),
      investor_name: z.string().optional(),
      firm_name: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      // Try to find existing investor
      const { data: existing } = await supabase
        .from('investors')
        .select('*')
        .eq('email', input.email)
        .eq('is_active', true)
        .single()

      if (existing) {
        return existing as Investor
      }

      // Create new investor
      const { data, error } = await supabase
        .from('investors')
        .insert({
          user_id: `investor-${Date.now()}`, // Temporary user ID for anonymous investors
          investor_name: input.investor_name || 'Anonymous Investor',
          email: input.email,
          firm_name: input.firm_name,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create investor: ${error.message}`)
      }

      return data as Investor
    }),

  // Track a founder (anonymous or authenticated)
  trackFounder: publicProcedure
    .input(trackFounderSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      // Get or create investor
      const investor = await getOrCreateInvestor(input.investor_email)

      // Get founder
      const { data: founder, error: founderError } = await supabase
        .from('founders')
        .select('id')
        .eq('user_id', input.founder_user_id)
        .single()

      if (founderError || !founder) {
        throw new Error('Founder not found')
      }

      // Create or update tracking relationship
      const { data, error } = await supabase
        .from('founder_investor_relationships')
        .upsert({
          founder_id: founder.id,
          investor_id: investor.id,
          relationship_type: 'tracking',
          notes: input.notes,
          initiated_by: 'investor',
          status: 'active',
          last_interaction_at: new Date().toISOString(),
        }, {
          onConflict: 'founder_id,investor_id'
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create tracking relationship: ${error.message}`)
      }

      return data as FounderInvestorRelationship
    }),

  // Get all investors tracking a founder
  getFounderTrackers: publicProcedure
    .input(z.object({ founder_user_id: z.string() }))
    .query(async ({ input }) => {
      const supabase = await createClient()

      // Get founder ID
      const { data: founder } = await supabase
        .from('founders')
        .select('id')
        .eq('user_id', input.founder_user_id)
        .single()

      if (!founder) {
        return []
      }

      // Get tracking relationships with investor details
      const { data, error } = await supabase
        .from('founder_investor_relationships')
        .select(`
          *,
          investor:investors(*)
        `)
        .eq('founder_id', founder.id)
        .eq('relationship_type', 'tracking')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch trackers: ${error.message}`)
      }

      return data || []
    }),

  // Get tracking stats for a founder
  getTrackingStats: publicProcedure
    .input(z.object({ founder_user_id: z.string() }))
    .query(async ({ input }) => {
      const supabase = await createClient()

      // Get founder ID
      const { data: founder } = await supabase
        .from('founders')
        .select('id')
        .eq('user_id', input.founder_user_id)
        .single()

      if (!founder) {
        return {
          total_tracking: 0,
          new_this_week: 0,
          by_relationship_type: {
            tracking: 0,
            interested: 0,
            contacted: 0,
            meeting_scheduled: 0,
            passed: 0,
            invested: 0,
          }
        }
      }

      // Get all relationships
      const { data: relationships, error } = await supabase
        .from('founder_investor_relationships')
        .select('relationship_type, created_at')
        .eq('founder_id', founder.id)
        .eq('status', 'active')

      if (error) {
        throw new Error(`Failed to fetch tracking stats: ${error.message}`)
      }

      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const stats = {
        total_tracking: 0,
        new_this_week: 0,
        by_relationship_type: {
          tracking: 0,
          interested: 0,
          contacted: 0,
          meeting_scheduled: 0,
          passed: 0,
          invested: 0,
        }
      }

      relationships?.forEach((rel) => {
        if (rel.relationship_type === 'tracking') {
          stats.total_tracking++
        }
        
        stats.by_relationship_type[rel.relationship_type as keyof typeof stats.by_relationship_type]++
        
        if (new Date(rel.created_at) > oneWeekAgo) {
          stats.new_this_week++
        }
      })

      return stats
    }),

  // Update tracking relationship
  updateTracking: publicProcedure
    .input(updateTrackingSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      const updateData: Record<string, unknown> = {
        ...input,
        last_interaction_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('founder_investor_relationships')
        .update(updateData)
        .eq('id', input.relationship_id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update tracking: ${error.message}`)
      }

      return data as FounderInvestorRelationship
    }),

  // Stop tracking (set status to inactive)
  stopTracking: publicProcedure
    .input(z.object({ 
      relationship_id: z.string().uuid() 
    }))
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('founder_investor_relationships')
        .update({ 
          status: 'inactive',
          last_interaction_at: new Date().toISOString(),
        })
        .eq('id', input.relationship_id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to stop tracking: ${error.message}`)
      }

      return data as FounderInvestorRelationship
    }),

  // Check if investor is already tracking Snowball
  checkSnowballTracking: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const supabase = await createClient()

      try {
        // Find investor by email
        const { data: investor } = await supabase
          .from('investors')
          .select('id')
          .eq('email', input.email)
          .eq('is_active', true)
          .single()

        if (!investor) {
          return { isTracking: false, investor: null }
        }

        // Get Snowball's founder ID
        const { data: snowballFounder } = await supabase
          .from('founders')
          .select('id')
          .eq('user_id', 'snowball-demo-user')
          .single()

        if (!snowballFounder) {
          return { isTracking: false, investor: null }
        }

        // Check if tracking relationship exists
        const { data: tracking } = await supabase
          .from('founder_investor_relationships')
          .select('id, status')
          .eq('founder_id', snowballFounder.id)
          .eq('investor_id', investor.id)
          .eq('relationship_type', 'tracking')
          .single()

        return { 
          isTracking: !!tracking && tracking.status === 'active',
          investor: investor,
          relationshipId: tracking?.id
        }

      } catch (error) {
        console.error('Error checking Snowball tracking status:', error)
        return { isTracking: false, investor: null }
      }
    }),

  // Track Snowball specifically (public - no auth required)
  trackSnowball: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1),
      firm: z.string().optional(),
      title: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      try {
        // First, check if investor already exists
        const { data: existingInvestor } = await supabase
          .from('investors')
          .select('id')
          .eq('email', input.email)
          .eq('is_active', true)
          .single()

        let investorId: string

        if (existingInvestor) {
          investorId = existingInvestor.id
        } else {
          // Create new investor record
          const { data: newInvestor, error: investorError } = await supabase
            .from('investors')
            .insert({
              user_id: `temp-${Date.now()}`, // Temporary user_id for tracking-only investors
              investor_name: input.name,
              email: input.email,
              firm_name: input.firm,
              title: input.title,
              is_active: true,
            })
            .select('id')
            .single()

          if (investorError) {
            throw new Error(`Failed to create investor record: ${investorError.message}`)
          }

          investorId = newInvestor.id
        }

        // Get Snowball's founder ID (we'll use a hardcoded ID for now)
        const { data: snowballFounder } = await supabase
          .from('founders')
          .select('id')
          .eq('user_id', 'snowball-demo-user')
          .single()

        if (!snowballFounder) {
          throw new Error('Snowball founder record not found')
        }

        // Check if already tracking
        const { data: existingTracking } = await supabase
          .from('founder_investor_relationships')
          .select('id')
          .eq('founder_id', snowballFounder.id)
          .eq('investor_id', investorId)
          .eq('relationship_type', 'tracking')
          .eq('status', 'active')
          .single()

        if (existingTracking) {
          return { 
            success: true, 
            alreadyTracking: true,
            message: 'You are already tracking Snowball!'
          }
        }

        // Create tracking relationship
        const { data: tracking, error: trackingError } = await supabase
          .from('founder_investor_relationships')
          .insert({
            founder_id: snowballFounder.id,
            investor_id: investorId,
            relationship_type: 'tracking',
            status: 'active',
            initiated_by: 'investor',
            notes: `Started tracking via public page on ${new Date().toISOString()}`,
          })
          .select()
          .single()

        if (trackingError) {
          throw new Error(`Failed to create tracking relationship: ${trackingError.message}`)
        }

        return { 
          success: true, 
          alreadyTracking: false,
          message: 'Successfully started tracking Snowball! You will receive major updates via email.',
          trackingId: tracking.id
        }

      } catch (error) {
        console.error('Error tracking Snowball:', error)
        throw new Error(`Failed to track Snowball: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }),

  // Stop tracking Snowball
  stopTrackingSnowball: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      try {
        // Find investor by email
        const { data: investor } = await supabase
          .from('investors')
          .select('id')
          .eq('email', input.email)
          .eq('is_active', true)
          .single()

        if (!investor) {
          return { success: false, message: 'Investor not found' }
        }

        // Get Snowball's founder ID
        const { data: snowballFounder } = await supabase
          .from('founders')
          .select('id')
          .eq('user_id', 'snowball-demo-user')
          .single()

        if (!snowballFounder) {
          return { success: false, message: 'Snowball founder record not found' }
        }

        // Update tracking relationship to inactive
        const { error } = await supabase
          .from('founder_investor_relationships')
          .update({ 
            status: 'inactive',
            last_interaction_at: new Date().toISOString(),
          })
          .eq('founder_id', snowballFounder.id)
          .eq('investor_id', investor.id)
          .eq('relationship_type', 'tracking')

        if (error) {
          throw new Error(`Failed to stop tracking: ${error.message}`)
        }

        return { 
          success: true, 
          message: 'You have stopped tracking Snowball.'
        }

      } catch (error) {
        console.error('Error stopping Snowball tracking:', error)
        throw new Error(`Failed to stop tracking: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }),

  // Bulk track multiple founders (for investors)
  bulkTrackFounders: publicProcedure
    .input(z.object({
      investor_email: z.string().email(),
      founder_user_ids: z.array(z.string()),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      // Get or create investor
      const investor = await getOrCreateInvestor(input.investor_email)

      // Get all founders
      const { data: founders, error: foundersError } = await supabase
        .from('founders')
        .select('id, user_id')
        .in('user_id', input.founder_user_ids)

      if (foundersError) {
        throw new Error(`Failed to fetch founders: ${foundersError.message}`)
      }

      // Create tracking relationships
      const relationships = founders?.map(founder => ({
        founder_id: founder.id,
        investor_id: investor.id,
        relationship_type: 'tracking' as const,
        notes: input.notes,
        initiated_by: 'investor' as const,
        status: 'active' as const,
        last_interaction_at: new Date().toISOString(),
      })) || []

      const { data, error } = await supabase
        .from('founder_investor_relationships')
        .upsert(relationships, {
          onConflict: 'founder_id,investor_id'
        })
        .select()

      if (error) {
        throw new Error(`Failed to create bulk tracking: ${error.message}`)
      }

      return data as FounderInvestorRelationship[]
    }),

  // Track pricing button clicks
  trackPricingInteraction: publicProcedure
    .input(z.object({
      user_id: z.string().optional(),
      user_email: z.string().email().optional(),
      tier_name: z.string(),
      action: z.enum(['viewed', 'clicked_button', 'interested']),
      button_text: z.string().optional(),
      metadata: z.object({
        page: z.string().optional(),
        timestamp: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('pricing_tracking')
        .insert({
          user_id: input.user_id || 'anonymous',
          user_email: input.user_email,
          tier_name: input.tier_name,
          action: input.action,
          button_text: input.button_text,
          metadata: input.metadata || {},
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to track pricing interaction: ${error.message}`)
      }

      return data
    }),
})
