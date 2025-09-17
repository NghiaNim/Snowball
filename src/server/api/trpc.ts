import { initTRPC, TRPCError } from '@trpc/server'
import { ZodError } from 'zod'
import superjson from 'superjson'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types/database'
import { headers } from 'next/headers'

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 */
export const createTRPCContext = async () => {
  const supabase = await createClient()
  const headersList = await headers()
  
  // Get the current user from Supabase Auth
  const { data: { user: authUser }, error } = await supabase.auth.getUser()
  
  let user: User | null = null
  
  if (authUser && !error) {
    // Try to get investor profile first
    const { data: investorProfile } = await supabase
      .from('investors')
      .select('*')
      .eq('user_id', authUser.id)
      .single()
    
    if (investorProfile) {
      user = investorProfile
    } else {
      // Try to get founder profile
      const { data: founderProfile } = await supabase
        .from('founders')
        .select('*')
        .eq('user_id', authUser.id)
        .single()
      
      if (founderProfile) {
        user = founderProfile as User // Type assertion for compatibility
      }
    }
  }

  return {
    supabase,
    user,
    headers: headersList,
  }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer.
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

/**
 * 3. ROUTER & PROCEDURE HELPERS
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 */
export const createTRPCRouter = t.router

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = t.procedure

/**
 * Protected (authenticated) procedure
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      // infers the `user` as non-nullable
      user: ctx.user,
    },
  })
})

/**
 * Flexible auth procedure that handles both Supabase and founder demo auth
 */
export const flexibleAuthProcedure = t.procedure.use(async ({ ctx, next, rawInput }) => {
  // If we have a Supabase authenticated user, use that
  if (ctx.user) {
    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    })
  }

  // Check for founder demo auth via special header or input
  const input = rawInput as { demoUserId?: string }
  if (input?.demoUserId === 'snowball-demo-user') {
    // Create a mock user object for the demo founder
    const mockUser = {
      id: 'snowball-demo-user',
      user_id: 'snowball-demo-user',
      email: 'snowball@demo.com',
      investor_name: 'Snowball Demo',
      firm_name: 'Snowball',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return next({
      ctx: {
        ...ctx,
        user: mockUser as User,
      },
    })
  }

  throw new TRPCError({ code: 'UNAUTHORIZED' })
})
