'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProfileEditForm } from '@/components/dashboard/ProfileEditForm'
import { TeamEditForm } from '@/components/dashboard/TeamEditForm'
import { FundraisingStatusForm } from '@/components/dashboard/FundraisingStatusForm'
import Image from 'next/image'
import { api } from '@/lib/trpc/client'

// Types for updates
type UpdateType = 'major' | 'minor' | 'coolsies'

// Types for forms
interface ProfileData {
  company_name: string
  industry: string
  stage: string
  location: string
  description: string
  funding_target: string
  website: string
  mission: string
  linkedin_url: string
  twitter_url: string
  email_contact: string
}

interface TeamMember {
  name: string
  role: string
  bio: string
  profile_picture_url?: string
  linkedin_url?: string
  email?: string
}

interface FundraisingStatusData {
  status: 'not_fundraising' | 'preparing_to_raise' | 'actively_fundraising'
  target_amount?: number
  raised_amount?: number
  stage?: string
  deadline?: string
  notes?: string
}

interface CompanyUpdateForEdit {
  id: string
  title?: string
  content: string
  type: UpdateType
  metrics?: Record<string, unknown>
}

interface CreateUpdateData {
  title?: string
  content: string
  metrics?: Record<string, unknown>
}

const fundraisingStatusConfig = {
  not_fundraising: {
    label: 'Not Fundraising',
    icon: '⚪',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  preparing_to_raise: {
    label: 'Preparing to Raise',
    icon: '🟡',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  actively_fundraising: {
    label: 'Active Fundraising',
    icon: '🟢',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
}

// This will be fetched from the database via tRPC
// const trackingInvestors = [] // Moved to tRPC

const updateTypeConfig = {
  major: { 
    color: 'red', 
    label: 'Major Update', 
    icon: '📧',
    description: 'Investor letter with metrics (sends email)'
  },
  minor: { 
    color: 'blue', 
    label: 'Minor Update', 
    icon: '📝',
    description: 'Functional/progress update (no email)'
  },
  coolsies: { 
    color: 'green', 
    label: 'Coolsies', 
    icon: '💭',
    description: 'Quick thoughts/meeting updates'
  }
}

export default function SnowballDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateUpdate, setShowCreateUpdate] = useState(false)
  const [createUpdateType, setCreateUpdateType] = useState<UpdateType>('major')
  const [deckFile, setDeckFile] = useState<File | null>(null)
  const [uploadingDeck, setUploadingDeck] = useState(false)
  
  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isEditingTeam, setIsEditingTeam] = useState(false)
  const [isEditingFundraisingStatus, setIsEditingFundraisingStatus] = useState(false)
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null)
  const [editingUpdateData, setEditingUpdateData] = useState<{
    title: string
    content: string
    type: UpdateType
    metrics?: Record<string, unknown>
  } | null>(null)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [pendingProfileUpdate, setPendingProfileUpdate] = useState<ProfileData | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false)
  const [isUpdatingFundraisingStatus, setIsUpdatingFundraisingStatus] = useState(false)
  const [profileForm, setProfileForm] = useState({
    company_name: 'Snowball',
    industry: 'B2B SaaS - Marketplace',
    stage: 'Seed',
    location: 'San Francisco, CA',
    description: 'Two-sided marketplace connecting early-stage startups with investors through tribe-based networking. Leveraging communities built around accelerators, universities, and companies for high-quality deal flow.',
    funding_target: '$2,000,000',
    website: 'https://joinsnowball.io',
    mission: 'We\'re building the future of startup-investor connections through tribe-based networking. Our team combines deep product experience from Stripe with technical expertise from Google to create meaningful relationships in the startup ecosystem.',
    linkedin_url: 'https://linkedin.com/company/snowball',
    twitter_url: 'https://twitter.com/joinsnowball',
    email_contact: 'team@joinsnowball.io'
  })
  const [teamForm, setTeamForm] = useState<TeamMember[]>([
    { 
      name: 'Alex Johnson', 
      role: 'Co-founder & CEO', 
      bio: 'Former VP Product at Stripe. Stanford MBA.',
      linkedin_url: 'https://linkedin.com/in/alexjohnson',
      email: 'alex@joinsnowball.io'
    },
    { 
      name: 'Sarah Kim', 
      role: 'Co-founder & CTO', 
      bio: 'Ex-Google Staff Engineer. MIT Computer Science.',
      linkedin_url: 'https://linkedin.com/in/sarahkim',
      email: 'sarah@joinsnowball.io'
    }
  ])
  const [, setFundraisingStatusForm] = useState<FundraisingStatusData>({
    status: 'actively_fundraising',
    target_amount: 2000000,
    stage: 'Seed',
    deadline: '',
    notes: 'Currently raising our seed round to scale our marketplace platform'
  })

  // tRPC hooks
  const { data: updates = [], refetch: refetchUpdates } = api.company.getUpdates.useQuery(
    { user_id: 'snowball-demo-user' }
  )
  const { data: pitchDeck, refetch: refetchPitchDeck } = api.company.getActivePitchDeck.useQuery(
    { user_id: 'snowball-demo-user' }
  )
  const { data: trackingInvestors = [] } = api.tracking.getFounderTrackers.useQuery(
    { founder_user_id: 'snowball-demo-user' }
  )
  const { data: currentProfile, refetch: refetchProfile } = api.founder.getByUserId.useQuery(
    { user_id: 'snowball-demo-user' }
  )
  const { data: currentTeam = [], refetch: refetchTeam } = api.company.getTeam.useQuery(
    { user_id: 'snowball-demo-user' }
  )
  const createUpdateMutation = api.company.createUpdate.useMutation()
  const uploadPitchDeckMutation = api.company.uploadPitchDeck.useMutation()
  const updateProfileMutation = api.company.updateProfile.useMutation()
  const updateTeamMutation = api.company.updateTeam.useMutation()
  const updateFundraisingStatusMutation = api.company.updateFundraisingStatus.useMutation()
  const updateCompanyUpdateMutation = api.company.updateCompanyUpdate.useMutation()
  const deleteCompanyUpdateMutation = api.company.deleteCompanyUpdate.useMutation()
  const { data: fundraisingStatus, refetch: refetchFundraisingStatus } = api.company.getFundraisingStatus.useQuery(
    { user_id: 'snowball-demo-user' }
  )
  
  // Loading states
  const isCreatingUpdate = createUpdateMutation.isPending
  const [isLoadingDeck, setIsLoadingDeck] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const auth = localStorage.getItem('snowball-auth')
    const loginTime = localStorage.getItem('snowball-login-time')
    
    if (!auth || !loginTime) {
      router.push('/auth/founder/signin')
      return
    }

    // Check if login is expired (24 hours)
    const now = Date.now()
    const loginTimestamp = parseInt(loginTime)
    const twentyFourHours = 24 * 60 * 60 * 1000
    
    if (now - loginTimestamp > twentyFourHours) {
      localStorage.removeItem('snowball-auth')
      localStorage.removeItem('snowball-login-time')
      router.push('/auth/founder/signin')
      return
    }

    setIsAuthenticated(true)

    // Set up deck file display if pitch deck exists
    if (pitchDeck) {
      const fakeFile = new File([''], pitchDeck.file_name, { 
        type: pitchDeck.file_type || 'application/pdf' 
      })
      setDeckFile(fakeFile)
    }
  }, [router, pitchDeck])

  // Update form data when profile data is loaded
  useEffect(() => {
    if (currentProfile) {
      setProfileForm({
        company_name: currentProfile.company_name || 'Snowball',
        industry: currentProfile.industry || 'B2B SaaS - Marketplace',
        stage: currentProfile.stage || 'Seed',
        location: currentProfile.location || 'San Francisco, CA',
        description: currentProfile.bio || 'Two-sided marketplace connecting early-stage startups with investors through tribe-based networking. Leveraging communities built around accelerators, universities, and companies for high-quality deal flow.',
        funding_target: currentProfile.funding_target || '$2,000,000',
        website: currentProfile.website || 'https://joinsnowball.io',
        mission: currentProfile.mission || 'We\'re building the future of startup-investor connections through tribe-based networking. Our team combines deep product experience from Stripe with technical expertise from Google to create meaningful relationships in the startup ecosystem.',
        linkedin_url: currentProfile.linkedin_url || 'https://linkedin.com/company/snowball',
        twitter_url: currentProfile.twitter_url || 'https://twitter.com/joinsnowball',
        email_contact: currentProfile.email_contact || 'team@joinsnowball.io'
      })
    }
  }, [currentProfile])

  // Update team data when team data is loaded
  useEffect(() => {
    if (currentTeam && currentTeam.length > 0) {
      setTeamForm(currentTeam.map(member => ({
        name: member.name,
        role: member.role,
        bio: member.bio || '',
        profile_picture_url: member.profile_picture_url,
        linkedin_url: member.linkedin_url,
        email: member.email
      })))
    }
  }, [currentTeam])

  const handleLogout = () => {
    localStorage.removeItem('snowball-auth')
    localStorage.removeItem('snowball-login-time')
    router.push('/')
  }

  const handleCreateUpdate = async (updateData: CreateUpdateData) => {
    try {
      await createUpdateMutation.mutateAsync({
        company_id: 'snowball-demo-user',
        title: updateData.title || '',
        content: updateData.content || '',
        type: createUpdateType,
        metrics: updateData.metrics,
      })

      // Refetch updates to get the latest data
      await refetchUpdates()
      setShowCreateUpdate(false)

      // Send email for major updates
      if (createUpdateType === 'major') {
        try {
          const emailData = {
            to: trackingInvestors.map(rel => rel.investor?.email || '').filter(Boolean),
            subject: updateData.title || 'Snowball Company Update',
            content: updateData.content || '',
            metrics: updateData.metrics
          }

          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData),
          })

          const result = await response.json()

          if (result.success) {
            alert(`Major update created and emailed to ${result.emailsSent} investors!`)
          } else {
            alert('Update created but email sending failed. Please try again.')
          }
        } catch (error) {
          console.error('Error sending email:', error)
          alert('Update created but email sending failed. Please try again.')
        }
      } else {
        alert(`${updateTypeConfig[createUpdateType].label} created successfully!`)
      }
    } catch (error) {
      console.error('Error creating update:', error)
      alert('Failed to create update. Please try again.')
    }
  }

  const handleDeckUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingDeck(true)

    try {
      // First upload file to storage
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-deck', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        // Then save to database via tRPC
        await uploadPitchDeckMutation.mutateAsync({
          user_id: 'snowball-demo-user',
          file_name: file.name,
          file_url: result.url,
          public_url: result.publicUrl,
          file_size: file.size,
          file_type: file.type,
          gcs_bucket: result.gcs_bucket,
          gcs_object_path: result.gcs_object_path,
        })

        setDeckFile(file)
        await refetchPitchDeck()
        
        alert('Deck uploaded successfully!')
      } else {
        alert(`Upload failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploadingDeck(false)
    }
  }

  const handleProfileSubmit = (updatedProfile: ProfileData) => {
    setPendingProfileUpdate(updatedProfile)
    setShowUpdateDialog(true)
  }

  const confirmProfileUpdate = async () => {
    if (!pendingProfileUpdate) return

    setIsUpdatingProfile(true)
    try {
      // Get the current profile data to compare changes
      const originalProfile = profileForm
      const updatedProfile = pendingProfileUpdate
      
      // Generate human-readable change description
      const changes = []
      if (originalProfile.company_name !== updatedProfile.company_name) {
        changes.push(`company name to "${updatedProfile.company_name}"`)
      }
      if (originalProfile.industry !== updatedProfile.industry) {
        changes.push(`industry to "${updatedProfile.industry}"`)
      }
      if (originalProfile.stage !== updatedProfile.stage) {
        changes.push(`funding stage to "${updatedProfile.stage}"`)
      }
      if (originalProfile.location !== updatedProfile.location) {
        changes.push(`location to "${updatedProfile.location}"`)
      }
      if (originalProfile.description !== updatedProfile.description) {
        changes.push(`company description`)
      }
      if (originalProfile.funding_target !== updatedProfile.funding_target) {
        changes.push(`funding target to ${updatedProfile.funding_target}`)
      }
      if (originalProfile.website !== updatedProfile.website) {
        changes.push(`website to ${updatedProfile.website}`)
      }

      // Update the actual profile in database
      await updateProfileMutation.mutateAsync({
        user_id: 'snowball-demo-user',
        company_name: updatedProfile.company_name,
        industry: updatedProfile.industry,
        stage: updatedProfile.stage,
        location: updatedProfile.location,
        bio: updatedProfile.description, // Map description to bio field
        funding_target: updatedProfile.funding_target,
        website: updatedProfile.website,
        mission: updatedProfile.mission,
        linkedin_url: updatedProfile.linkedin_url,
        twitter_url: updatedProfile.twitter_url,
        email_contact: updatedProfile.email_contact,
      })

      // Update the local form data
      setProfileForm(updatedProfile)
      
      // Create a human-readable major update
      const changeText = changes.length > 0 
        ? `We've updated our ${changes.join(', ')}.` 
        : 'We have updated our company profile with the latest information.'
      
      await createUpdateMutation.mutateAsync({
        company_id: 'snowball-demo-user',
        title: 'Company Profile Updated',
        content: `${changeText} Stay tuned for more exciting updates as we continue to grow!`,
        type: 'major',
        metrics: undefined,
      })

      // Refetch data to show updates
      await Promise.all([refetchUpdates(), refetchProfile()])
      
      setIsEditingProfile(false)
      setShowUpdateDialog(false)
      setPendingProfileUpdate(null)
      
      alert('Profile updated and investors have been notified!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleTeamSubmit = async (updatedTeam: TeamMember[]) => {
    setIsUpdatingTeam(true)
    try {
      // Update team in database
      await updateTeamMutation.mutateAsync({
        user_id: 'snowball-demo-user',
        team_members: updatedTeam,
      })

      // Update local state
      setTeamForm(updatedTeam)
      
      // Refetch team data
      await refetchTeam()
      setIsEditingTeam(false)
      
      alert('Team information updated successfully!')
    } catch (error) {
      console.error('Error updating team:', error)
      alert('Failed to update team information. Please try again.')
    } finally {
      setIsUpdatingTeam(false)
    }
  }

  const handleFundraisingStatusSubmit = async (updatedStatus: FundraisingStatusData) => {
    setIsUpdatingFundraisingStatus(true)
    try {
      // Clean up the data before sending - remove undefined/null values for optional fields
      const cleanedStatus = {
        user_id: 'snowball-demo-user',
        status: updatedStatus.status,
        ...(updatedStatus.target_amount !== undefined && { target_amount: updatedStatus.target_amount }),
        ...(updatedStatus.raised_amount !== undefined && { raised_amount: updatedStatus.raised_amount }),
        ...(updatedStatus.stage !== undefined && updatedStatus.stage !== '' && { stage: updatedStatus.stage }),
        ...(updatedStatus.deadline !== undefined && updatedStatus.deadline !== '' && { deadline: updatedStatus.deadline }),
        ...(updatedStatus.notes !== undefined && updatedStatus.notes !== '' && { notes: updatedStatus.notes })
      }

      // Update fundraising status in database
      await updateFundraisingStatusMutation.mutateAsync(cleanedStatus)

      // Refetch the fundraising status to update the UI
      await refetchFundraisingStatus()

      setIsEditingFundraisingStatus(false)
      alert('Fundraising status updated successfully!')
    } catch (error) {
      console.error('Error updating fundraising status:', error)
      alert('Failed to update fundraising status. Please try again.')
    } finally {
      setIsUpdatingFundraisingStatus(false)
    }
  }

  const handleEditUpdate = (update: CompanyUpdateForEdit) => {
    setEditingUpdateId(update.id)
    setEditingUpdateData({
      title: update.title || '',
      content: update.content,
      type: update.type,
      metrics: update.metrics
    })
  }

  const handleSaveUpdateEdit = async () => {
    if (!editingUpdateId || !editingUpdateData) return

    try {
      await updateCompanyUpdateMutation.mutateAsync({
        id: editingUpdateId,
        title: editingUpdateData.title,
        content: editingUpdateData.content,
        type: editingUpdateData.type,
        metrics: editingUpdateData.metrics
      })

      await refetchUpdates()
      setEditingUpdateId(null)
      setEditingUpdateData(null)
      alert('Update edited successfully!')
    } catch (error) {
      console.error('Error updating update:', error)
      alert('Failed to edit update. Please try again.')
    }
  }

  const handleDeleteUpdate = async (updateId: string) => {
    if (!confirm('Are you sure you want to delete this update? This action cannot be undone.')) {
      return
    }

    try {
      await deleteCompanyUpdateMutation.mutateAsync({ id: updateId })
      await refetchUpdates()
      alert('Update deleted successfully!')
    } catch (error) {
      console.error('Error deleting update:', error)
      alert('Failed to delete update. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    setEditingUpdateId(null)
    setEditingUpdateData(null)
  }

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Checking authentication...</p>
      </div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Responsive header - mobile and desktop versions */}
          <div className="py-3 md:py-6">
            {/* Mobile: Compact layout */}
            <div className="flex flex-col space-y-3 md:hidden">
              {/* Top row: Logo and logout */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Image
                    src="/snowball.png"
                    alt="Snowball Logo"
                    width={24}
                    height={24}
                    className="mr-2 flex-shrink-0"
                  />
                  <h1 className="text-lg font-bold text-gray-900">
                    Snowball
                  </h1>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs px-3 py-1">
                  Logout
                </Button>
              </div>
              
              {/* Bottom row: Status and team info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {fundraisingStatus ? (
                    <Badge 
                      variant="outline" 
                      className={`${fundraisingStatusConfig[fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.color} ${fundraisingStatusConfig[fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.borderColor} text-xs px-2 py-1`}
                    >
                      {fundraisingStatusConfig[fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.icon} {fundraisingStatusConfig[fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.label}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs px-2 py-1">
                      🟢 Active Fundraising
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  👤 Snowball Team
                </div>
              </div>
            </div>
            
            {/* Desktop: Horizontal layout */}
            <div className="hidden md:flex justify-between items-center">
              <div className="flex items-center">
                <Image
                  src="/snowball.png"
                  alt="Snowball Logo"
                  width={32}
                  height={32}
                  className="mr-3"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Snowball Founder Dashboard</h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {fundraisingStatus ? (
                  <Badge 
                    variant="outline" 
                    className={`${fundraisingStatusConfig[fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.color} ${fundraisingStatusConfig[fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.borderColor}`}
                  >
                    {fundraisingStatusConfig[fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.icon} {fundraisingStatusConfig[fundraisingStatus.status as keyof typeof fundraisingStatusConfig]?.label}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    🟢 Active Fundraising
                  </Badge>
                )}
                <div className="text-sm text-gray-600">
                  👤 Snowball Team
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto scrollbar-hide">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'updates', label: 'Updates' },
              { key: 'investors', label: 'Investors' },
              { key: 'deck', label: 'Pitch Deck' },
              { key: 'fundraising', label: 'Fundraising' },
              { key: 'ai-agent', label: 'AI Agent' },
              { key: 'profile', label: 'Profile' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-blue-600">{trackingInvestors.length}</div>
                  <div className="text-sm text-gray-600">Tracking Investors</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-green-600">{updates.length}</div>
                  <div className="text-sm text-gray-600">Total Updates</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-purple-600">
                    {updates.filter(u => u.type === 'major').length}
                  </div>
                  <div className="text-sm text-gray-600">Major Updates</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-orange-600">
                    {pitchDeck ? 'Uploaded' : 'Pending'}
                  </div>
                  <div className="text-sm text-gray-600">Pitch Deck</div>
                </CardContent>
              </Card>
            </div>

            {/* Public Tracking Link */}
            <Card>
              <CardHeader>
                <CardTitle>Public Tracking Link</CardTitle>
                <CardDescription>
                  Share this link with investors to let them track Snowball without requiring an account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Input 
                    value="https://joinsnowball.io/track/snowball" 
                    readOnly 
                    className="flex-1"
                  />
                  <Button 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText('https://joinsnowball.io/track/snowball')
                      alert('Link copied to clipboard!')
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Metrics */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Current Metrics</CardTitle>
                    <CardDescription>Latest company performance metrics</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('updates')}
                  >
                    Update Metrics
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Get the latest major update with metrics
                  const latestMajorUpdate = updates
                    .filter(update => update.type === 'major' && update.metrics)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                  
                  const metrics = latestMajorUpdate?.metrics as { mrr?: number; growth?: number; users?: number; retention?: number } | undefined
                  
                  if (!metrics) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p className="mb-4">No metrics available yet</p>
                        <Button 
                          variant="outline"
                          onClick={() => setActiveTab('updates')}
                        >
                          Create your first major update with metrics
                        </Button>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {typeof metrics.mrr === 'number' && (
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            ${Math.round(metrics.mrr / 1000)}K
                          </div>
                          <div className="text-sm text-gray-600">Monthly Recurring Revenue</div>
                        </div>
                      )}
                      {typeof metrics.growth === 'number' && (
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            +{metrics.growth}%
                          </div>
                          <div className="text-sm text-gray-600">Month-over-Month Growth</div>
                        </div>
                      )}
                      {typeof metrics.users === 'number' && (
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {metrics.users.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">Active Users</div>
                        </div>
                      )}
                      {typeof metrics.retention === 'number' && (
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            {metrics.retention}%
                          </div>
                          <div className="text-sm text-gray-600">User Retention</div>
                        </div>
                      )}
                    </div>
                  )
                })()}
                {(() => {
                  const latestMajorUpdate = updates
                    .filter(update => update.type === 'major' && update.metrics)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                  
                  if (latestMajorUpdate) {
                    return (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Last updated: {new Date(latestMajorUpdate.created_at).toLocaleDateString()} via &ldquo;{latestMajorUpdate.title || 'Major Update'}&rdquo;
                        </p>
                      </div>
                    )
                  }
                  return null
                })()}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {updates.slice(0, 3).map((update) => (
                    <div key={update.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-lg">{updateTypeConfig[update.type].icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {update.title || update.content.substring(0, 50)}...
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(update.created_at).toLocaleDateString()} • {updateTypeConfig[update.type].label}
                        </p>
                      </div>
                      {update.email_sent_at && (
                        <Badge variant="outline" className="text-green-600">
                          📧 Emailed
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Company Updates</h2>
              <Button onClick={() => setShowCreateUpdate(true)}>
                Create Update
              </Button>
            </div>

            {/* Create Update Modal */}
            {showCreateUpdate && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Update</CardTitle>
                  <CardDescription>Choose the type of update you want to create</CardDescription>
                </CardHeader>
                <CardContent>
                  <CreateUpdateForm
                    type={createUpdateType}
                    onTypeChange={setCreateUpdateType}
                    onSubmit={handleCreateUpdate}
                    onCancel={() => setShowCreateUpdate(false)}
                    isLoading={isCreatingUpdate}
                  />
                </CardContent>
              </Card>
            )}

            {/* Updates Timeline */}
            <div className="space-y-4">
              {updates.map((update) => (
                <Card key={update.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{updateTypeConfig[update.type].icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {update.title || `${updateTypeConfig[update.type].label}`}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(update.created_at).toLocaleDateString()} • {new Date(update.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <Badge variant="outline">
                          {updateTypeConfig[update.type].label}
                        </Badge>
                        {update.email_sent_at && (
                          <Badge variant="outline" className="text-green-600 text-xs">
                            <span className="hidden sm:inline">📧 Emailed to {trackingInvestors.length} investors</span>
                            <span className="sm:hidden">📧 {trackingInvestors.length} investors</span>
                          </Badge>
                        )}
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUpdate(update)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            ✏️ Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUpdate(update.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            🗑️ Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {editingUpdateId === update.id ? (
                      // Edit mode
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-title" className="text-sm font-medium text-gray-700">
                            Title
                          </Label>
                          <Input
                            id="edit-title"
                            value={editingUpdateData?.title || ''}
                            onChange={(e) => setEditingUpdateData(prev => prev ? { ...prev, title: e.target.value } : null)}
                            className="mt-1"
                            placeholder="Update title (optional)"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-content" className="text-sm font-medium text-gray-700">
                            Content *
                          </Label>
                          <Textarea
                            id="edit-content"
                            value={editingUpdateData?.content || ''}
                            onChange={(e) => setEditingUpdateData(prev => prev ? { ...prev, content: e.target.value } : null)}
                            rows={4}
                            className="mt-1"
                            placeholder="What's happening at Snowball?"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={handleSaveUpdateEdit} size="sm" className="bg-blue-600 hover:bg-blue-700">
                            💾 Save Changes
                          </Button>
                          <Button onClick={handleCancelEdit} variant="outline" size="sm">
                            ✕ Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Display mode
                      <div className="prose max-w-none">
                        <p className="text-gray-700">{update.content}</p>
                      </div>
                    )}

                    {update.metrics && typeof update.metrics === 'object' && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {'mrr' in update.metrics && (
                          <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-blue-600">${Number(update.metrics.mrr) / 1000}K</div>
                            <div className="text-xs text-gray-600">MRR</div>
                          </div>
                        )}
                        {'growth' in update.metrics && (
                          <div className="bg-green-50 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-green-600">+{String(update.metrics.growth)}%</div>
                            <div className="text-xs text-gray-600">Growth</div>
                          </div>
                        )}
                        {'users' in update.metrics && (
                          <div className="bg-purple-50 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-purple-600">{String(update.metrics.users)}</div>
                            <div className="text-xs text-gray-600">Users</div>
                          </div>
                        )}
                        {'retention' in update.metrics && (
                          <div className="bg-yellow-50 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-yellow-600">{String(update.metrics.retention)}%</div>
                            <div className="text-xs text-gray-600">Retention</div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'investors' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Tracking Investors</h2>
              <div className="text-sm text-gray-600">
                {trackingInvestors.length} investors tracking Snowball
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trackingInvestors.map((relationship) => (
                <Card key={relationship.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="text-3xl">👤</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{relationship.investor?.investor_name}</h3>
                        <p className="text-sm text-gray-600">{relationship.investor?.firm_name}</p>
                        <p className="text-xs text-gray-500">{relationship.investor?.title}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>📧 {relationship.investor?.email}</p>
                      <p className="mt-2 text-green-600">✅ Tracking since {new Date(relationship.created_at).toLocaleDateString()}</p>
                      {relationship.notes && (
                        <p className="mt-1 text-xs text-gray-500 italic">&ldquo;{relationship.notes}&rdquo;</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {trackingInvestors.length === 0 && (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tracking Investors Yet</h3>
                  <p className="text-gray-600">
                    Investors will appear here when they start tracking Snowball.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'deck' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Pitch Deck</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Upload Pitch Deck</CardTitle>
                <CardDescription>
                  Upload your PowerPoint or PDF pitch deck. Investors will be able to view this.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="deck-upload">Pitch Deck File</Label>
                    <Input
                      id="deck-upload"
                      type="file"
                      accept=".pdf,.ppt,.pptx"
                      onChange={handleDeckUpload}
                      className="mt-1"
                      disabled={uploadingDeck}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Accepted formats: PDF, PowerPoint (.ppt, .pptx) • Max size: 50MB
                    </p>
                  </div>

                  {uploadingDeck && (
                    <Alert>
                      <AlertDescription>
                        🔄 Uploading deck... Please wait.
                      </AlertDescription>
                    </Alert>
                  )}

                  {deckFile && !uploadingDeck && (
                    <Alert>
                      <AlertDescription>
                        ✅ Deck uploaded: {deckFile.name} ({deckFile.size > 0 ? (deckFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'Size unknown'})
                      </AlertDescription>
                    </Alert>
                  )}

                  {pitchDeck && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Current Deck</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        This is what investors will see when they view your deck.
                      </p>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isLoadingDeck}
                          onClick={async () => {
                            if (pitchDeck.file_url) {
                              setIsLoadingDeck(true)
                              try {
                                // Get fresh signed URL
                                const response = await fetch(`/api/get-deck-url?file=${encodeURIComponent(pitchDeck.file_url)}`)
                                const result = await response.json()
                                
                                if (result.success) {
                                  window.open(result.publicUrl, '_blank')
                                } else {
                                  alert('Failed to access deck. Please try again.')
                                }
                              } catch (error) {
                                console.error('Error getting deck URL:', error)
                                alert('Failed to access deck. Please try again.')
                              } finally {
                                setIsLoadingDeck(false)
                              }
                            } else {
                              alert('Deck URL not available. Please re-upload.')
                            }
                          }}
                        >
                          {isLoadingDeck ? '⏳ Loading...' : '📄 View Deck'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isLoadingDeck}
                          onClick={async () => {
                            if (pitchDeck.file_url) {
                              setIsLoadingDeck(true)
                              try {
                                // Get fresh signed URL for download
                                const response = await fetch(`/api/get-deck-url?file=${encodeURIComponent(pitchDeck.file_url)}`)
                                const result = await response.json()
                                
                                if (result.success) {
                                  const link = document.createElement('a')
                                  link.href = result.publicUrl
                                  link.download = pitchDeck.file_name || 'snowball-deck'
                                  link.click()
                                } else {
                                  alert('Failed to download deck. Please try again.')
                                }
                              } catch (error) {
                                console.error('Error getting deck URL:', error)
                                alert('Failed to download deck. Please try again.')
                              } finally {
                                setIsLoadingDeck(false)
                              }
                            } else {
                              alert('Download not available. Please re-upload.')
                            }
                          }}
                        >
                          {isLoadingDeck ? '⏳ Loading...' : '📥 Download'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'fundraising' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Fundraising Status</h2>
              <Button 
                variant={isEditingFundraisingStatus ? "outline" : "default"}
                onClick={() => setIsEditingFundraisingStatus(!isEditingFundraisingStatus)}
                disabled={isUpdatingFundraisingStatus}
                className={isUpdatingFundraisingStatus ? "opacity-50 cursor-not-allowed" : ""}
              >
                {isEditingFundraisingStatus ? 'Cancel' : 'Update Status'}
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Current Fundraising Status</CardTitle>
                {isEditingFundraisingStatus && (
                  <CardDescription>
                    ⚠️ Updating your fundraising status will be visible on your public tracking page
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <FundraisingStatusForm 
                  isEditing={isEditingFundraisingStatus}
                  statusData={fundraisingStatus}
                  onStatusChange={setFundraisingStatusForm}
                  onSubmit={handleFundraisingStatusSubmit}
                  isUpdating={isUpdatingFundraisingStatus}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'ai-agent' && (
          <AIAgentInterface />
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
              <Button 
                variant={isEditingProfile ? "outline" : "default"}
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                disabled={isUpdatingProfile}
                className={isUpdatingProfile ? "opacity-50 cursor-not-allowed" : ""}
              >
                {isEditingProfile ? 'Cancel' : 'Edit Profile'}
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Snowball Information</CardTitle>
                {isEditingProfile && (
                  <CardDescription>
                    ⚠️ Editing your profile will send a major update to all tracking investors
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <ProfileEditForm 
                  isEditing={isEditingProfile}
                  formData={profileForm}
                  onFormChange={setProfileForm}
                  onSubmit={handleProfileSubmit}
                  isUpdating={isUpdatingProfile}
                />
              </CardContent>
            </Card>

            {/* Team Section */}
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Team</h3>
              <Button 
                variant={isEditingTeam ? "outline" : "default"}
                onClick={() => setIsEditingTeam(!isEditingTeam)}
                disabled={isUpdatingTeam}
                className={isUpdatingTeam ? "opacity-50 cursor-not-allowed" : ""}
              >
                {isEditingTeam ? 'Cancel' : 'Edit Team'}
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Leadership Team</CardTitle>
                {isEditingTeam && (
                  <CardDescription>
                    ✏️ Update your team information (changes will not trigger investor notifications)
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <TeamEditForm 
                  isEditing={isEditingTeam}
                  teamData={teamForm}
                  onTeamChange={setTeamForm}
                  onSubmit={handleTeamSubmit}
                  isUpdating={isUpdatingTeam}
                  userId="snowball-demo-user"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Profile Update Confirmation Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">⚠️ Confirm Profile Update</DialogTitle>
            <DialogDescription className="text-gray-600">
              Updating your company profile will automatically send a <strong>major update</strong> to all {trackingInvestors.length} investors tracking Snowball. They will be notified about the changes to keep them informed of your progress.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">This action will:</p>
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Update your public company profile</li>
              <li>Send an email notification to tracking investors</li>
              <li>Create a major update in your updates feed</li>
            </ul>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowUpdateDialog(false)}
              disabled={isUpdatingProfile}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmProfileUpdate}
              disabled={isUpdatingProfile}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingProfile ? 'Updating...' : 'Update & Notify Investors'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Component for creating updates
function CreateUpdateForm({ 
  type, 
  onTypeChange, 
  onSubmit, 
  onCancel,
  isLoading = false
}: {
  type: UpdateType
  onTypeChange: (type: UpdateType) => void
  onSubmit: (data: CreateUpdateData) => void
  onCancel: () => void
  isLoading?: boolean
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [metrics, setMetrics] = useState({
    mrr: '',
    growth: '',
    users: '',
    retention: ''
  })
  const [includeMetrics, setIncludeMetrics] = useState({
    mrr: true,
    growth: true,
    users: true,
    retention: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Only include metrics that are selected and have values
    const selectedMetrics: Record<string, number> = {}
    if (type === 'major') {
      if (includeMetrics.mrr && metrics.mrr) {
        selectedMetrics.mrr = parseInt(metrics.mrr) || 0
      }
      if (includeMetrics.growth && metrics.growth) {
        selectedMetrics.growth = parseInt(metrics.growth) || 0
      }
      if (includeMetrics.users && metrics.users) {
        selectedMetrics.users = parseInt(metrics.users) || 0
      }
      if (includeMetrics.retention && metrics.retention) {
        selectedMetrics.retention = parseInt(metrics.retention) || 0
      }
    }

    const updateData: CreateUpdateData = {
      title: type !== 'coolsies' ? title : undefined,
      content,
      metrics: type === 'major' && Object.keys(selectedMetrics).length > 0 ? selectedMetrics : undefined
    }

    onSubmit(updateData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Update Type Selection */}
      <div>
        <Label className="text-base font-medium">Update Type</Label>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(updateTypeConfig) as UpdateType[]).map((updateType) => (
            <button
              key={updateType}
              type="button"
              onClick={() => onTypeChange(updateType)}
              className={`p-4 rounded-lg border text-left transition-colors ${
                type === updateType
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{updateTypeConfig[updateType].icon}</span>
                <span className="font-medium">{updateTypeConfig[updateType].label}</span>
              </div>
              <p className="text-sm text-gray-600">
                {updateTypeConfig[updateType].description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Title (not for coolsies) */}
      {type !== 'coolsies' && (
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter update title"
            className="mt-1"
            required
          />
        </div>
      )}

      {/* Content */}
      <div>
        <Label htmlFor="content">
          {type === 'coolsies' ? 'What\'s on your mind?' : 'Content'}
        </Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            type === 'major' 
              ? 'Write your investor update...'
              : type === 'minor'
              ? 'Share a functional or progress update...'
              : 'Share a quick thought or meeting update...'
          }
          rows={type === 'coolsies' ? 3 : 6}
          className="mt-1"
          required
        />
      </div>

      {/* Metrics (only for major updates) */}
      {type === 'major' && (
        <div>
          <Label className="text-base font-medium">Key Metrics</Label>
          <p className="text-sm text-gray-600 mt-1 mb-4">Choose which metrics to include in your update</p>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  id="include-mrr"
                  checked={includeMetrics.mrr}
                  onChange={(e) => setIncludeMetrics({ ...includeMetrics, mrr: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="include-mrr" className="text-sm">Include MRR</Label>
              </div>
              <Label htmlFor="mrr" className="text-sm">MRR ($)</Label>
              <Input
                id="mrr"
                type="number"
                value={metrics.mrr}
                onChange={(e) => setMetrics({ ...metrics, mrr: e.target.value })}
                placeholder="140000"
                className="mt-1"
                disabled={!includeMetrics.mrr}
              />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  id="include-growth"
                  checked={includeMetrics.growth}
                  onChange={(e) => setIncludeMetrics({ ...includeMetrics, growth: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="include-growth" className="text-sm">Include Growth</Label>
              </div>
              <Label htmlFor="growth" className="text-sm">Growth (%)</Label>
              <Input
                id="growth"
                type="number"
                value={metrics.growth}
                onChange={(e) => setMetrics({ ...metrics, growth: e.target.value })}
                placeholder="12"
                className="mt-1"
                disabled={!includeMetrics.growth}
              />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  id="include-users"
                  checked={includeMetrics.users}
                  onChange={(e) => setIncludeMetrics({ ...includeMetrics, users: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="include-users" className="text-sm">Include Users</Label>
              </div>
              <Label htmlFor="users" className="text-sm">Active Users</Label>
              <Input
                id="users"
                type="number"
                value={metrics.users}
                onChange={(e) => setMetrics({ ...metrics, users: e.target.value })}
                placeholder="15000"
                className="mt-1"
                disabled={!includeMetrics.users}
              />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  id="include-retention"
                  checked={includeMetrics.retention}
                  onChange={(e) => setIncludeMetrics({ ...includeMetrics, retention: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="include-retention" className="text-sm">Include Retention</Label>
              </div>
              <Label htmlFor="retention" className="text-sm">Retention (%)</Label>
              <Input
                id="retention"
                type="number"
                value={metrics.retention}
                onChange={(e) => setMetrics({ ...metrics, retention: e.target.value })}
                placeholder="94"
                className="mt-1"
                disabled={!includeMetrics.retention}
              />
            </div>
          </div>
        </div>
      )}

      {/* Email Preview (for major updates) */}
      {type === 'major' && (
        <Alert>
          <AlertDescription>
            📧 This major update will be automatically emailed to tracking investors
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : (type === 'major' ? 'Create & Send Email' : 'Create Update')}
        </Button>
      </div>
    </form>
  )
}

// AI Agent Interface Component
function AIAgentInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant' as const,
      content: "I'm your AI Chief of Staff. I manage your operations, optimize your strategic initiatives, coordinate your network, and handle executive tasks. What can I help you accomplish today?",
      timestamp: new Date(),
      suggestions: [
        "I'm traveling to San Francisco next week",
        "Help me prepare for the Primary VC event", 
        "Who should I connect with for fundraising?",
        "Draft strategic communications for my network"
      ]
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typewriterText, setTypewriterText] = useState('')
  const [isTypewriting, setIsTypewriting] = useState(false)
  const [currentTypewritingId, setCurrentTypewritingId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showEmailDraft, setShowEmailDraft] = useState(false)
  const [emailDraftData, setEmailDraftData] = useState<{
    recipient: string
    subject: string
    content: string
    type: string
  } | null>(null)

  // Typewriter effect for AI responses
  const typewriterEffect = (text: string, messageId: string, callback?: () => void) => {
    setIsTypewriting(true)
    setCurrentTypewritingId(messageId)
    setTypewriterText('')
    let i = 0
    
    const timer = setInterval(() => {
      if (i < text.length) {
        // Build the string from scratch each time to avoid race conditions
        const currentText = text.substring(0, i + 1)
        setTypewriterText(currentText)
        i++
      } else {
        clearInterval(timer)
        setIsTypewriting(false)
        setCurrentTypewritingId(null)
        if (callback) callback()
      }
    }, 15) // Faster speed for longer content
    
    // Store the timer to clear it if needed
    return timer
  }

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    setTimeout(() => {
      const messagesContainer = document.querySelector('[data-messages-container]')
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }
    }, 100)
  }

  interface Message {
    id: string
    type: 'user' | 'assistant'
    content: string
    timestamp: Date
    suggestions?: string[]
    networkData?: {
      contacts: { name: string; connection: string; lastContact: string; relevance: string }[]
      events: { name: string; date: string; attendees: number; relevance: string }[]
    }
    scheduleData?: {
      upcoming: { title: string; date: string; type: string; description: string }[]
      suggestions: { action: string; priority: string; description: string }[]
    }
  }

  const networkMockData = {
    contacts: [
      { name: "Sarah Chen", connection: "Stanford Alumni", lastContact: "2 weeks ago", relevance: "Series A investor at Kleiner Perkins" },
      { name: "Michael Rodriguez", connection: "LinkedIn", lastContact: "1 month ago", relevance: "Former Stripe colleague, now at a16z" },
      { name: "Alex Kim", connection: "Twitter", lastContact: "3 days ago", relevance: "CEO of successful SF startup, YC alumnus" },
      { name: "Jennifer Wu", connection: "YC Network", lastContact: "1 week ago", relevance: "Angel investor, 15+ exits" },
      { name: "David Park", connection: "SF Tech Meetup", lastContact: "2 months ago", relevance: "VP at Sequoia Capital" }
    ],
    events: [
      { name: "Primary VC Demo Day", date: "Next Friday", attendees: 200, relevance: "Key fundraising opportunity" },
      { name: "SF Tech Mixer", date: "Tomorrow", attendees: 150, relevance: "Networking with local founders" },
      { name: "Stanford Alumni Meetup", date: "Next Monday", attendees: 80, relevance: "University connections" }
    ]
  }

  const scheduleMockData = {
    upcoming: [
      { title: "Board Meeting Prep", date: "Today 3PM", type: "meeting", description: "Prepare Q4 metrics and fundraising update" },
      { title: "San Francisco Trip", date: "Next Week Mon-Wed", type: "travel", description: "Investor meetings and Primary VC event" },
      { title: "Product Demo", date: "Friday 2PM", type: "presentation", description: "Demo for Primary VC panel" },
      { title: "Team All-Hands", date: "Next Thursday", type: "meeting", description: "Monthly team sync and planning" }
    ],
    suggestions: [
      { action: "Schedule coffee with Sarah Chen", priority: "High", description: "She'll be in SF during your trip" },
      { action: "Send Primary VC prep email to network", priority: "High", description: "Let your contacts know about the upcoming demo" },
      { action: "Book dinner with Stanford alumni", priority: "Medium", description: "Leverage university connections" }
    ]
  }

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputMessage.trim()
    if (!text) return

    // Prevent multiple submissions
    if (isProcessing) return
    setIsProcessing(true)

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)
    
    // Scroll to show the user message
    scrollToBottom()

    // Simulate AI thinking process with multiple stages
    const thinkingStages = [
      "Initializing neural network analysis...",
      "Processing network graph relationships...", 
      "Cross-referencing contact databases...",
      "Analyzing meeting patterns and availability...",
      "Calculating relationship strength scores...",
      "Generating strategic recommendations..."
    ]

    // Show thinking process
    for (let i = 0; i < thinkingStages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800))
      // Update thinking indicator could be added here
    }

    // Professional AI processing with detailed analysis
    setTimeout(() => {
      let assistantContent: string
      let assistantData: Partial<Message> = {}
      
      if (text.toLowerCase().includes('san francisco') || text.toLowerCase().includes('sf')) {
        assistantContent = `San Francisco Executive Trip Plan - Strategic Analysis Complete.

EXECUTIVE SUMMARY:
As your Chief of Staff, I've orchestrated a comprehensive analysis of your upcoming San Francisco visit. I've evaluated 847 professional contacts, analyzed 124 investor profiles, and optimized your schedule for maximum strategic impact across fundraising, partnerships, and market expansion opportunities.

STRATEGIC OBJECTIVES ANALYSIS:
• Primary Goal: Advance Series A fundraising conversations
• Secondary Goal: Establish west coast partnership pipeline  
• Tertiary Goal: Market intelligence gathering and competitive analysis

PRIORITIZED STAKEHOLDER ENGAGEMENT:
• 5 tier-1 investors with portfolio alignment and active deployment
• 3 strategic partnership opportunities in adjacent markets
• 2 potential advisory board candidates with operational expertise
• Optimal scheduling windows optimized for executive energy and travel logistics

RESOURCE ALLOCATION RECOMMENDATIONS:
Your current traction metrics ($140K MRR, 12% growth) position you favorably for substantive conversations. I've prepared tailored value propositions for each stakeholder category to maximize conversion probability.

EXECUTION READINESS:
All communications, meeting agendas, and follow-up sequences are prepared for immediate deployment upon your approval.`

        assistantData = {
          networkData: networkMockData,
          suggestions: [
            "Draft personalized outreach emails",
            "Schedule coffee meetings at optimal times", 
            "Book dinner with investor group",
            "Coordinate executive stakeholder meeting"
          ]
        }
      } else if (text.toLowerCase().includes('primary vc') || text.toLowerCase().includes('pitch')) {
        assistantContent = `Primary VC Demo Day - Executive Preparation Brief.

STRATEGIC EVENT ANALYSIS:
As your Chief of Staff, I've conducted comprehensive due diligence on Primary VC Demo Day. This represents a tier-1 opportunity for advancing your Series A objectives, with carefully vetted attendee alignment and optimal timing within your fundraising timeline.

STAKEHOLDER INTELLIGENCE:
• 3 priority relationships already in our network attending (warm path)
• 2 investors with documented marketplace investment thesis
• 1 LP with direct influence on Series A fund deployment decisions
• Target check size alignment: $500K - $2M (perfect fit for your round sizing)

COMPETITIVE POSITIONING ASSESSMENT:
Your company metrics ($140K MRR, 12% growth, 15K users) rank in the top 20% of Primary VC cohort companies historically. Your tribe-based approach provides clear differentiation in an increasingly commoditized marketplace sector.

STRATEGIC NARRATIVE OPTIMIZATION:
I've refined your positioning to emphasize community-driven network effects and defensible user acquisition, themes that resonate with current venture capital investment patterns.

EXECUTION FRAMEWORK:
Complete preparation package ready: pre-event relationship warming sequences, pitch optimization, post-demo follow-up campaigns, and strategic partnership conversations all coordinated for maximum impact.`

        assistantData = {
          networkData: {
            contacts: networkMockData.contacts.filter(c => 
              c.name.includes('Sarah') || c.name.includes('Michael') || c.name.includes('Jennifer')
            ),
            events: networkMockData.events.filter(e => e.name.includes('Primary'))
          },
          suggestions: [
            "Send strategic pre-event outreach",
            "Schedule post-demo investor calls", 
            "Prepare follow-up material package",
            "Coordinate warm introductions"
          ]
        }
      } else if (text.toLowerCase().includes('schedule') || text.toLowerCase().includes('calendar')) {
        assistantContent = `Executive Schedule Optimization - Strategic Analysis Complete.

CALENDAR EFFICIENCY ASSESSMENT:
As your Chief of Staff, I've analyzed your schedule patterns, stakeholder engagement frequency, and strategic priority alignment to optimize your time allocation for maximum business impact.

EXECUTIVE TIME OPTIMIZATION OPPORTUNITIES:
• 3 strategic windows available for high-value stakeholder meetings
• 2 optimal blocks for deep work and strategic planning sessions
• 1 prime slot for group investor dinner coordination
• 4 critical follow-up conversations requiring immediate scheduling

STAKEHOLDER RELATIONSHIP PORTFOLIO:
Comprehensive analysis reveals 8 tier-1 relationships requiring executive attention and 12 relationships in maintenance mode. I've prioritized based on strategic value, timing sensitivity, and potential business impact.

STRATEGIC TIME ALLOCATION FRAMEWORK:
Recommending 60% focus on new strategic relationship development, 40% on existing stakeholder nurturing, optimized for Series A advancement and operational excellence.

PRODUCTIVITY ARCHITECTURE:
Structured 2-hour strategic work blocks between stakeholder engagements to maintain operational momentum while executing your relationship and fundraising strategy.`

        assistantData = {
          scheduleData: scheduleMockData,
          suggestions: [
            "Optimize executive schedule",
            "Add strategic relationship calls",
            "Schedule follow-up touchpoints", 
            "Block focused preparation time"
          ]
        }
      } else if (text.toLowerCase().includes('email') || text.toLowerCase().includes('connect')) {
        assistantContent = `Executive Communications Suite - Strategic Deployment Ready.

COMMUNICATIONS STRATEGY ANALYSIS:
As your Chief of Staff, I've analyzed your recent company milestones, stakeholder relationship history, and strategic positioning to craft executive-level communication campaigns that advance your business objectives.

EXECUTIVE MESSAGING FRAMEWORK:
Each communication will feature:
• Strategic value propositions tailored to recipient priorities
• Company milestone integration showcasing momentum
• Relationship-specific context leveraging shared connections
• Executive-level positioning appropriate for C-suite engagement

CAMPAIGN PERFORMANCE OPTIMIZATION:
Communications optimized for executive attention:
• 67% open rate targeting (premium executive tier)
• 23% response rate through strategic relationship scoring
• C-suite appropriate tone and strategic framing
• Optimal timing based on executive engagement patterns

STRATEGIC COMMUNICATION PORTFOLIOS:
• Series A investor milestone updates with traction narratives
• Strategic partnership introduction requests through warm connections
• Executive event announcements and board-level invitations
• Stakeholder relationship maintenance and strategic check-ins

Complete executive communication infrastructure ready for immediate deployment with real-time optimization.`

        assistantData = {
          suggestions: [
            "Draft investor update emails",
            "Request strategic introductions", 
            "Share milestone announcements",
            "Schedule relationship touchpoints"
          ]
        }
      } else {
        assistantContent = `AI Chief of Staff - Executive Support Systems Online.

COMPREHENSIVE EXECUTIVE CAPABILITIES:
As your AI Chief of Staff, I provide end-to-end executive support including strategic planning, stakeholder relationship management, operational coordination, and business development orchestration. My analytical engine continuously optimizes your leadership effectiveness and business outcomes.

STRATEGIC FRAMEWORKS:
• Executive Dashboard Analytics: Real-time business intelligence and KPI optimization
• Stakeholder Relationship Portfolio: Strategic mapping and engagement optimization
• Operational Excellence: Process automation and efficiency maximization
• Strategic Communications: Executive-level messaging and relationship development

AVAILABLE SERVICES:
• Strategic Network Analysis: Deep-dive relationship mapping and opportunity identification
• Communication Optimization: AI-generated, personalized outreach campaigns
• Schedule Intelligence: Calendar optimization for maximum executive effectiveness
• Relationship Maintenance: Automated follow-up and touchpoint management

DEPLOYMENT OPTIONS:
Ready to execute comprehensive strategic initiatives aligned with your business objectives and executive leadership goals.`

        assistantData = {
          suggestions: [
            "Analyze network for specific goals",
            "Optimize relationship strategy",
            "Generate targeted outreach", 
            "Schedule strategic touchpoints"
          ]
        }
      }
      
      // Create a temporary message for typewriter effect
      const tempAssistantResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, tempAssistantResponse])
      setIsTyping(false)
      
      // Scroll to show the AI is responding
      scrollToBottom()
      
      // Use typewriter effect for professional feel
      typewriterEffect(assistantContent, tempAssistantResponse.id, () => {
        // Replace the temporary message with the final one
        const finalAssistantResponse: Message = {
          id: tempAssistantResponse.id,
          type: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
          ...assistantData
        }
        setMessages(prev => prev.map(msg => 
          msg.id === tempAssistantResponse.id ? finalAssistantResponse : msg
        ))
        
        // Reset processing state and scroll to show complete message
        setIsProcessing(false)
        scrollToBottom()
      })
    }, 2000) // Longer processing time for detailed analysis
  }

  const handleSuggestionClick = (suggestion: string) => {
    // Prevent multiple clicks during processing
    if (isProcessing) return
    
    // Check if this is an email-related suggestion
    if (suggestion.toLowerCase().includes('email') || suggestion.toLowerCase().includes('draft')) {
      // Show email draft modal (no immediate scrolling for email)
      const emailData = generateEmailDraft(suggestion)
      setEmailDraftData(emailData)
      setShowEmailDraft(true)
    } else {
      // For other suggestions, handle as normal message (will scroll automatically)
      handleSendMessage(suggestion)
    }
  }

  const generateEmailDraft = (suggestion: string) => {
    if (suggestion.includes('Sarah Chen')) {
      return {
        recipient: 'Sarah Chen',
        subject: 'Coffee during SF trip - Snowball update',
        content: `Hi Sarah,

Hope you're doing well! I'll be in San Francisco next week for some investor meetings and would love to catch up over coffee.

We've made incredible progress at Snowball since we last spoke:
• Reached $140K MRR with 12% month-over-month growth
• Expanded to 15,000 active users
• Secured partnerships with 3 major accelerators

I'd love to share more about our journey and hear about what you're working on at Kleiner Perkins. Are you free for a quick coffee on Tuesday or Wednesday?

Best regards,
Alex Johnson
CEO, Snowball`,
        type: 'strategic'
      }
    } else if (suggestion.includes('Primary VC')) {
      return {
        recipient: 'My Network',
        subject: 'Snowball presenting at Primary VC Demo Day 🚀',
        content: `Hi there,

Exciting news! Snowball has been selected to present at Primary VC's Demo Day this Friday.

We've been building the future of startup-investor connections through tribe-based networking, and the progress has been incredible:
• $140K Monthly Recurring Revenue
• 15,000+ active users across our platform
• 124 investor relationships facilitated
• Partnerships with YC, Techstars, and other top accelerators

If you're interested in attending or know someone who should be there, please let me know. Would love to see familiar faces in the audience!

You can also track our progress anytime at: https://joinsnowball.io/track/snowball

Thanks for all your support,
Alex Johnson
CEO & Co-founder, Snowball`,
        type: 'announcement'
      }
    } else {
      return {
        recipient: 'Network Contact',
        subject: 'Quick check-in from Snowball',
        content: `Hi there,

Hope you're doing well! Just wanted to share a quick update on Snowball's progress.

We've been making great strides in connecting startups with investors through our tribe-based networking platform. Would love to catch up soon and share more details.

Let me know if you'd like to grab coffee or have a quick call in the coming weeks.

Best,
Alex Johnson
CEO, Snowball`,
        type: 'general'
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Professional AI Header */}
      <div className="relative bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
        <div className="neural-pattern absolute inset-0 opacity-50"></div>
        <div className="data-stream absolute top-0 left-0 right-0"></div>
        <div className="relative z-10 px-8 py-12 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center animate-neural-pulse mr-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M12 1V23" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
                <path d="M1 12H23" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
                AI Chief of Staff
              </h1>
              <div className="flex items-center justify-center mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-status-indicator mr-2"></div>
                <span className="text-sm text-slate-600 font-medium">Neural Engine Active</span>
              </div>
            </div>
          </div>
          
          <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Your executive assistant powered by AI. Managing operations, strategy, and relationships so you can focus on what matters most.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <div className="px-4 py-2 bg-white/80 border border-slate-200 rounded-lg ai-glow-subtle">
              <span className="text-slate-700 font-medium">Executive Operations</span>
            </div>
            <div className="px-4 py-2 bg-white/80 border border-slate-200 rounded-lg ai-glow-subtle">
              <span className="text-slate-700 font-medium">Strategic Planning</span>
            </div>
            <div className="px-4 py-2 bg-white/80 border border-slate-200 rounded-lg ai-glow-subtle">
              <span className="text-slate-700 font-medium">Relationship Management</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Professional Chat Interface */}
        <div className="xl:col-span-2">
          <Card className="h-[600px] flex flex-col ai-border">
            <CardHeader className="border-b border-slate-200 bg-slate-50">
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M21 15A2 2 0 0 1 19 17H7L4 20V5A2 2 0 0 1 6 3H19A2 2 0 0 1 21 5Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                </div>
                <div>
                  <span className="text-slate-800 font-semibold">Neural Chat Interface</span>
                  <div className="flex items-center mt-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-status-indicator"></div>
                    <span className="text-xs text-slate-500">Connected to AI Engine</span>
                  </div>
                </div>
              </CardTitle>
              <CardDescription className="text-slate-600">
                Direct access to your AI Chief of Staff for executive support and strategic decision-making
              </CardDescription>
            </CardHeader>
            
            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-white" data-messages-container>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white ai-glow-subtle' 
                      : 'bg-slate-50 text-slate-800 border border-slate-200'
                  } animate-subtle-fade-in`}>
                    {/* AI Typing Effect */}
                    {isTypewriting && message.type === 'assistant' && message.id === currentTypewritingId ? (
                      <div>
                        <p className="text-sm leading-relaxed whitespace-pre-line typewriter-cursor">{typewriterText}</p>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                      {message.type === 'assistant' && (
                        <div className="flex items-center text-xs opacity-70">
                          <div className="w-1 h-1 bg-current rounded-full mr-1"></div>
                          <span>AI Response</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Professional Suggestions */}
                    {message.suggestions && message.content && !isTypewriting && (
                      <div className="mt-4 space-y-2">
                        <div className="text-xs text-slate-500 mb-2 font-medium">Suggested Actions:</div>
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            disabled={isProcessing}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={`block w-full text-left p-3 text-xs rounded-lg border transition-all duration-200 ${
                              isProcessing 
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                : message.type === 'user' 
                                  ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' 
                                  : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-700'
                            }`}
                          >
                            <span className="font-medium">{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Professional Network Data Display */}
                    {message.networkData && message.content && !isTypewriting && (
                      <div className="mt-4 space-y-3">
                        <div className={`p-4 rounded-lg border ${
                          message.type === 'user' 
                            ? 'bg-white/10 border-white/20' 
                            : 'bg-white border-slate-200'
                        }`}>
                          <h4 className={`font-semibold text-sm mb-3 flex items-center ${
                            message.type === 'user' ? 'text-white' : 'text-slate-800'
                          }`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                              <path d="M16 21V19A4 4 0 0 0 12 15H6A4 4 0 0 0 2 19V21" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                              <path d="M22 21V19A4 4 0 0 0 16 13.5L15 15L22 21Z" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            Priority Contacts
                          </h4>
                          {message.networkData.contacts.map((contact, idx) => (
                            <div key={idx} className={`text-xs mb-3 p-3 rounded-lg border ${
                              message.type === 'user' 
                                ? 'bg-white/10 border-white/20' 
                                : 'bg-slate-50 border-slate-200'
                            }`}>
                              <div className="font-semibold mb-1">{contact.name}</div>
                              <div className={`text-xs mb-1 ${message.type === 'user' ? 'text-white/80' : 'text-slate-600'}`}>
                                {contact.connection} • Last contact: {contact.lastContact}
                              </div>
                              <div className={`text-xs font-medium ${
                                message.type === 'user' ? 'text-blue-200' : 'text-blue-600'
                              }`}>
                                {contact.relevance}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {message.networkData.events.length > 0 && (
                          <div className={`p-4 rounded-lg border ${
                            message.type === 'user' 
                              ? 'bg-white/10 border-white/20' 
                              : 'bg-white border-slate-200'
                          }`}>
                            <h4 className={`font-semibold text-sm mb-3 flex items-center ${
                              message.type === 'user' ? 'text-white' : 'text-slate-800'
                            }`}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                              Strategic Events
                            </h4>
                            {message.networkData.events.map((event, idx) => (
                              <div key={idx} className={`text-xs mb-3 p-3 rounded-lg border ${
                                message.type === 'user' 
                                  ? 'bg-white/10 border-white/20' 
                                  : 'bg-slate-50 border-slate-200'
                              }`}>
                                <div className="font-semibold mb-1">{event.name}</div>
                                <div className={`text-xs mb-1 ${message.type === 'user' ? 'text-white/80' : 'text-slate-600'}`}>
                                  {event.date} • {event.attendees} attendees
                                </div>
                                <div className={`text-xs font-medium ${
                                  message.type === 'user' ? 'text-blue-200' : 'text-blue-600'
                                }`}>
                                  {event.relevance}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Schedule Data Display */}
                    {message.scheduleData && message.content && !isTypewriting && (
                      <div className="mt-4 space-y-3">
                        <div className="bg-white/10 p-3 rounded">
                          <h4 className="font-semibold text-sm mb-2">📅 Upcoming Schedule</h4>
                          {message.scheduleData.upcoming.map((item, idx) => (
                            <div key={idx} className="text-xs mb-2 p-2 bg-white/10 rounded">
                              <div className="font-semibold">{item.title}</div>
                              <div className="opacity-80">{item.date} • {item.type}</div>
                              <div className="text-blue-300 text-xs">{item.description}</div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-white/10 p-3 rounded">
                          <h4 className="font-semibold text-sm mb-2">💡 AI Suggestions</h4>
                          {message.scheduleData.suggestions.map((suggestion, idx) => (
                            <div key={idx} className="text-xs mb-2 p-2 bg-white/10 rounded">
                              <div className="font-semibold">{suggestion.action}</div>
                              <div className={`text-xs ${suggestion.priority === 'High' ? 'text-red-300' : 'text-yellow-300'}`}>
                                {suggestion.priority} Priority
                              </div>
                              <div className="text-blue-300 text-xs">{suggestion.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Professional Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 border border-slate-200 text-slate-600 p-4 rounded-lg ai-glow-subtle">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center animate-neural-pulse">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium">AI analyzing</span>
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-slate-400 rounded-full animate-thinking-dots"></div>
                          <div className="w-1 h-1 bg-slate-400 rounded-full animate-thinking-dots" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-1 h-1 bg-slate-400 rounded-full animate-thinking-dots" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            {/* Professional Input */}
            <div className="border-t border-slate-200 bg-slate-50 p-4">
              <div className="flex space-x-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Enter your strategic objectives or executive directives..."
                  className="flex-1 border-slate-300 focus:border-blue-500 bg-white"
                  onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleSendMessage()}
                  disabled={isTyping || isProcessing}
                />
                <Button 
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isTyping || isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 px-6 ai-glow-subtle disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                    <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2"/>
                    <polygon points="22,2 15,22 11,13 2,9" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
                  </svg>
                  {isProcessing ? 'Processing...' : 'Execute'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Professional Side Panel */}
        <div className="space-y-6">
          {/* Strategic Actions */}
          <Card className="ai-border">
            <CardHeader className="bg-slate-50 border-b border-slate-200">
              <CardTitle className="text-lg flex items-center gap-3 text-slate-800">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                </div>
                Executive Commands
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <Button 
                variant="outline" 
                disabled={isProcessing}
                className={`w-full justify-start transition-all duration-200 ${
                  isProcessing 
                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onClick={() => handleSendMessage("I'm traveling to San Francisco next week")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-3">
                  <path d="M21 10C21 17 12 23 12 23S3 17 3 10A9 9 0 0 1 21 10Z" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                </svg>
                SF Trip Strategy
              </Button>
              <Button 
                variant="outline" 
                disabled={isProcessing}
                className={`w-full justify-start transition-all duration-200 ${
                  isProcessing 
                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onClick={() => handleSendMessage("Help me prepare for the Primary VC event")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-3">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <polygon points="10,8 16,12 10,16" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
                </svg>
                VC Event Prep
              </Button>
              <Button 
                variant="outline" 
                disabled={isProcessing}
                className={`w-full justify-start transition-all duration-200 ${
                  isProcessing 
                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onClick={() => handleSendMessage("Draft strategic communications for my network")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-3">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Outreach Campaign
              </Button>
              <Button 
                variant="outline" 
                disabled={isProcessing}
                className={`w-full justify-start transition-all duration-200 ${
                  isProcessing 
                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onClick={() => handleSendMessage("Show me my schedule optimization")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-3">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Schedule Analysis
              </Button>
            </CardContent>
          </Card>

          {/* Network Intelligence */}
          <Card className="ai-border">
            <CardHeader className="bg-slate-50 border-b border-slate-200">
              <CardTitle className="text-lg flex items-center gap-3 text-slate-800">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                Executive Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">847</div>
                <div className="text-sm text-slate-600 font-medium">Active Connections</div>
                <div className="text-xs text-slate-500 mt-1">LinkedIn Network</div>
              </div>
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">124</div>
                <div className="text-sm text-slate-600 font-medium">Investor Relations</div>
                <div className="text-xs text-slate-500 mt-1">Verified Contacts</div>
              </div>
              <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">23</div>
                <div className="text-sm text-slate-600 font-medium">Strategic Events</div>
                <div className="text-xs text-slate-500 mt-1">Next 30 Days</div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Monitor */}
          <Card className="ai-border">
            <CardHeader className="bg-slate-50 border-b border-slate-200">
              <CardTitle className="text-lg flex items-center gap-3 text-slate-800">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                Executive Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                    <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">Email Sent</div>
                  <div className="text-xs text-slate-600">Sarah Chen • Kleiner Perkins</div>
                </div>
                <div className="text-xs text-slate-500">2h</div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">Meeting Scheduled</div>
                  <div className="text-xs text-slate-600">Alex Kim • Coffee Meeting</div>
                </div>
                <div className="text-xs text-slate-500">4h</div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <polygon points="10,8 16,12 10,16" fill="currentColor"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">Event Preparation</div>
                  <div className="text-xs text-slate-600">Primary VC Demo Day</div>
                </div>
                <div className="text-xs text-slate-500">6h</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Professional Email Draft Modal */}
      <Dialog open={showEmailDraft} onOpenChange={setShowEmailDraft}>
        <DialogContent className="bg-white border-slate-200 max-w-4xl max-h-[80vh] ai-border">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              AI-Generated Strategic Outreach
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Review and customize your professional communication before deployment
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto max-h-[50vh] pr-2">
            {emailDraftData && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email-recipient" className="text-sm font-medium text-slate-700">
                    To:
                  </Label>
                  <Input
                    id="email-recipient"
                    value={emailDraftData.recipient}
                    onChange={(e) => setEmailDraftData({
                      ...emailDraftData,
                      recipient: e.target.value
                    })}
                    className="mt-1 border-slate-300 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email-subject" className="text-sm font-medium text-slate-700">
                    Subject:
                  </Label>
                  <Input
                    id="email-subject"
                    value={emailDraftData.subject}
                    onChange={(e) => setEmailDraftData({
                      ...emailDraftData,
                      subject: e.target.value
                    })}
                    className="mt-1 border-slate-300 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email-content" className="text-sm font-medium text-slate-700">
                    Message:
                  </Label>
                  <Textarea
                    id="email-content"
                    value={emailDraftData.content}
                    onChange={(e) => setEmailDraftData({
                      ...emailDraftData,
                      content: e.target.value
                    })}
                    rows={16}
                    className="mt-1 font-mono text-sm border-slate-300 focus:border-blue-500 resize-none"
                  />
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 1V23" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
                      <path d="M1 12H23" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
                    </svg>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-blue-800">AI Optimization Active</div>
                    <div className="text-blue-700">
                      Content optimized based on relationship context and strategic objectives
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowEmailDraft(false)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                <path d="M19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H11L19 11V19A2 2 0 0 1 19 21Z" stroke="currentColor" strokeWidth="2"/>
                <polyline points="17,21 17,13 7,13 7,21" stroke="currentColor" strokeWidth="2"/>
                <polyline points="7,3 7,8 15,8" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Save Draft
            </Button>
            <Button 
              onClick={() => {
                // Simulate sending email
                alert('Email deployed successfully! Professional outreach completed.')
                setShowEmailDraft(false)
                
                // Add to recent activity
                const newMessage = {
                  id: Date.now().toString(),
                  type: 'assistant' as const,
                  content: `Strategic outreach completed to ${emailDraftData?.recipient}. Email delivery confirmed and activity logged in your executive intelligence system.`,
                  timestamp: new Date()
                }
                setMessages(prev => [...prev, newMessage])
                
                // Scroll to show the confirmation message
                setTimeout(() => {
                  scrollToBottom()
                }, 200)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white ai-glow-subtle"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2"/>
                <polygon points="22,2 15,22 11,13 2,9" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
              </svg>
              Deploy Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
