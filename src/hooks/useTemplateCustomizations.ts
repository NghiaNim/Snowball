import { useState, useEffect } from 'react'

interface CompanyData {
  id: number
  name: string
  description: string
  industry: string
  stage: string
  location: string
  fundingTarget: string
  status: 'closing' | 'starting' | 'preparing'
  tribe: string
  logo: string
  metrics: Record<string, string>
}

interface TemplateCustomizations {
  header?: {
    title: string
    subtitle: string
  }
  content?: {
    // Investor specific content
    searchPlaceholder?: string
    companyCardTexts?: {
      trackButtonText: string
      knockButtonText: string
      industryLabel: string
      stageLabel: string
      targetLabel: string
      locationLabel: string
      metricsTitle: string
    }
    // Founder specific content
    tabLabels?: {
      overview: string
      monthlyUpdates: string
      investors: string
      profile: string
    }
    overviewTexts?: {
      fundraisingStatusTitle: string
      profileCompletionTitle: string
      recentActivityTitle: string
    }
    monthlyUpdateTexts?: {
      addUpdateButton: string
      headlineMetricsTitle: string
      keyWinsTitle: string
      challengesAsksTitle: string
      fundraisingStatusTitle: string
      likeButton: string
      commentButton: string
      dmButton: string
    }
    investorsTexts?: {
      interestTitle: string
      trackingText: string
      acceptMeetingText: string
      declineMeetingText: string
    }
  }
  styling?: {
    primaryColor: string
    cardStyle: string
  }
  companies?: CompanyData[]
}

interface DefaultCustomizations {
  investor: TemplateCustomizations
  founder: TemplateCustomizations
}

const defaultCustomizations: DefaultCustomizations = {
  investor: {
    header: {
      title: 'Investor Dashboard',
      subtitle: 'Deal Flow'
    },
    content: {
      searchPlaceholder: 'Search by name or description...',
      companyCardTexts: {
        trackButtonText: 'Track',
        knockButtonText: '🚪 Knock',
        industryLabel: 'Industry:',
        stageLabel: 'Stage:',
        targetLabel: 'Target:',
        locationLabel: 'Location:',
        metricsTitle: 'Key Metrics'
      }
    },
    styling: {
      primaryColor: '#3B82F6',
      cardStyle: 'shadow'
    }
  },
  founder: {
    header: {
      title: 'Founder Dashboard',
      subtitle: 'Fundraising'
    },
    content: {
      tabLabels: {
        overview: 'Overview',
        monthlyUpdates: 'Monthly Updates',
        investors: 'Investors',
        profile: 'Profile'
      },
      overviewTexts: {
        fundraisingStatusTitle: 'Fundraising Status',
        profileCompletionTitle: 'Profile Completion',
        recentActivityTitle: 'Recent Activity'
      },
      monthlyUpdateTexts: {
        addUpdateButton: '+ Add Update',
        headlineMetricsTitle: 'Headline Metrics',
        keyWinsTitle: 'Key Wins',
        challengesAsksTitle: 'Challenges & Asks',
        fundraisingStatusTitle: 'Fundraising Status',
        likeButton: '👍 Like',
        commentButton: '💬 Comment',
        dmButton: '✉️ DM'
      },
      investorsTexts: {
        interestTitle: 'Investor Interest',
        trackingText: 'investors tracking your company',
        acceptMeetingText: 'Accept Meeting',
        declineMeetingText: 'Decline'
      }
    },
    styling: {
      primaryColor: '#10B981',
      cardStyle: 'shadow'
    }
  }
}

export function useTemplateCustomizations(role: 'investor' | 'founder'): TemplateCustomizations {
  const [customizations, setCustomizations] = useState<TemplateCustomizations>(defaultCustomizations[role])

  useEffect(() => {
    const fetchCustomizations = async () => {
      try {
        // Get referral token from URL parameters only
        const urlParams = new URLSearchParams(window.location.search)
        const refToken = urlParams.get('ref')
        
        if (!refToken) {
          // No referral token, use defaults
          return
        }

        // Fetch referral link data to get template ID
        const response = await fetch(`/api/referral/${refToken}`)
        if (!response.ok) {
          console.warn('Failed to fetch referral data')
          return
        }

        const referralData = await response.json()
        const templateId = role === 'investor' 
          ? referralData.investorTemplateId 
          : referralData.founderTemplateId

        if (!templateId) {
          // No template specified, use defaults
          return
        }

        // Fetch template customizations
        const templateResponse = await fetch(`/api/templates/${templateId}`)
        if (!templateResponse.ok) {
          console.warn('Failed to fetch template customizations')
          return
        }

        const templateData = await templateResponse.json()
        const customizations = templateData.customizations
        
        // Check if this is a new simplified template structure
        if (customizations.title && customizations.companies) {
          // New simplified template - convert to expected format
          const convertedCustomizations = {
            header: {
              title: customizations.title,
              subtitle: customizations.subtitle
            },
            content: defaultCustomizations[role].content,
            styling: {
              primaryColor: customizations.primaryColor,
              cardStyle: 'shadow'
            },
            companies: customizations.companies
          }
          setCustomizations(convertedCustomizations)
        } else {
          // Old complex template structure - merge with defaults
          const mergedCustomizations = {
            ...defaultCustomizations[role],
            ...customizations,
            header: {
              ...defaultCustomizations[role].header,
              ...customizations?.header
            },
            content: {
              ...defaultCustomizations[role].content,
              ...customizations?.content
            },
            styling: {
              ...defaultCustomizations[role].styling,
              ...customizations?.styling
            }
          }
          setCustomizations(mergedCustomizations)
        }
      } catch (error) {
        console.error('Error fetching template customizations:', error)
        // Fall back to defaults on error
      }
    }

    fetchCustomizations()
  }, [role])

  return customizations
}

export type { TemplateCustomizations, CompanyData }
