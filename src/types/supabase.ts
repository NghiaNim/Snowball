export interface Database {
  public: {
    Tables: {
      referral_links: {
        Row: {
          id: string
          link_token: string
          welcome_message: string
          background_color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray'
          target_role: 'investor' | 'founder'
          created_at: string
          expires_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          link_token: string
          welcome_message: string
          background_color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray'
          target_role: 'investor' | 'founder'
          created_at?: string
          expires_at: string
          is_active?: boolean
        }
        Update: {
          id?: string
          link_token?: string
          welcome_message?: string
          background_color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray'
          target_role?: 'investor' | 'founder'
          created_at?: string
          expires_at?: string
          is_active?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_referral_links: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
