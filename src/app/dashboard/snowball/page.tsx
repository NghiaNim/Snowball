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
}

interface TeamMember {
  name: string
  role: string
  bio: string
  profile_picture_url?: string
}

interface UpdateMetrics {
  mrr: number
  growth: number
  users: number
  retention: number
}

interface Update {
  id: string
  type: UpdateType
  title?: string
  content: string
  metrics?: UpdateMetrics
  createdAt: Date
  emailSent?: boolean
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
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [pendingProfileUpdate, setPendingProfileUpdate] = useState<ProfileData | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false)
  const [profileForm, setProfileForm] = useState({
    company_name: 'Snowball',
    industry: 'B2B SaaS - Marketplace',
    stage: 'Seed',
    location: 'San Francisco, CA',
    description: 'Two-sided marketplace connecting early-stage startups with investors through tribe-based networking. Leveraging communities built around accelerators, universities, and companies for high-quality deal flow.',
    funding_target: '$2,000,000',
    website: 'https://joinsnowball.io'
  })
  const [teamForm, setTeamForm] = useState([
    { name: 'Alex Johnson', role: 'Co-founder & CEO', bio: 'Former VP Product at Stripe. Stanford MBA.' },
    { name: 'Sarah Kim', role: 'Co-founder & CTO', bio: 'Ex-Google Staff Engineer. MIT Computer Science.' }
  ])

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
        website: currentProfile.website || 'https://joinsnowball.io'
      })
    }
  }, [currentProfile])

  // Update team data when team data is loaded
  useEffect(() => {
    if (currentTeam && currentTeam.length > 0) {
      setTeamForm(currentTeam.map(member => ({
        name: member.name,
        role: member.role,
        bio: member.bio || ''
      })))
    }
  }, [currentTeam])

  const handleLogout = () => {
    localStorage.removeItem('snowball-auth')
    localStorage.removeItem('snowball-login-time')
    router.push('/')
  }

  const handleCreateUpdate = async (updateData: Partial<Update>) => {
    try {
      await createUpdateMutation.mutateAsync({
        company_id: 'snowball-demo-user',
        title: updateData.title || '',
        content: updateData.content || '',
        type: createUpdateType,
        metrics: updateData.metrics ? updateData.metrics as unknown as Record<string, unknown> : undefined,
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
      
      // Generate human-readable team update message
      const teamNames = updatedTeam.map(member => member.name).join(', ')
      const teamCount = updatedTeam.length
      
      let updateContent = ''
      if (teamCount === 1) {
        updateContent = `We're excited to introduce our leadership: ${teamNames}. Our team brings extensive experience to drive Snowball's mission forward.`
      } else if (teamCount === 2) {
        updateContent = `Meet our founding team: ${teamNames}. Together, they bring deep expertise and experience to lead Snowball's growth.`
      } else {
        updateContent = `We've updated our team information! Our ${teamCount}-person leadership team includes ${teamNames}, bringing diverse expertise to drive our mission forward.`
      }
      
      // Create a major update about the team change
      await createUpdateMutation.mutateAsync({
        company_id: 'snowball-demo-user',
        title: 'Team Update',
        content: updateContent,
        type: 'major',
        metrics: undefined,
      })

      await Promise.all([refetchUpdates(), refetchTeam()])
      setIsEditingTeam(false)
      
      alert('Team information updated and investors have been notified!')
    } catch (error) {
      console.error('Error updating team:', error)
      alert('Failed to update team information. Please try again.')
    } finally {
      setIsUpdatingTeam(false)
    }
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
          <div className="py-4 md:py-6">
            {/* Mobile: Top row: Logo and company info */}
            <div className="flex items-center justify-between mb-3 md:mb-0 md:hidden">
              <div className="flex items-center min-w-0 flex-1 pr-2">
                <Image
                  src="/snowball.png"
                  alt="Snowball Logo"
                  width={28}
                  height={28}
                  className="mr-2 md:mr-3 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h1 className="text-base md:text-2xl font-bold text-gray-900 truncate">
                    Snowball Founder Dashboard
                  </h1>
                  <p className="text-xs md:text-sm text-gray-600 hidden sm:block">
                    Two-sided marketplace for startups & investors
                  </p>
                </div>
              </div>
              
              {/* Mobile: Stacked right side elements */}
              <div className="flex flex-col items-end space-y-1 md:hidden">
                <div className="flex items-center space-x-1">
                  <Badge variant="outline" className="text-green-600 border-green-600 text-xs px-2 py-0.5">
                    🟢 Active
                  </Badge>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs px-2 py-1">
                    Logout
                  </Button>
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
                  <p className="text-sm text-gray-600">Two-sided marketplace for startups & investors</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  🟢 Active Fundraising
                </Badge>
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
                      </div>
                    </div>
                    
                    <div className="prose max-w-none">
                      <p className="text-gray-700">{update.content}</p>
                    </div>

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
                    ⚠️ Editing team information will send a major update to all tracking investors
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
  onSubmit: (data: Partial<Update>) => void
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const updateData: Partial<Update> = {
      title: type !== 'coolsies' ? title : undefined,
      content,
      metrics: type === 'major' ? {
        mrr: parseInt(metrics.mrr) || 0,
        growth: parseInt(metrics.growth) || 0,
        users: parseInt(metrics.users) || 0,
        retention: parseInt(metrics.retention) || 0
      } : undefined
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
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="mrr" className="text-sm">MRR ($)</Label>
              <Input
                id="mrr"
                type="number"
                value={metrics.mrr}
                onChange={(e) => setMetrics({ ...metrics, mrr: e.target.value })}
                placeholder="140000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="growth" className="text-sm">Growth (%)</Label>
              <Input
                id="growth"
                type="number"
                value={metrics.growth}
                onChange={(e) => setMetrics({ ...metrics, growth: e.target.value })}
                placeholder="12"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="users" className="text-sm">Active Users</Label>
              <Input
                id="users"
                type="number"
                value={metrics.users}
                onChange={(e) => setMetrics({ ...metrics, users: e.target.value })}
                placeholder="15000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="retention" className="text-sm">Retention (%)</Label>
              <Input
                id="retention"
                type="number"
                value={metrics.retention}
                onChange={(e) => setMetrics({ ...metrics, retention: e.target.value })}
                placeholder="94"
                className="mt-1"
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
