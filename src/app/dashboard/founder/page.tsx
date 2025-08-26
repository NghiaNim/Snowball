'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { useTemplateCustomizations } from '@/hooks/useTemplateCustomizations'

// Sample investor interest data
const sampleInvestors = [
  {
    id: 1,
    name: 'Sarah Chen',
    firm: 'Sequoia Capital',
    title: 'Principal',
    avatar: '👩‍💼',
    interests: ['Enterprise Software', 'AI/ML'],
    checkSize: '$1-5M',
    status: 'knocked' as const,
    message: 'Interested in learning more about your AI platform. Would love to schedule a call.',
    tribe: 'Stanford Alumni',
    activity: 'Viewed your profile 3 times'
  },
  {
    id: 2,
    name: 'Michael Rodriguez',
    firm: 'Andreessen Horowitz',
    title: 'Partner',
    avatar: '👨‍💼',
    interests: ['B2B SaaS', 'Enterprise'],
    checkSize: '$2-10M',
    status: 'tracking' as const,
    tribe: 'Y Combinator',
    activity: 'Downloaded your pitch deck'
  },
  {
    id: 3,
    name: 'Emily Watson',
    firm: 'Founders Fund',
    title: 'Senior Associate',
    avatar: '👩‍💻',
    interests: ['Deep Tech', 'AI'],
    checkSize: '$500K-3M',
    status: 'interested' as const,
    tribe: 'MIT Network',
    activity: 'Shared your profile internally'
  }
]

const statusConfig = {
  tracking: { color: 'blue', label: 'Tracking', icon: '👀' },
  interested: { color: 'yellow', label: 'Interested', icon: '⭐' },
  knocked: { color: 'green', label: 'Meeting Requested', icon: '🚪' },
  met: { color: 'purple', label: 'Meeting Completed', icon: '✅' }
}

