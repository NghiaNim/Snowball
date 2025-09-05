import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { createClient } from '@/lib/supabase/server'
import type { PitchDeck, CompanyUpdate } from '@/types/database'

// Input validation schemas
const pitchDeckUploadSchema = z.object({
  user_id: z.string(),
  file_name: z.string(),
  file_url: z.string(),
  public_url: z.string().optional(),
  file_size: z.number().optional(),
  file_type: z.string().optional(),
  gcs_bucket: z.string().optional(),
  gcs_object_path: z.string().optional(),
})

const updatePitchDeckSchema = z.object({
  id: z.string().uuid(),
  file_url: z.string().optional(),
  public_url: z.string().optional(),
  upload_status: z.enum(['uploading', 'completed', 'failed']).optional(),
})

const createUpdateSchema = z.object({
  company_id: z.string(), // Using string for now, will be UUID later
  title: z.string(),
  content: z.string(),
  type: z.enum(['major', 'minor', 'coolsies']),
  metrics: z.record(z.string(), z.unknown()).optional(),
})

const updateCompanyProfileSchema = z.object({
  user_id: z.string(),
  company_name: z.string(),
  industry: z.string(),
  stage: z.string(),
  location: z.string(),
  bio: z.string().optional(), // Using bio field for company description
  funding_target: z.string(),
  website: z.string(),
  mission: z.string().optional(),
  linkedin_url: z.string().optional(),
  twitter_url: z.string().optional(),
  email_contact: z.string().optional(),
})

const updateTeamSchema = z.object({
  user_id: z.string(),
  team_members: z.array(z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    profile_picture_url: z.string().nullable().optional(),
    linkedin_url: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
  })),
})

const updateFundraisingStatusSchema = z.object({
  user_id: z.string(),
  status: z.enum(['not_fundraising', 'preparing_to_raise', 'actively_fundraising']),
  target_amount: z.number().optional(),
  raised_amount: z.number().optional(),
  stage: z.string().optional(),
  deadline: z.string().nullable().optional(), // ISO date string, can be null
  notes: z.string().optional(),
})

const updateCompanyUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  content: z.string(),
  type: z.enum(['major', 'minor', 'coolsies']),
  metrics: z.record(z.string(), z.unknown()).optional(),
})

const getUserUpdatesSchema = z.object({
  user_id: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
})

