// Basic types for MVP database schema
export type UserRole = 'investor' | 'founder'

export type FundraisingStatus = 'preparing' | 'starting' | 'closing' | 'closed'

export type KnockStatus = 'pending' | 'accepted' | 'declined'

export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
  profile_complete: boolean
}

export interface InvestorProfile {
  user_id: string
  investment_criteria: Record<string, unknown>
  preferred_stages: string[]
  industries: string[]
  geographies: string[]
  check_size_min: number
  check_size_max: number
}

export interface CompanyProfile {
  user_id: string
  company_name: string
  description: string
  industry: string
  stage: string
  geography: string
  fundraising_status: FundraisingStatus
  pitch_deck_url?: string
  website?: string
  funding_target?: number
}

export interface Tribe {
  id: string
  name: string
  description: string
  type: string
}

export interface TribeMembership {
  user_id: string
  tribe_id: string
  joined_at: string
}

export interface Tracking {
  investor_id: string
  company_id: string
  tracked_at: string
}

export interface Knock {
  id: string
  investor_id: string
  company_id: string
  status: KnockStatus
  message: string
  created_at: string
}

export interface TractionUpdate {
  company_id: string
  month_year: string
  metrics: Record<string, unknown>
  notes: string
  created_at: string
}
