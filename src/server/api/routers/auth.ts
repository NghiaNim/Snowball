import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'
import { createClient } from '@/lib/supabase/server'
import type { Investor, Founder } from '@/types/database'

// Input validation schemas
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  investor_name: z.string().min(1),
  firm_name: z.string().optional(),
  title: z.string().optional(),
})

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authRouter = createTRPCRouter({
  // Sign up investor
  signUpInvestor: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
        })

        if (authError) {
          throw new Error(`Authentication failed: ${authError.message}`)
        }

        if (!authData.user) {
          throw new Error('Failed to create user account')
        }

        // Create investor profile
        const { data: investor, error: profileError } = await supabase
          .from('investors')
          .insert({
            user_id: authData.user.id,
            investor_name: input.investor_name,
            email: input.email,
            firm_name: input.firm_name,
            title: input.title,
            is_active: true,
          })
          .select()
          .single()

        if (profileError) {
          // If profile creation fails, clean up the auth user
          await supabase.auth.admin.deleteUser(authData.user.id)
          throw new Error(`Failed to create investor profile: ${profileError.message}`)
        }

        return {
          success: true,
          message: 'Account created successfully! Please check your email to verify your account.',
          investor: investor as Investor,
        }
      } catch (error) {
        console.error('Sign up error:', error)
        throw new Error(`Sign up failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }),

  // Sign in user
  signIn: publicProcedure
    .input(signInSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        })

        if (authError) {
          throw new Error(`Sign in failed: ${authError.message}`)
        }

        if (!data.user) {
          throw new Error('No user returned from sign in')
        }

        return {
          success: true,
          message: 'Signed in successfully',
          user: data.user,
        }
      } catch (error) {
        console.error('Sign in error:', error)
        throw new Error(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }),

  // Get current user profile (investor or founder)
  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      const supabase = await createClient()

      try {
        // Check if user is an investor
        const { data: investor } = await supabase
          .from('investors')
          .select('*')
          .eq('user_id', ctx.user.id)
          .single()

        if (investor) {
          return {
            type: 'investor' as const,
            profile: investor as Investor,
            user: ctx.user,
          }
        }

        // Check if user is a founder
        const { data: founder } = await supabase
          .from('founders')
          .select('*')
          .eq('user_id', ctx.user.id)
          .single()

        if (founder) {
          return {
            type: 'founder' as const,
            profile: founder as Founder,
            user: ctx.user,
          }
        }

        return {
          type: 'unknown' as const,
          profile: null,
          user: ctx.user,
        }
      } catch (error) {
        console.error('Get current user error:', error)
        throw new Error('Failed to get user profile')
      }
    }),

  // Sign out
  signOut: protectedProcedure
    .mutation(async () => {
      const supabase = await createClient()

      try {
        const { error } = await supabase.auth.signOut()

        if (error) {
          throw new Error(`Sign out failed: ${error.message}`)
        }

        return {
          success: true,
          message: 'Signed out successfully',
        }
      } catch (error) {
        console.error('Sign out error:', error)
        throw new Error(`Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }),

  // Check if user is authenticated
  isAuthenticated: publicProcedure
    .query(async () => {
      const supabase = await createClient()

      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        return {
          isAuthenticated: !!user,
          user: user || null,
        }
      } catch (error) {
        console.error('Auth check error:', error)
        return {
          isAuthenticated: false,
          user: null,
        }
      }
    }),

  // Send password reset email
  resetPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const supabase = await createClient()

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
        })

        if (error) {
          throw new Error(`Password reset failed: ${error.message}`)
        }

        return {
          success: true,
          message: 'Password reset email sent. Please check your email.',
        }
      } catch (error) {
        console.error('Password reset error:', error)
        throw new Error(`Password reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }),
})