export default function FounderDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [profileComplete] = useState(65)

  const router = useRouter()
  const customizations = useTemplateCustomizations('founder')

  useEffect(() => {
    const session = localStorage.getItem('temp-session')
    const role = localStorage.getItem('temp-role')
    if (!session || role !== 'founder') {
      router.push('/')
      return
    }
    setIsAuthenticated(true)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('temp-session')
    localStorage.removeItem('temp-role')
    router.push('/')
  }

  const respondToKnock = (investorName: string, action: 'accept' | 'decline') => {
    alert(`${action === 'accept' ? 'Accepted' : 'Declined'} meeting request from ${investorName}! 📅\n\nThis is a demo - no real response was sent.`)
  }

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 
                className="text-2xl font-bold"
                style={{ color: customizations.styling?.primaryColor || '#1F2937' }}
              >
                {customizations.header?.title || 'Founder Dashboard'}
              </h1>
              <p className="text-sm text-gray-600">{customizations.header?.subtitle || 'TechFlow AI • Series A Fundraising'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                👤 Demo Founder
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
              { key: 'overview', label: customizations.content?.tabLabels?.overview || 'Overview' },
              { key: 'monthly-updates', label: customizations.content?.tabLabels?.monthlyUpdates || 'Monthly Updates' },
              { key: 'investors', label: customizations.content?.tabLabels?.investors || 'Investors' },
              { key: 'profile', label: customizations.content?.tabLabels?.profile || 'Profile' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab.key
                    ? 'text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                style={activeTab === tab.key ? { borderColor: customizations.styling?.primaryColor || '#3B82F6', color: customizations.styling?.primaryColor || '#3B82F6' } : {}}
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
            {/* Fundraising Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Fundraising Status</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">🔴</span>
                  <span className="text-sm font-medium text-gray-700">Closing Soon</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">$5M</div>
                  <div className="text-sm text-gray-600">Target</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">$3.2M</div>
                  <div className="text-sm text-gray-600">Committed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">12</div>
                  <div className="text-sm text-gray-600">Interested Investors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">5</div>
                  <div className="text-sm text-gray-600">Meeting Requests</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress: 64% Complete</span>
                  <span className="text-sm text-gray-600">$1.8M remaining</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '64%' }}></div>
                </div>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Completion</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-500">✅</span>
                    <span className="text-sm">Company Information</span>
                  </div>
                  <span className="text-sm text-gray-600">Complete</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-500">✅</span>
                    <span className="text-sm">Pitch Deck Upload</span>
                  </div>
                  <span className="text-sm text-gray-600">Complete</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-yellow-500">⏳</span>
                    <span className="text-sm">Traction Metrics</span>
                  </div>
                  <Button size="sm" variant="outline">Update</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400">⭕</span>
                    <span className="text-sm">Team Photos</span>
                  </div>
                  <Button size="sm" variant="outline">Add</Button>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{profileComplete}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${profileComplete}%` }}></div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-500">👀</span>
                  <div className="flex-1">
                    <p className="text-sm">Sarah Chen from Sequoia Capital viewed your profile</p>
                    <p className="text-xs text-gray-600">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-green-500">🚪</span>
                  <div className="flex-1">
                    <p className="text-sm">New meeting request from Michael Rodriguez</p>
                    <p className="text-xs text-gray-600">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <span className="text-yellow-500">⭐</span>
                  <div className="flex-1">
                    <p className="text-sm">Emily Watson marked your company as interested</p>
                    <p className="text-xs text-gray-600">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monthly-updates' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">{customizations.content?.tabLabels?.monthlyUpdates || 'Monthly Updates'}</h2>
                <Button 
                  size="sm"
                  style={{ backgroundColor: customizations.styling?.primaryColor || '#10B981' }}
                  className="text-white"
                >
                  {customizations.content?.monthlyUpdateTexts?.addUpdateButton || '+ Add Update'}
                </Button>
              </div>

              {/* Sample Monthly Updates */}
              <div className="space-y-6">
                {/* December 2024 Update */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">December 2024 Progress</h3>
                      <p className="text-sm text-gray-600">Posted 2 days ago</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Series A • 🔴 Closing Soon</span>
                    </div>
                  </div>

                  {/* Headline Metrics */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Headline Metrics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-blue-600">$140K</div>
                        <div className="text-xs text-gray-600">MRR</div>
                        <div className="text-xs text-green-600">+12% MoM</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-green-600">+45%</div>
                        <div className="text-xs text-gray-600">Growth Rate</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-purple-600">15K</div>
                        <div className="text-xs text-gray-600">Active Users</div>
                        <div className="text-xs text-green-600">+20% MoM</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-yellow-600">94%</div>
                        <div className="text-xs text-gray-600">Retention</div>
                      </div>
                    </div>
                  </div>

                  {/* Key Wins */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">🎉 Key Wins</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-sm">Closed partnership with Microsoft for enterprise distribution</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-sm">Hired VP of Sales (ex-Salesforce) to scale go-to-market</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-sm">Launched AI-powered automation features - 40% increase in user engagement</span>
                      </li>
                    </ul>
                  </div>

                  {/* Challenges/Asks */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">🤝 Challenges & Asks</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span className="text-sm">Looking for enterprise security expert for advisor role</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span className="text-sm">Seeking warm intros to Fortune 500 CTOs for pilot programs</span>
                      </li>
                    </ul>
                  </div>

                  {/* Interaction Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600">
                        <span>👍</span>
                        <span>8 likes</span>
                      </button>
                      <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600">
                        <span>💬</span>
                        <span>3 comments</span>
                      </button>
                      <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600">
                        <span>📩</span>
                        <span>2 DMs</span>
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Viewed by Sarah Chen, Michael Rodriguez, Emily Watson +5 others
                    </div>
                  </div>
                </div>

                {/* November 2024 Update */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">November 2024 Progress</h3>
                      <p className="text-sm text-gray-600">Posted 1 month ago</p>
                    </div>
                  </div>

                  {/* Headline Metrics */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Headline Metrics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-blue-600">$125K</div>
                        <div className="text-xs text-gray-600">MRR</div>
                        <div className="text-xs text-green-600">+15% MoM</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-green-600">+40%</div>
                        <div className="text-xs text-gray-600">Growth Rate</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-purple-600">12.5K</div>
                        <div className="text-xs text-gray-600">Active Users</div>
                        <div className="text-xs text-green-600">+25% MoM</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-yellow-600">92%</div>
                        <div className="text-xs text-gray-600">Retention</div>
                      </div>
                    </div>
                  </div>

                  {/* Key Wins */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">🎉 Key Wins</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-sm">Product launch featured in TechCrunch and Forbes</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-sm">Signed 5 new enterprise customers (avg deal size $50K)</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-sm">Completed SOC 2 Type II certification</span>
                      </li>
                    </ul>
                  </div>

                  {/* Interaction Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600">
                        <span>👍</span>
                        <span>12 likes</span>
                      </button>
                      <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600">
                        <span>💬</span>
                        <span>5 comments</span>
                      </button>
                      <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600">
                        <span>📩</span>
                        <span>4 DMs</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'investors' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">{customizations.content?.investorsTexts?.interestTitle || 'Investor Interest'}</h2>
                <div className="text-sm text-gray-600">
                  {sampleInvestors.length} {customizations.content?.investorsTexts?.trackingText || 'investors tracking your company'}
                </div>
              </div>

              <div className="space-y-4">
                {sampleInvestors.map((investor) => (
                  <div key={investor.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">{investor.avatar}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{investor.name}</h3>
                          <p className="text-sm text-gray-600">{investor.title} at {investor.firm}</p>
                          <p className="text-xs text-gray-500">{investor.tribe}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{statusConfig[investor.status].icon}</span>
                        <span className="text-sm font-medium text-gray-700">
                          {statusConfig[investor.status].label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Focus Areas:</span>
                        <div className="font-medium">{investor.interests.join(', ')}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Check Size:</span>
                        <div className="font-medium">{investor.checkSize}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Recent Activity:</span>
                        <div className="font-medium text-blue-600">{investor.activity}</div>
                      </div>
                    </div>

                    {investor.status === 'knocked' && investor.message && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Message:</strong> {investor.message}
                        </p>
                        <div className="mt-3 flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => respondToKnock(investor.name, 'accept')}
                            style={{ backgroundColor: customizations.styling?.primaryColor || '#10B981' }}
                            className="text-white"
                          >
                            {customizations.content?.investorsTexts?.acceptMeetingText || 'Accept Meeting'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => respondToKnock(investor.name, 'decline')}
                          >
                            {customizations.content?.investorsTexts?.declineMeetingText || 'Decline'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <Input value="TechFlow AI" readOnly className="mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Industry</label>
                  <Input value="Enterprise Software" readOnly className="mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fundraising Stage</label>
                  <Input value="Series A" readOnly className="mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    rows={3}
                    value="AI-powered workflow automation platform that helps enterprise teams streamline their operations and increase productivity by 40%."
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Funding Target</label>
                    <Input value="$5,000,000" readOnly className="mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <Input value="San Francisco, CA" readOnly className="mt-1" />
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button variant="outline" disabled>
                  Edit Profile (Demo Mode)
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Traction Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">$125K</div>
                  <div className="text-sm text-gray-600">Monthly Recurring Revenue</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">+40%</div>
                  <div className="text-sm text-gray-600">Month-over-Month Growth</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">50+</div>
                  <div className="text-sm text-gray-600">Enterprise Customers</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Notice */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-green-500">ℹ️</span>
            <div>
              <p className="text-sm text-green-700">
                <strong>Demo Mode:</strong> This is sample data showcasing the founder experience. 
                All investor data and metrics are fictional for demonstration purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