export const companyRouter = createTRPCRouter({
  // Upload or update pitch deck
  uploadPitchDeck: publicProcedure
    .input(pitchDeckUploadSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      // First deactivate any existing active decks for this user
      await supabase
        .from('pitch_decks')
        .update({ is_active: false })
        .eq('user_id', input.user_id)
        .eq('is_active', true)

      // Insert new pitch deck
      const { data, error } = await supabase
        .from('pitch_decks')
        .insert({
          user_id: input.user_id,
          file_name: input.file_name,
          file_url: input.file_url,
          public_url: input.public_url,
          file_size: input.file_size,
          file_type: input.file_type,
          gcs_bucket: input.gcs_bucket,
          gcs_object_path: input.gcs_object_path,
          upload_status: 'completed',
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to upload pitch deck: ${error.message}`)
      }

      return data as PitchDeck
    }),

  // Update existing pitch deck
  updatePitchDeck: publicProcedure
    .input(updatePitchDeckSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('pitch_decks')
        .update(input)
        .eq('id', input.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update pitch deck: ${error.message}`)
      }

      return data as PitchDeck
    }),

  // Get active pitch deck for user
  getActivePitchDeck: publicProcedure
    .input(z.object({ user_id: z.string() }))
    .query(async ({ input }) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('pitch_decks')
        .select('*')
        .eq('user_id', input.user_id)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw new Error(`Failed to fetch pitch deck: ${error.message}`)
      }

      return data as PitchDeck | null
    }),

  // Create company update
  createUpdate: publicProcedure
    .input(createUpdateSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('company_updates')
        .insert({
          company_id: input.company_id,
          title: input.title,
          content: input.content,
          type: input.type,
          metrics: input.metrics || {},
          email_sent_at: input.type === 'major' ? new Date().toISOString() : null,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create update: ${error.message}`)
      }

      return data as CompanyUpdate
    }),

  // Get updates for a company/user
  getUpdates: publicProcedure
    .input(getUserUpdatesSchema)
    .query(async ({ input }) => {
      const supabase = await createClient()

      let query = supabase
        .from('company_updates')
        .select('*')
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1)

      // If user_id is provided, filter by it
      if (input.user_id) {
        query = query.eq('company_id', input.user_id)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch updates: ${error.message}`)
      }

      return data as CompanyUpdate[]
    }),

  // Update company profile
  updateProfile: publicProcedure
    .input(updateCompanyProfileSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('founders')
        .update({
          company_name: input.company_name,
          industry: input.industry,
          stage: input.stage,
          location: input.location,
          bio: input.bio,
          funding_target: input.funding_target,
          website: input.website,
          mission: input.mission,
          linkedin_url: input.linkedin_url,
          twitter_url: input.twitter_url,
          email_contact: input.email_contact,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', input.user_id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update company profile: ${error.message}`)
      }

      return data
    }),

  // Update team information (stored in a separate table or JSON field)
  updateTeam: publicProcedure
    .input(updateTeamSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      // For now, we'll store team info in a separate company_teams table
      // First, delete existing team members for this company
      await supabase
        .from('company_teams')
        .delete()
        .eq('user_id', input.user_id)

      // Insert new team members
      if (input.team_members.length > 0) {
        const teamData = input.team_members.map(member => ({
          user_id: input.user_id,
          name: member.name,
          role: member.role,
          bio: member.bio,
          profile_picture_url: member.profile_picture_url || null,
          linkedin_url: member.linkedin_url || null,
          email: member.email || null,
        }))

        const { data, error } = await supabase
          .from('company_teams')
          .insert(teamData)
          .select()

        if (error) {
          throw new Error(`Failed to update team: ${error.message}`)
        }

        return data
      }

      return []
    }),

  // Get team information
  getTeam: publicProcedure
    .input(z.object({ user_id: z.string() }))
    .query(async ({ input }) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('company_teams')
        .select('*')
        .eq('user_id', input.user_id)
        .order('created_at', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch team: ${error.message}`)
      }

      return data || []
    }),

  // Get specific update by ID
  getUpdateById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('company_updates')
        .select('*')
        .eq('id', input.id)
        .single()

      if (error) {
        throw new Error(`Failed to fetch update: ${error.message}`)
      }

      return data as CompanyUpdate
    }),

  // Get updates by type
  getUpdatesByType: publicProcedure
    .input(z.object({
      company_id: z.string(),
      type: z.enum(['major', 'minor', 'coolsies']),
      limit: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ input }) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('company_updates')
        .select('*')
        .eq('company_id', input.company_id)
        .eq('type', input.type)
        .order('created_at', { ascending: false })
        .limit(input.limit)

      if (error) {
        throw new Error(`Failed to fetch updates by type: ${error.message}`)
      }

      return data as CompanyUpdate[]
    }),

  // Update fundraising status
  updateFundraisingStatus: publicProcedure
    .input(updateFundraisingStatusSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      const updateData: Record<string, unknown> = {
        status: input.status,
        updated_at: new Date().toISOString(),
      }

      if (input.target_amount !== undefined) updateData.target_amount = input.target_amount
      if (input.raised_amount !== undefined) updateData.raised_amount = input.raised_amount
      if (input.stage !== undefined) updateData.stage = input.stage
      if (input.deadline !== undefined) updateData.deadline = input.deadline
      if (input.notes !== undefined) updateData.notes = input.notes

      const { data, error } = await supabase
        .from('fundraising_status')
        .upsert({
          user_id: input.user_id,
          ...updateData,
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update fundraising status: ${error.message}`)
      }

      return data
    }),

  // Get fundraising status
  getFundraisingStatus: publicProcedure
    .input(z.object({ user_id: z.string() }))
    .query(async ({ input }) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('fundraising_status')
        .select('*')
        .eq('user_id', input.user_id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch fundraising status: ${error.message}`)
      }

      return data || null
    }),

  // Update existing company update
  updateCompanyUpdate: publicProcedure
    .input(updateCompanyUpdateSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('company_updates')
        .update({
          title: input.title,
          content: input.content,
          type: input.type,
          metrics: input.metrics || {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update company update: ${error.message}`)
      }

      return data as CompanyUpdate
    }),

  // Delete company update
  deleteCompanyUpdate: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      const { error } = await supabase
        .from('company_updates')
        .delete()
        .eq('id', input.id)

      if (error) {
        throw new Error(`Failed to delete company update: ${error.message}`)
      }

      return { success: true }
    }),

  // For the track/snowball page - get Snowball's updates, deck, profile, team, and fundraising status
  getSnowballData: publicProcedure
    .query(async () => {
      const supabase = await createClient()

      // Get Snowball's updates
      const { data: updates, error: updatesError } = await supabase
        .from('company_updates')
        .select('*')
        .eq('company_id', 'snowball-demo-user')
        .order('created_at', { ascending: false })

      if (updatesError) {
        throw new Error(`Failed to fetch Snowball updates: ${updatesError.message}`)
      }

      // Get Snowball's pitch deck
      const { data: pitchDeck, error: deckError } = await supabase
        .from('pitch_decks')
        .select('*')
        .eq('user_id', 'snowball-demo-user')
        .eq('is_active', true)
        .single()

      if (deckError && deckError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch Snowball pitch deck: ${deckError.message}`)
      }

      // Get Snowball's profile
      const { data: profile, error: profileError } = await supabase
        .from('founders')
        .select('*')
        .eq('user_id', 'snowball-demo-user')
        .eq('is_active', true)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch Snowball profile: ${profileError.message}`)
      }

      // Get Snowball's team
      const { data: team, error: teamError } = await supabase
        .from('company_teams')
        .select('*')
        .eq('user_id', 'snowball-demo-user')
        .order('created_at', { ascending: true })

      if (teamError) {
        throw new Error(`Failed to fetch Snowball team: ${teamError.message}`)
      }

      // Get Snowball's fundraising status
      const { data: fundraisingStatus, error: statusError } = await supabase
        .from('fundraising_status')
        .select('*')
        .eq('user_id', 'snowball-demo-user')
        .single()

      if (statusError && statusError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch Snowball fundraising status: ${statusError.message}`)
      }

      return {
        updates: updates as CompanyUpdate[],
        pitchDeck: pitchDeck as PitchDeck | null,
        profile: profile,
        team: team || [],
        fundraisingStatus: fundraisingStatus || null,
      }
    }),
})
