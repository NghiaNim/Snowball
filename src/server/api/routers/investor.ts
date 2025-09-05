import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { createClient } from '@/lib/supabase/server'
import type { InvestorProfile, CompanyWithProfile, Tribe, Knock } from '@/types/database'

// Input validation schemas
const investmentCriteriaSchema = z.object({
  preferred_stages: z.array(z.string()),
  industries: z.array(z.string()),
  geographies: z.array(z.string()),
  check_size_min: z.number().positive().optional(),
  check_size_max: z.number().positive().optional(),
  bio: z.string().optional(),
  linkedin_url: z.string().url().optional(),
})

const trackCompanySchema = z.object({
  company_id: z.string().uuid(),
})

const knockSchema = z.object({
  company_id: z.string().uuid(),
  message: z.string().optional(),
})

const feedbackSchema = z.object({
  company_id: z.string().uuid(),
  is_positive: z.boolean(),
  reason: z.string().optional(),
})

const subscriptionTierSchema = z.object({
  tier: z.enum(['free', 'premium', 'enterprise', 'custom']),
})

export const investorRouter = createTRPCRouter({
  // Get current investor profile
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const supabase = await createClient()
      
      const { data: profile, error } = await supabase
        .from('investor_profiles')
        .select('*')
        .eq('user_id', ctx.user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw new Error(`Failed to fetch investor profile: ${error.message}`)
      }

      return profile as InvestorProfile | null
    }),

  // Create or update investor profile
  updateProfile: protectedProcedure
    .input(investmentCriteriaSchema)
    .mutation(async ({ ctx, input }) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('investor_profiles')
        .upsert({
          user_id: ctx.user.id,
          ...input,
          investment_criteria: {
            stages: input.preferred_stages,
            industries: input.industries,
            geographies: input.geographies,
            check_size_range: {
              min: input.check_size_min,
              max: input.check_size_max,
            }
          }
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update investor profile: ${error.message}`)
      }

      // Update profile completion status
      await supabase
        .from('users')
        .update({ profile_complete: true })
        .eq('id', ctx.user.id)

      return data as InvestorProfile
    }),

  // Get available tribes
  getTribes: protectedProcedure
    .query(async () => {
      const supabase = await createClient()
      
      const { data: tribes, error } = await supabase
        .from('tribes')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        throw new Error(`Failed to fetch tribes: ${error.message}`)
      }

      return tribes as Tribe[]
    }),

  // Join a tribe
  joinTribe: protectedProcedure
    .input(z.object({ tribe_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('tribe_memberships')
        .insert({
          user_id: ctx.user.id,
          tribe_id: input.tribe_id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to join tribe: ${error.message}`)
      }

      return data
    }),

  // Get joined tribes
  getMyTribes: protectedProcedure
    .query(async ({ ctx }) => {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('tribe_memberships')
        .select(`
          *,
          tribe:tribes(*)
        `)
        .eq('user_id', ctx.user.id)

      if (error) {
        throw new Error(`Failed to fetch user tribes: ${error.message}`)
      }

      return data
    }),

  // Get company feed (tribe-filtered)
  getCompanyFeed: protectedProcedure
    .input(z.object({
      stage: z.string().optional(),
      industry: z.string().optional(),
      geography: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const supabase = await createClient()

      // Build query for companies in user's tribes
      let query = supabase
        .from('company_profiles')
        .select(`
          *,
          user:users(*),
          tribe_memberships(
            tribe:tribes(*)
          )
        `)
        .in('user_id', [
          // Subquery to get company user IDs from user's tribes
        ])

      // Apply filters
      if (input.stage) {
        query = query.eq('stage', input.stage)
      }
      if (input.industry) {
        query = query.eq('industry', input.industry)
      }
      if (input.geography) {
        query = query.eq('geography', input.geography)
      }
      if (input.status) {
        query = query.eq('fundraising_status', input.status)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1)

      if (error) {
        throw new Error(`Failed to fetch company feed: ${error.message}`)
      }

      return data as CompanyWithProfile[]
    }),

  // Track/untrack a company (with credit system)
  toggleTracking: protectedProcedure
    .input(trackCompanySchema)
    .mutation(async ({ ctx, input }) => {
      const supabase = await createClient()

      // Get investor info with current credits
      const { data: investor, error: investorError } = await supabase
        .from('investors')
        .select('id, credits, subscription_tier')
        .eq('user_id', ctx.user.id)
        .single()

      if (investorError) {
        throw new Error(`Failed to fetch investor info: ${investorError.message}`)
      }

      // Check if already tracking
      const { data: existing } = await supabase
        .from('founder_investor_relationships')
        .select('*')
        .eq('investor_id', investor.id)
        .eq('founder_id', input.company_id) // assuming company_id is founder_id
        .eq('relationship_type', 'tracking')
        .single()

      if (existing) {
        // Untrack - refund credits
        const { error: deleteError } = await supabase
          .from('founder_investor_relationships')
          .delete()
          .eq('investor_id', investor.id)
          .eq('founder_id', input.company_id)
          .eq('relationship_type', 'tracking')

        if (deleteError) {
          throw new Error(`Failed to untrack company: ${deleteError.message}`)
        }

        // Refund 100 credits
        const newCredits = investor.credits + 100
        await supabase
          .from('investors')
          .update({ credits: newCredits })
          .eq('id', investor.id)

        // Record the transaction
        await supabase
          .from('credit_transactions')
          .insert({
            investor_id: investor.id,
            amount: 100,
            transaction_type: 'untrack_startup',
            startup_id: input.company_id,
            description: 'Credits refunded for untracking startup'
          })

        return { tracked: false, credits: newCredits }
      } else {
        // Track - check credits first
        if (investor.credits < 100) {
          throw new Error('Insufficient credits. Please upgrade your subscription or purchase more credits.')
        }

        // Track the company
        const { data, error } = await supabase
          .from('founder_investor_relationships')
          .insert({
            investor_id: investor.id,
            founder_id: input.company_id,
            relationship_type: 'tracking',
            status: 'active',
            initiated_by: 'investor'
          })
          .select()
          .single()

        if (error) {
          throw new Error(`Failed to track company: ${error.message}`)
        }

        // Deduct 100 credits
        const newCredits = investor.credits - 100
        await supabase
          .from('investors')
          .update({ credits: newCredits })
          .eq('id', investor.id)

        // Record the transaction
        await supabase
          .from('credit_transactions')
          .insert({
            investor_id: investor.id,
            amount: -100,
            transaction_type: 'track_startup',
            startup_id: input.company_id,
            description: 'Credits used for tracking startup'
          })

        return { tracked: true, data, credits: newCredits }
      }
    }),

  // Get tracked companies
  getTrackedCompanies: protectedProcedure
    .query(async ({ ctx }) => {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('tracking')
        .select(`
          *,
          company:company_profiles(
            *,
            user:users(*)
          )
        `)
        .eq('investor_id', ctx.user.id)
        .order('tracked_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch tracked companies: ${error.message}`)
      }

      return data
    }),

  // Send a knock (meeting request)
  sendKnock: protectedProcedure
    .input(knockSchema)
    .mutation(async ({ ctx, input }) => {
      const supabase = await createClient()

      // Check if knock already exists
      const { data: existing } = await supabase
        .from('knocks')
        .select('*')
        .eq('investor_id', ctx.user.id)
        .eq('company_id', input.company_id)
        .single()

      if (existing) {
        throw new Error('Meeting request already sent to this company')
      }

      const { data, error } = await supabase
        .from('knocks')
        .insert({
          investor_id: ctx.user.id,
          company_id: input.company_id,
          message: input.message,
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to send knock: ${error.message}`)
      }

      // TODO: Send email notification to founder

      return data as Knock
    }),

  // Get knock history
  getKnockHistory: protectedProcedure
    .query(async ({ ctx }) => {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('knocks')
        .select(`
          *,
          company:company_profiles(
            *,
            user:users(*)
          )
        `)
        .eq('investor_id', ctx.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch knock history: ${error.message}`)
      }

      return data
    }),

  // Provide feedback on a deal (thumbs up/down)
  provideFeedback: protectedProcedure
    .input(feedbackSchema)
    .mutation(async ({ ctx, input }) => {
      // For MVP, we'll just log the feedback
      // In the future, this will feed into the recommendation algorithm
      console.log('Deal feedback:', {
        investor_id: ctx.user.id,
        company_id: input.company_id,
        is_positive: input.is_positive,
        reason: input.reason,
      })

      return { success: true }
    }),

  // Get investor credits and subscription info
  getCreditsInfo: protectedProcedure
    .query(async ({ ctx }) => {
      const supabase = await createClient()
      
      const { data: investor, error } = await supabase
        .from('investors')
        .select('credits, subscription_tier, max_credits, subscription_expires_at')
        .eq('user_id', ctx.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch credits info: ${error.message}`)
      }

      return investor || { credits: 0, subscription_tier: 'free', max_credits: 100, subscription_expires_at: null }
    }),

  // Update subscription tier
  updateSubscriptionTier: protectedProcedure
    .input(subscriptionTierSchema)
    .mutation(async ({ ctx, input }) => {
      const supabase = await createClient()

      // Get current investor info
      const { data: investor, error: fetchError } = await supabase
        .from('investors')
        .select('id, credits')
        .eq('user_id', ctx.user.id)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch investor: ${fetchError.message}`)
      }

      // Determine new credit limits based on tier
      const tierLimits = {
        free: 100,
        premium: 300,
        enterprise: 1000,
        custom: 10000 // placeholder for custom tier
      }

      const newMaxCredits = tierLimits[input.tier]
      const creditDifference = newMaxCredits - investor.credits

      // Update subscription and add credits if upgrading
      const updateData: Record<string, unknown> = {
        subscription_tier: input.tier,
        max_credits: newMaxCredits,
        subscription_expires_at: input.tier !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
      }

      if (creditDifference > 0) {
        updateData.credits = newMaxCredits
      }

      const { data, error } = await supabase
        .from('investors')
        .update(updateData)
        .eq('id', investor.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update subscription: ${error.message}`)
      }

      // Record credit transaction if credits were added
      if (creditDifference > 0) {
        await supabase
          .from('credit_transactions')
          .insert({
            investor_id: investor.id,
            amount: creditDifference,
            transaction_type: 'subscription_purchase',
            description: `Credits added for ${input.tier} subscription upgrade`
          })
      }

      return data
    }),

  // Get credit transaction history
  getCreditHistory: protectedProcedure
    .query(async ({ ctx }) => {
      const supabase = await createClient()

      // Get investor ID first
      const { data: investor, error: investorError } = await supabase
        .from('investors')
        .select('id')
        .eq('user_id', ctx.user.id)
        .single()

      if (investorError) {
        throw new Error(`Failed to fetch investor: ${investorError.message}`)
      }
      
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('investor_id', investor.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        throw new Error(`Failed to fetch credit history: ${error.message}`)
      }

      return data
    }),
})
