// Basic types for MVP database schema
export type UserRole = 'investor' | 'founder' | 'admin'

export type FundraisingStatus = 'preparing' | 'starting' | 'closing' | 'closed'

export type KnockStatus = 'pending' | 'accepted' | 'declined'

export type TribeType = 'accelerator' | 'university' | 'company' | 'geographic' | 'industry' | 'angel_group' | 'family_office' | 'hnwi' | 'vc_platform'

export type UpdateType = 'major' | 'minor' | 'coolsies'

export type UploadStatus = 'uploading' | 'completed' | 'failed'

export type RelationshipType = 'tracking' | 'interested' | 'contacted' | 'meeting_scheduled' | 'passed' | 'invested'

export type RelationshipStatus = 'active' | 'inactive'

export type InitiatedBy = 'founder' | 'investor'

export interface PitchDeck {
  id: string
  user_id: string
  file_name: string
  file_url: string
  public_url?: string
  file_size?: number
  file_type?: string
  upload_status: UploadStatus
  gcs_bucket?: string
  gcs_object_path?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  user_id: string
  email: string
  investor_name: string
  firm_name: string
  title: string
  bio?: string
  linkedin_url?: string
  investment_focus?: string[]
  check_size_min?: number
  check_size_max?: number
  preferred_stages?: string[]
  geographic_focus?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  credits: number
  subscription_tier: string
  subscription_expires_at?: string
  max_credits: number
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

export interface Founder {
  id: string
  user_id: string
  company_name: string
  founder_name: string
  email: string
  bio?: string
  linkedin_url?: string
  website?: string
  industry?: string
  stage?: string
  location?: string
  funding_target?: string
  logo_emoji: string
  mission?: string
  twitter_url?: string
  email_contact?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Investor {
  id: string
  user_id: string
  investor_name: string
  email: string
  firm_name?: string
  title?: string
  bio?: string
  linkedin_url?: string
  investment_focus?: string[]
  check_size_min?: number
  check_size_max?: number
  preferred_stages?: string[]
  geographic_focus?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FounderInvestorRelationship {
  id: string
  founder_id: string
  investor_id: string
  relationship_type: RelationshipType
  status: RelationshipStatus
  notes?: string
  initiated_by?: InitiatedBy
  initiated_at: string
  last_interaction_at: string
  created_at: string
  updated_at: string
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

// Extended interfaces for relationships with joined data
export interface FounderWithRelationships extends Founder {
  relationships?: (FounderInvestorRelationship & { investor: Investor })[]
  pitch_deck?: PitchDeck
  updates?: CompanyUpdate[]
}

export interface InvestorWithRelationships extends Investor {
  relationships?: (FounderInvestorRelationship & { founder: Founder })[]
}

export interface RelationshipWithDetails extends FounderInvestorRelationship {
  founder?: Founder
  investor?: Investor
}
