// Basic types for MVP database schema
export type UserRole = 'investor' | 'founder' | 'admin'

export type FundraisingStatus = 'preparing' | 'starting' | 'closing' | 'closed'

export type KnockStatus = 'pending' | 'accepted' | 'declined'

export type TribeType = 'accelerator' | 'university' | 'company' | 'geographic' | 'industry' | 'angel_group' | 'family_office' | 'hnwi' | 'vc_platform'

export type UpdateType = 'major' | 'minor' | 'coolsies'

export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
  profile_complete: boolean
}

export interface InvestorProfile {
  user_id: string
  investment_criteria: Record<string, unknown>
  preferred_stages: string[]
  industries: string[]
  geographies: string[]
  check_size_min?: number
  check_size_max?: number
  bio?: string
  linkedin_url?: string
  created_at: string
  updated_at: string
}

export interface CompanyProfile {
  user_id: string
  company_name: string
  description?: string
  industry?: string
  stage?: string
  geography?: string
  fundraising_status?: FundraisingStatus
  pitch_deck_url?: string
  website?: string
  funding_target?: string
  logo_emoji: string
  created_at: string
  updated_at: string
}

export interface Tribe {
  id: string
  name: string
  description?: string
  type: TribeType
  is_active: boolean
  created_at: string
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
  message?: string
  created_at: string
  updated_at: string
}

export interface CompanyUpdate {
  id: string
  company_id: string
  title: string
  content: string
  type: UpdateType
  metrics: Record<string, unknown>
  email_sent_at?: string
  created_at: string
}

export interface TractionUpdate {
  company_id: string
  month_year: string
  metrics: Record<string, unknown>
  notes: string
  created_at: string
}

// Extended types for UI components
export interface CompanyWithProfile extends User {
  company_profile: CompanyProfile
  tribe_memberships?: (TribeMembership & { tribe: Tribe })[]
}

export interface InvestorWithProfile extends User {
  investor_profile: InvestorProfile
  tribe_memberships?: (TribeMembership & { tribe: Tribe })[]
}
