import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { createClient } from '@/lib/supabase/server'
import type { Founder, FounderWithRelationships, FounderInvestorRelationship } from '@/types/database'

// Input validation schemas
const createFounderSchema = z.object({
  user_id: z.string(),
  company_name: z.string().min(1),
  founder_name: z.string().min(1),
  email: z.string().email(),
  bio: z.string().optional(),
  linkedin_url: z.string().url().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  stage: z.string().optional(),
  location: z.string().optional(),
  funding_target: z.string().optional(),
  logo_emoji: z.string().optional(),
})

const updateFounderSchema = z.object({
  id: z.string().uuid(),
  company_name: z.string().min(1).optional(),
  founder_name: z.string().min(1).optional(),
  bio: z.string().optional(),
  linkedin_url: z.string().url().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  stage: z.string().optional(),
  location: z.string().optional(),
  funding_target: z.string().optional(),
  logo_emoji: z.string().optional(),
})

const createRelationshipSchema = z.object({
  founder_user_id: z.string(),
  investor_user_id: z.string(),
  relationship_type: z.enum(['tracking', 'interested', 'contacted', 'meeting_scheduled', 'passed', 'invested']),
  notes: z.string().optional(),
  initiated_by: z.enum(['founder', 'investor']).optional(),
})

const updateRelationshipSchema = z.object({
  id: z.string().uuid(),
  relationship_type: z.enum(['tracking', 'interested', 'contacted', 'meeting_scheduled', 'passed', 'invested']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  notes: z.string().optional(),
})

export const founderRouter = createTRPCRouter({
  // Get founder by user_id
  getByUserId: publicProcedure
    .input(z.object({ user_id: z.string() }))
    .query(async ({ input }) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('founders')
        .select('*')
        .eq('user_id', input.user_id)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw new Error(`Failed to fetch founder: ${error.message}`)
      }

      return data as Founder | null
    }),

  // Get founder with all relationships and data
  getWithRelationships: publicProcedure
    .input(z.object({ user_id: z.string() }))
    .query(async ({ input }) => {
      const supabase = await createClient()

      // Get founder data
      const { data: founder, error: founderError } = await supabase
        .from('founders')
        .select('*')
        .eq('user_id', input.user_id)
        .eq('is_active', true)
        .single()

      if (founderError && founderError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch founder: ${founderError.message}`)
      }

      if (!founder) return null

      // Get relationships with investor details
      const { data: relationships, error: relationshipsError } = await supabase
        .from('founder_investor_relationships')
        .select(`
          *,
          investor:investors(*)
        `)
        .eq('founder_id', founder.id)
        .eq('status', 'active')

      if (relationshipsError) {
        throw new Error(`Failed to fetch relationships: ${relationshipsError.message}`)
      }

      // Get pitch deck
      const { data: pitchDeck } = await supabase
        .from('pitch_decks')
        .select('*')
        .eq('user_id', input.user_id)
        .eq('is_active', true)
        .single()

      // Get updates
      const { data: updates } = await supabase
        .from('company_updates')
        .select('*')
        .eq('company_id', input.user_id)
        .order('created_at', { ascending: false })

      return {
        ...founder,
        relationships: relationships || [],
        pitch_deck: pitchDeck || null,
        updates: updates || [],
      } as FounderWithRelationships
    }),

  // Create or update founder
  upsert: publicProcedure
    .input(createFounderSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('founders')
        .upsert({
          ...input,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to upsert founder: ${error.message}`)
      }

      return data as Founder
    }),

  // Update founder
  update: publicProcedure
    .input(updateFounderSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('founders')
        .update(input)
        .eq('id', input.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update founder: ${error.message}`)
      }

      return data as Founder
    }),

  // Get all tracking relationships for a founder
  getTrackingInvestors: publicProcedure
    .input(z.object({ user_id: z.string() }))
    .query(async ({ input }) => {
      const supabase = await createClient()

      // First get the founder
      const { data: founder } = await supabase
        .from('founders')
        .select('id')
        .eq('user_id', input.user_id)
        .single()

      if (!founder) {
        return []
      }

      // Get tracking relationships
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
        throw new Error(`Failed to fetch tracking investors: ${error.message}`)
      }

      return data || []
    }),

  // Create a new relationship (for tracking, etc.)
  createRelationship: publicProcedure
    .input(createRelationshipSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      // Get founder and investor IDs
      const [{ data: founder }, { data: investor }] = await Promise.all([
        supabase.from('founders').select('id').eq('user_id', input.founder_user_id).single(),
        supabase.from('investors').select('id').eq('user_id', input.investor_user_id).single()
      ])

      if (!founder || !investor) {
        throw new Error('Founder or investor not found')
      }

      const { data, error } = await supabase
        .from('founder_investor_relationships')
        .upsert({
          founder_id: founder.id,
          investor_id: investor.id,
          relationship_type: input.relationship_type,
          notes: input.notes,
          initiated_by: input.initiated_by,
          status: 'active',
          last_interaction_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create relationship: ${error.message}`)
      }

      return data as FounderInvestorRelationship
    }),

  // Update a relationship
  updateRelationship: publicProcedure
    .input(updateRelationshipSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      const updateData: Record<string, unknown> = {
        ...input,
        last_interaction_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('founder_investor_relationships')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update relationship: ${error.message}`)
      }

      return data as FounderInvestorRelationship
    }),

  // Get relationship statistics for a founder
  getRelationshipStats: publicProcedure
    .input(z.object({ user_id: z.string() }))
    .query(async ({ input }) => {
      const supabase = await createClient()

      // Get founder ID
      const { data: founder } = await supabase
        .from('founders')
        .select('id')
        .eq('user_id', input.user_id)
        .single()

      if (!founder) {
        return {
          total: 0,
          tracking: 0,
          interested: 0,
          contacted: 0,
          meeting_scheduled: 0,
          passed: 0,
          invested: 0,
        }
      }

      // Get relationship counts by type
      const { data, error } = await supabase
        .from('founder_investor_relationships')
        .select('relationship_type')
        .eq('founder_id', founder.id)
        .eq('status', 'active')

      if (error) {
        throw new Error(`Failed to fetch relationship stats: ${error.message}`)
      }

      const stats = {
        total: data?.length || 0,
        tracking: 0,
        interested: 0,
        contacted: 0,
        meeting_scheduled: 0,
        passed: 0,
        invested: 0,
      }

      data?.forEach((rel) => {
        stats[rel.relationship_type as keyof typeof stats]++
      })

      return stats
    }),
})
