'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ProfileData {
  company_name: string
  industry: string
  stage: string
  location: string
  description: string
  funding_target: string
  website: string
}

interface ProfileEditFormProps {
  isEditing: boolean
  formData: ProfileData
  onFormChange: (data: ProfileData) => void
  onSubmit: (data: ProfileData) => void
  isUpdating?: boolean
}

export function ProfileEditForm({
  isEditing,
  formData,
  onFormChange,
  onSubmit,
  isUpdating = false
}: ProfileEditFormProps) {
  const [localFormData, setLocalFormData] = useState<ProfileData>(formData)

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    const updatedData = { ...localFormData, [field]: value }
    setLocalFormData(updatedData)
    onFormChange(updatedData)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(localFormData)
  }

  if (!isEditing) {
    // Display mode
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Company Name</Label>
            <div className="mt-1 text-sm text-gray-900">{formData.company_name}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Industry</Label>
            <div className="mt-1 text-sm text-gray-900">{formData.industry}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Stage</Label>
            <div className="mt-1 text-sm text-gray-900">{formData.stage}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Location</Label>
            <div className="mt-1 text-sm text-gray-900">{formData.location}</div>
          </div>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700">Description</Label>
          <div className="mt-1 text-sm text-gray-900 leading-relaxed">{formData.description}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Funding Target</Label>
            <div className="mt-1 text-sm text-gray-900">{formData.funding_target}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Website</Label>
            <div className="mt-1">
              <a 
                href={formData.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {formData.website}
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Edit mode
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company_name" className="text-sm font-medium text-gray-700">
            Company Name *
          </Label>
          <Input
            id="company_name"
            type="text"
            value={localFormData.company_name}
            onChange={(e) => handleInputChange('company_name', e.target.value)}
            required
            className="mt-1"
            placeholder="Your company name"
          />
        </div>
        <div>
          <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
            Industry *
          </Label>
          <Input
            id="industry"
            type="text"
            value={localFormData.industry}
            onChange={(e) => handleInputChange('industry', e.target.value)}
            required
            className="mt-1"
            placeholder="e.g., B2B SaaS - Marketplace"
          />
        </div>
        <div>
          <Label htmlFor="stage" className="text-sm font-medium text-gray-700">
            Stage *
          </Label>
          <Input
            id="stage"
            type="text"
            value={localFormData.stage}
            onChange={(e) => handleInputChange('stage', e.target.value)}
            required
            className="mt-1"
            placeholder="e.g., Seed, Series A"
          />
        </div>
        <div>
          <Label htmlFor="location" className="text-sm font-medium text-gray-700">
            Location *
          </Label>
          <Input
            id="location"
            type="text"
            value={localFormData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            required
            className="mt-1"
            placeholder="e.g., San Francisco, CA"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description" className="text-sm font-medium text-gray-700">
          Description *
        </Label>
        <Textarea
          id="description"
          value={localFormData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          required
          rows={4}
          className="mt-1"
          placeholder="Describe your company, mission, and what you do..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="funding_target" className="text-sm font-medium text-gray-700">
            Funding Target *
          </Label>
          <Input
            id="funding_target"
            type="text"
            value={localFormData.funding_target}
            onChange={(e) => handleInputChange('funding_target', e.target.value)}
            required
            className="mt-1"
            placeholder="e.g., $2,000,000"
          />
        </div>
        <div>
          <Label htmlFor="website" className="text-sm font-medium text-gray-700">
            Website *
          </Label>
          <Input
            id="website"
            type="url"
            value={localFormData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            required
            className="mt-1"
            placeholder="https://yourcompany.com"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isUpdating}
          className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? 'Updating...' : 'Save Changes & Create Update'}
        </Button>
      </div>
    </form>
  )
}
