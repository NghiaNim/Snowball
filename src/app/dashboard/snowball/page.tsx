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
// import Link from 'next/link' // Unused import
import Image from 'next/image'

// Types for updates
type UpdateType = 'major' | 'minor' | 'coolsies'

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

// Sample tracking investors
const trackingInvestors = [
  {
    id: 1,
    name: 'Sarah Chen',
    firm: 'Sequoia Capital',
    email: 'sarah@sequoia.com',
    avatar: '👩‍💼',
    tribe: 'Stanford Alumni'
  },
  {
    id: 2,
    name: 'Michael Rodriguez',
    firm: 'Andreessen Horowitz',
    email: 'michael@a16z.com',
    avatar: '👨‍💼',
    tribe: 'Y Combinator'
  },
  {
    id: 3,
    name: 'Emily Watson',
    firm: 'Founders Fund',
    email: 'emily@foundersfund.com',
    avatar: '👩‍💻',
    tribe: 'MIT Network'
  }
]

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
  const [updates, setUpdates] = useState<Update[]>([])
  const [showCreateUpdate, setShowCreateUpdate] = useState(false)
  const [createUpdateType, setCreateUpdateType] = useState<UpdateType>('major')
  const [deckFile, setDeckFile] = useState<File | null>(null)
  const [deckUrl, setDeckUrl] = useState<string | null>(null)
  const [deckPublicUrl, setDeckPublicUrl] = useState<string | null>(null)
  const [uploadingDeck, setUploadingDeck] = useState(false)

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

    // Load sample updates
    const sampleUpdates: Update[] = [
      {
        id: '1',
        type: 'major',
        title: 'December 2024 Investor Update',
        content: 'Major progress this month with significant traction growth...',
        metrics: {
          mrr: 140000,
          growth: 12,
          users: 15000,
          retention: 94
        },
        createdAt: new Date('2024-12-15'),
        emailSent: true
      },
      {
        id: '2',
        type: 'minor',
        title: 'Product Feature Launch',
        content: 'Just launched our new AI-powered automation features. Early user feedback is very positive!',
        createdAt: new Date('2024-12-10')
      },
      {
        id: '3',
        type: 'coolsies',
        content: 'Great meeting with Microsoft partnership team today. Exciting opportunities ahead! 🚀',
        createdAt: new Date('2024-12-08')
      }
    ]
    setUpdates(sampleUpdates)

    // Load existing deck data
    const savedDeckPublicUrl = localStorage.getItem('snowball-deck-url')
    const savedDeckName = localStorage.getItem('snowball-deck-name')
    const savedDeckFilePath = localStorage.getItem('snowball-deck-file-path')
    if (savedDeckPublicUrl && savedDeckName && savedDeckFilePath) {
      setDeckPublicUrl(savedDeckPublicUrl)
      setDeckUrl(savedDeckFilePath) // Use the GCS file path
      // Create a fake file object for display
      const fakeFile = new File([''], savedDeckName, { type: 'application/pdf' })
      setDeckFile(fakeFile)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('snowball-auth')
    localStorage.removeItem('snowball-login-time')
    router.push('/')
  }

  const handleCreateUpdate = async (updateData: Partial<Update>) => {
    const newUpdate: Update = {
      id: Date.now().toString(),
      type: createUpdateType,
      title: updateData.title,
      content: updateData.content || '',
      metrics: updateData.metrics,
      createdAt: new Date(),
      emailSent: false // Will be updated after email sending
    }

    setUpdates([newUpdate, ...updates])
    setShowCreateUpdate(false)

    // Send email for major updates
    if (createUpdateType === 'major') {
      try {
        const emailData = {
          to: trackingInvestors.map(investor => investor.email),
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
          // Update the update to mark email as sent
          setUpdates(prev => prev.map(update => 
            update.id === newUpdate.id 
              ? { ...update, emailSent: true }
              : update
          ))
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
  }

  const handleDeckUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingDeck(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-deck', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setDeckFile(file)
        setDeckUrl(result.url)
        setDeckPublicUrl(result.publicUrl)
        
        // Save to localStorage for persistence in demo
        localStorage.setItem('snowball-deck-url', result.publicUrl)
        localStorage.setItem('snowball-deck-name', file.name)
        localStorage.setItem('snowball-deck-file-path', result.url) // Store the GCS file path
        
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
          <div className="flex justify-between items-center py-6">
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
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'updates', label: 'Updates' },
              { key: 'investors', label: 'Tracking Investors' },
              { key: 'deck', label: 'Pitch Deck' },
              { key: 'profile', label: 'Company Profile' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
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
                    {deckFile ? 'Uploaded' : 'Pending'}
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
                      navigator.clipboard.writeText('https://snowball.com/track/snowball')
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
                          {update.createdAt.toLocaleDateString()} • {updateTypeConfig[update.type].label}
                        </p>
                      </div>
                      {update.emailSent && (
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
                            {update.createdAt.toLocaleDateString()} • {update.createdAt.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {updateTypeConfig[update.type].label}
                        </Badge>
                        {update.emailSent && (
                          <Badge variant="outline" className="text-green-600">
                            📧 Emailed to {trackingInvestors.length} investors
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="prose max-w-none">
                      <p className="text-gray-700">{update.content}</p>
                    </div>

                    {update.metrics && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-blue-600">${update.metrics.mrr / 1000}K</div>
                          <div className="text-xs text-gray-600">MRR</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-green-600">+{update.metrics.growth}%</div>
                          <div className="text-xs text-gray-600">Growth</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-purple-600">{update.metrics.users}</div>
                          <div className="text-xs text-gray-600">Users</div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-yellow-600">{update.metrics.retention}%</div>
                          <div className="text-xs text-gray-600">Retention</div>
                        </div>
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
              {trackingInvestors.map((investor) => (
                <Card key={investor.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="text-3xl">{investor.avatar}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{investor.name}</h3>
                        <p className="text-sm text-gray-600">{investor.firm}</p>
                        <p className="text-xs text-gray-500">{investor.tribe}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>📧 {investor.email}</p>
                      <p className="mt-2 text-green-600">✅ Receiving major updates</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
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

                  {(deckPublicUrl || deckUrl) && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Current Deck</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        This is what investors will see when they view your deck.
                      </p>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={async () => {
                            if (deckUrl) {
                              try {
                                // Get fresh signed URL
                                const response = await fetch(`/api/get-deck-url?file=${encodeURIComponent(deckUrl)}`)
                                const result = await response.json()
                                
                                if (result.success) {
                                  window.open(result.publicUrl, '_blank')
                                } else {
                                  alert('Failed to access deck. Please try again.')
                                }
                              } catch (error) {
                                console.error('Error getting deck URL:', error)
                                alert('Failed to access deck. Please try again.')
                              }
                            } else {
                              alert('Deck URL not available. Please re-upload.')
                            }
                          }}
                        >
                          📄 View Deck
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={async () => {
                            if (deckUrl) {
                              try {
                                // Get fresh signed URL for download
                                const response = await fetch(`/api/get-deck-url?file=${encodeURIComponent(deckUrl)}`)
                                const result = await response.json()
                                
                                if (result.success) {
                                  const link = document.createElement('a')
                                  link.href = result.publicUrl
                                  link.download = deckFile?.name || 'snowball-deck'
                                  link.click()
                                } else {
                                  alert('Failed to download deck. Please try again.')
                                }
                              } catch (error) {
                                console.error('Error getting deck URL:', error)
                                alert('Failed to download deck. Please try again.')
                              }
                            } else {
                              alert('Download not available. Please re-upload.')
                            }
                          }}
                        >
                          📥 Download
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
            <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Snowball Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input value="Snowball" readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label>Industry</Label>
                    <Input value="B2B SaaS - Marketplace" readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label>Stage</Label>
                    <Input value="Seed" readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input value="San Francisco, CA" readOnly className="mt-1" />
                  </div>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea
                    className="mt-1"
                    rows={3}
                    value="Two-sided marketplace connecting early-stage startups with investors through tribe-based networking. Leveraging communities built around accelerators, universities, and companies for high-quality deal flow."
                    readOnly
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Funding Target</Label>
                    <Input value="$2,000,000" readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input value="https://joinsnowball.io" readOnly className="mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// Component for creating updates
function CreateUpdateForm({ 
  type, 
  onTypeChange, 
  onSubmit, 
  onCancel 
}: {
  type: UpdateType
  onTypeChange: (type: UpdateType) => void
  onSubmit: (data: Partial<Update>) => void
  onCancel: () => void
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
            📧 This major update will be automatically emailed to all {trackingInvestors.length} tracking investors
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {type === 'major' ? 'Create & Send Email' : 'Create Update'}
        </Button>
      </div>
    </form>
  )
}
