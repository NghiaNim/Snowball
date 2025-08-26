import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { createClient } from '@/lib/supabase/server'

// Template customization schemas
const templateCustomizationSchema = z.object({
  header: z.object({
    title: z.string(),
    subtitle: z.string(),
  }),
  sections: z.object({
    filters: z.object({
      enabled: z.boolean(),
      searchPlaceholder: z.string(),
    }).optional(),
    companyCard: z.object({
      showLogo: z.boolean(),
      showMetrics: z.boolean(),
      showDescription: z.boolean(),
      actionButtons: z.array(z.string()),
    }).optional(),
  }).optional(),
  tabs: z.object({
    overview: z.object({
      enabled: z.boolean(),
      sections: z.array(z.string()),
    }).optional(),
    monthly_updates: z.object({
      enabled: z.boolean(),
      allowInteractions: z.boolean(),
    }).optional(),
    investors: z.object({
      enabled: z.boolean(),
      showInterestLevel: z.boolean(),
    }).optional(),
    profile: z.object({
      enabled: z.boolean(),
      editable: z.boolean(),
    }).optional(),
  }).optional(),
  styling: z.object({
    primaryColor: z.string(),
    cardStyle: z.string(),
  }),
})

// Simple template schema for Template Builder
const simpleTemplateSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  primaryColor: z.string(),
  // For investor templates
  companies: z.array(z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    industry: z.string(),
    stage: z.string(),
    location: z.string(),
    fundingTarget: z.string(),
    status: z.enum(['closing', 'starting', 'preparing']),
    tribe: z.string(),
    logo: z.string(),
    metrics: z.record(z.string(), z.string()),
  })).optional(),
  // For founder templates
  founderProfile: z.object({
    companyName: z.string(),
    description: z.string(),
    industry: z.string(),
    fundingStage: z.string(),
    amountRaising: z.string(),
    website: z.string(),
    teamMembers: z.array(z.object({
      name: z.string(),
      role: z.string(),
      background: z.string(),
    })),
    currentMetrics: z.object({
      users: z.string(),
      mrr: z.string(),
      growth: z.string(),
      retention: z.string(),
    }),
  }).optional(),
  monthlyUpdate: z.object({
    title: z.string(),
    headlineMetrics: z.record(z.string(), z.string()),
    keyWins: z.array(z.string()),
    challengesAsks: z.array(z.string()),
    fundraisingStatus: z.string(),
    statusColor: z.enum(['purple', 'yellow', 'red', 'green']),
  }).optional(),
})

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

  // Template Management
  getAllTemplates: publicProcedure
    .query(async () => {
      const supabase = await createClient()
      
      const { data: templates, error } = await supabase
        .from('page_templates')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(`Failed to fetch templates: ${error.message}`)
      }
      
      return templates
    }),

  getTemplate: publicProcedure
    .input(z.object({
      templateId: z.string(),
    }))
    .query(async ({ input }) => {
      const supabase = await createClient()
      
      const { data: template, error } = await supabase
        .from('page_templates')
        .select('*')
        .eq('id', input.templateId)
        .single()
      
      if (error) {
        throw new Error(`Failed to fetch template: ${error.message}`)
      }
      
      return template
    }),

  saveTemplate: publicProcedure
    .input(z.object({
      templateName: z.string().min(1),
      description: z.string().optional(),
      targetRole: z.enum(['investor', 'founder']),
      customizations: templateCustomizationSchema,
    }))
    .mutation(async ({ input }) => {
      const supabase = await createClient()
      
      const { data: template, error } = await supabase
        .from('page_templates')
        .insert({
          template_name: input.templateName,
          description: input.description,
          target_role: input.targetRole,
          customizations: input.customizations,
        })
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to save template: ${error.message}`)
      }
      
      return template
    }),

  // Save template using simplified schema (for Template Builder)
  saveSimpleTemplate: publicProcedure
    .input(z.object({
      templateName: z.string().min(1),
      description: z.string().optional(),
      targetRole: z.enum(['investor', 'founder']),
      customizations: simpleTemplateSchema,
    }))
    .mutation(async ({ input }) => {
      const supabase = await createClient()
      
      const { data: template, error } = await supabase
        .from('page_templates')
        .insert({
          template_name: input.templateName,
          description: input.description,
          target_role: input.targetRole,
          customizations: input.customizations,
        })
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to save template: ${error.message}`)
      }
      
      return template
    }),

  // Delete template
  deleteTemplate: publicProcedure
    .input(z.object({
      templateId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from('page_templates')
        .delete()
        .eq('id', input.templateId)
      
      if (error) {
        throw new Error(`Failed to delete template: ${error.message}`)
      }
      
      return { success: true }
    }),

  updateTemplate: publicProcedure
    .input(z.object({
      templateId: z.string(),
      templateName: z.string().min(1),
      description: z.string().optional(),
      customizations: templateCustomizationSchema,
    }))
    .mutation(async ({ input }) => {
      const supabase = await createClient()
      
      const { data: template, error } = await supabase
        .from('page_templates')
        .update({
          template_name: input.templateName,
          description: input.description,
          customizations: input.customizations,
        })
        .eq('id', input.templateId)
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to update template: ${error.message}`)
      }
      
      return template
    }),

  // Enhanced link generation with templates
  generateReferralLinksWithTemplates: publicProcedure
    .input(z.object({
      welcomeMessage: z.string().min(1),
      backgroundColor: z.enum(['blue', 'green', 'purple', 'orange', 'red', 'gray']),
      investorTemplateId: z.string().optional(),
      founderTemplateId: z.string().optional(),
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
          investor_template_id: input.investorTemplateId || null,
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
          founder_template_id: input.founderTemplateId || null,
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

  // Monthly updates management (for demo purposes)
  createMonthlyUpdate: publicProcedure
    .input(z.object({
      founderId: z.string(),
      title: z.string().min(1),
      headlineMetrics: z.record(z.string(), z.string()).optional(),
      keyWins: z.array(z.string()),
      challengesAsks: z.array(z.string()),
      fundraisingStatus: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const supabase = await createClient()
      
      const { data: update, error } = await supabase
        .from('monthly_updates')
        .insert({
          founder_id: input.founderId,
          title: input.title,
          headline_metrics: input.headlineMetrics,
          key_wins: input.keyWins,
          challenges_asks: input.challengesAsks,
          fundraising_status: input.fundraisingStatus,
        })
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to create monthly update: ${error.message}`)
      }
      
      return update
    }),

  getMonthlyUpdates: publicProcedure
    .input(z.object({
      founderId: z.string(),
    }))
    .query(async ({ input }) => {
      const supabase = await createClient()
      
      const { data: updates, error } = await supabase
        .from('monthly_updates')
        .select(`
          *,
          interactions:monthly_update_interactions(*)
        `)
        .eq('founder_id', input.founderId)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(`Failed to fetch monthly updates: ${error.message}`)
      }
      
      return updates
    }),

  addUpdateInteraction: publicProcedure
    .input(z.object({
      updateId: z.string(),
      investorId: z.string(),
      interactionType: z.enum(['like', 'comment', 'dm']),
      content: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const supabase = await createClient()
      
      const { data: interaction, error } = await supabase
        .from('monthly_update_interactions')
        .insert({
          update_id: input.updateId,
          investor_id: input.investorId,
          interaction_type: input.interactionType,
          content: input.content,
        })
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to add interaction: ${error.message}`)
      }
      
      return interaction
    }),
})
