'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

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
              <h1 className="text-2xl font-bold text-gray-900">Founder Dashboard</h1>
              <p className="text-sm text-gray-600">TechFlow AI • Series A Fundraising</p>
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
            {['overview', 'investors', 'profile'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
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

        {activeTab === 'investors' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Investor Interest</h2>
                <div className="text-sm text-gray-600">
                  {sampleInvestors.length} investors tracking your company
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
                          >
                            Accept Meeting
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => respondToKnock(investor.name, 'decline')}
                          >
                            Decline
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
