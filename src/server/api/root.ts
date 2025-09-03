import { createTRPCRouter } from '@/server/api/trpc'
import { adminRouter } from '@/server/api/routers/admin'
import { investorRouter } from '@/server/api/routers/investor'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  admin: adminRouter,
  investor: investorRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
