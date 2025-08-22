'use client'

import { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/trpc/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const colorMap = {
  blue: '#3B82F6',
  green: '#10B981',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  red: '#EF4444',
  gray: '#6B7280',
}

function SignupContent() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
  })
  const [linkData, setLinkData] = useState<{
    welcomeMessage: string
    backgroundColor: string
    targetRole: 'investor' | 'founder'
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()
  const referralId = searchParams.get('ref')

  const getReferralLinkQuery = api.admin.getReferralLink.useQuery(
    { linkId: referralId! },
    { enabled: !!referralId }
  )

  useEffect(() => {
    if (!referralId) {
      // No referral link, show generic signup
      setIsLoading(false)
      return
    }

    if (getReferralLinkQuery.data) {
      setLinkData({
        welcomeMessage: getReferralLinkQuery.data.welcomeMessage,
        backgroundColor: getReferralLinkQuery.data.backgroundColor,
        targetRole: getReferralLinkQuery.data.targetRole,
      })
      setIsLoading(false)
    } else if (getReferralLinkQuery.error) {
      setError('This referral link is invalid or has expired.')
      setIsLoading(false)
    }
  }, [referralId, getReferralLinkQuery.data, getReferralLinkQuery.error])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      // Complete signup - redirect to appropriate dashboard
      const role = linkData?.targetRole || 'founder'
      const sessionToken = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('temp-session', sessionToken)
      localStorage.setItem('temp-role', role)
      
      if (role === 'investor') {
        router.push('/dashboard/investor')
      } else {
        router.push('/dashboard/founder')
      }
    }
  }

  const handleSkip = () => {
    const role = linkData?.targetRole || 'founder'
    const sessionToken = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('temp-session', sessionToken)
    localStorage.setItem('temp-role', role)
    
    if (role === 'investor') {
      router.push('/dashboard/investor')
    } else {
      router.push('/dashboard/founder')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/">
              <Button>Return to Homepage</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const backgroundColor = linkData ? colorMap[linkData.backgroundColor as keyof typeof colorMap] : '#3B82F6'
  const isCustomReferral = !!linkData
  const targetRole = linkData?.targetRole || 'founder'

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: isCustomReferral ? backgroundColor : '#f9fafb' }}
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {isCustomReferral && (
            <div className="bg-white bg-opacity-90 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Snowball!
              </h2>
              <p className="text-gray-700 mb-4">
                {linkData.welcomeMessage}
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-opacity-20 bg-gray-900 text-gray-900">
                {targetRole === 'investor' ? '🏦 Investor' : '🚀 Founder'} Signup
              </div>
            </div>
          )}
          
          {!isCustomReferral && (
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Join Snowball
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Connect with your tribe and grow your network
              </p>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-8">
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Step {step} of 3</span>
              <span className="text-sm text-gray-500">{Math.round((step / 3) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          <div className="space-y-4">
            {step === 1 && (
              <>
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="John"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Doe"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                    className="mt-1"
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="text-lg font-medium text-gray-900">
                  {targetRole === 'investor' ? 'Investment Details' : 'Company Information'}
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {targetRole === 'investor' ? 'Investment Firm / Organization' : 'Company Name'}
                  </label>
                  <Input
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder={targetRole === 'investor' ? 'Sequoia Capital' : 'Acme Corp'}
                    className="mt-1"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  <p>{targetRole === 'investor' 
                    ? 'Tell us about your investment background and interests.'
                    : 'What stage is your startup in? We\'ll help you connect with the right investors.'
                  }</p>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="text-lg font-medium text-gray-900">Almost Done!</h3>
                <div className="text-center py-4">
                  <div className="text-green-500 mb-4">
                    <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">
                    Ready to explore your {targetRole === 'investor' ? 'deal flow' : 'investor connections'}?
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleSkip}
              className="text-gray-600"
            >
              Skip for now
            </Button>
            <Button onClick={handleNext}>
              {step === 3 ? 'Complete Signup' : 'Next'}
            </Button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              This is a prototype - no real account will be created
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
