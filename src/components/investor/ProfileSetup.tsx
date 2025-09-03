'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/trpc/client'

interface ProfileSetupProps {
  onComplete: () => void
}

const STAGE_OPTIONS = [
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C+',
  'Growth',
]

const INDUSTRY_OPTIONS = [
  'Enterprise Software',
  'Consumer',
  'FinTech',
  'HealthTech',
  'CleanTech',
  'EdTech',
  'AI/ML',
  'Cybersecurity',
  'DevTools',
  'E-commerce',
  'Marketplace',
  'Hardware',
  'Biotech',
  'Real Estate',
  'Transportation',
]

const GEOGRAPHY_OPTIONS = [
  'San Francisco Bay Area',
  'New York',
  'Los Angeles',
  'Boston',
  'Seattle',
  'Austin',
  'Chicago',
  'Miami',
  'Denver',
  'United States',
  'North America',
  'Europe',
  'Asia',
  'Global',
]

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedGeographies, setSelectedGeographies] = useState<string[]>([])
  const [checkSizeMin, setCheckSizeMin] = useState('')
  const [checkSizeMax, setCheckSizeMax] = useState('')
  const [bio, setBio] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [error, setError] = useState('')

  const updateProfile = api.investor.updateProfile.useMutation({
    onSuccess: () => {
      onComplete()
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const toggleSelection = (item: string, selected: string[], setSelected: (items: string[]) => void) => {
    if (selected.includes(item)) {
      setSelected(selected.filter(i => i !== item))
    } else {
      setSelected([...selected, item])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (selectedStages.length === 0) {
      setError('Please select at least one investment stage')
      return
    }

    if (selectedIndustries.length === 0) {
      setError('Please select at least one industry')
      return
    }

    if (selectedGeographies.length === 0) {
      setError('Please select at least one geography')
      return
    }

    const minCheck = checkSizeMin ? parseInt(checkSizeMin.replace(/,/g, '')) : undefined
    const maxCheck = checkSizeMax ? parseInt(checkSizeMax.replace(/,/g, '')) : undefined

    if (minCheck && maxCheck && minCheck > maxCheck) {
      setError('Minimum check size cannot be greater than maximum check size')
      return
    }

    updateProfile.mutate({
      preferred_stages: selectedStages,
      industries: selectedIndustries,
      geographies: selectedGeographies,
      check_size_min: minCheck,
      check_size_max: maxCheck,
      bio: bio.trim() || undefined,
      linkedin_url: linkedinUrl.trim() || undefined,
    })
  }

  const formatNumber = (value: string) => {
    const num = value.replace(/,/g, '')
    if (isNaN(Number(num))) return value
    return Number(num).toLocaleString()
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl">Complete Your Investor Profile</CardTitle>
          <CardDescription className="text-base md:text-lg">
            Help us curate the best deal flow for your investment criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Investment Stages */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Investment Stages *</Label>
              <p className="text-sm text-gray-600">Select the stages you typically invest in</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {STAGE_OPTIONS.map((stage) => (
                  <Badge
                    key={stage}
                    variant={selectedStages.includes(stage) ? 'default' : 'outline'}
                    className="cursor-pointer justify-center py-2 text-sm"
                    onClick={() => toggleSelection(stage, selectedStages, setSelectedStages)}
                  >
                    {stage}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Industries */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Industries of Interest *</Label>
              <p className="text-sm text-gray-600">Select industries you focus on</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {INDUSTRY_OPTIONS.map((industry) => (
                  <Badge
                    key={industry}
                    variant={selectedIndustries.includes(industry) ? 'default' : 'outline'}
                    className="cursor-pointer justify-center py-2 text-sm"
                    onClick={() => toggleSelection(industry, selectedIndustries, setSelectedIndustries)}
                  >
                    {industry}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Geographies */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Geographic Focus *</Label>
              <p className="text-sm text-gray-600">Select regions you invest in</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {GEOGRAPHY_OPTIONS.map((geography) => (
                  <Badge
                    key={geography}
                    variant={selectedGeographies.includes(geography) ? 'default' : 'outline'}
                    className="cursor-pointer justify-center py-2 text-sm"
                    onClick={() => toggleSelection(geography, selectedGeographies, setSelectedGeographies)}
                  >
                    {geography}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Check Size */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Check Size Range (USD)</Label>
              <p className="text-sm text-gray-600">Your typical investment range (optional)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkMin" className="text-sm">Minimum Check Size</Label>
                  <Input
                    id="checkMin"
                    placeholder="e.g., 25,000"
                    value={checkSizeMin}
                    onChange={(e) => setCheckSizeMin(formatNumber(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="checkMax" className="text-sm">Maximum Check Size</Label>
                  <Input
                    id="checkMax"
                    placeholder="e.g., 250,000"
                    value={checkSizeMax}
                    onChange={(e) => setCheckSizeMax(formatNumber(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-3">
              <Label htmlFor="bio" className="text-base font-semibold">Bio</Label>
              <p className="text-sm text-gray-600">Brief description of your investment background (optional)</p>
              <Textarea
                id="bio"
                placeholder="e.g., Former founder with 2 exits, now investing in early-stage SaaS..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-gray-500">{bio.length}/500 characters</p>
            </div>

            {/* LinkedIn */}
            <div className="space-y-3">
              <Label htmlFor="linkedin" className="text-base font-semibold">LinkedIn Profile</Label>
              <p className="text-sm text-gray-600">Your LinkedIn profile URL (optional)</p>
              <Input
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>

            {/* Submit */}
            <div className="pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full py-3 text-base md:w-auto md:px-8"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? 'Setting Up Profile...' : 'Complete Profile'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
