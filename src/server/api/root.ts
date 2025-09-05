import { createTRPCRouter } from '@/server/api/trpc'
import { adminRouter } from '@/server/api/routers/admin'
import { investorRouter } from '@/server/api/routers/investor'
import { companyRouter } from '@/server/api/routers/company'
import { founderRouter } from '@/server/api/routers/founder'
import { trackingRouter } from '@/server/api/routers/tracking'
import { authRouter } from '@/server/api/routers/auth'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  admin: adminRouter,
  investor: investorRouter,
  company: companyRouter,
  founder: founderRouter,
  tracking: trackingRouter,
  auth: authRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
