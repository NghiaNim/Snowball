'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'

interface TeamMember {
  name: string
  role: string
  bio: string
  profile_picture_url?: string
  linkedin_url?: string
  email?: string
}

interface TeamEditFormProps {
  isEditing: boolean
  teamData: TeamMember[]
  onTeamChange: (data: TeamMember[]) => void
  onSubmit: (data: TeamMember[]) => void
  isUpdating?: boolean
  userId?: string
}

export function TeamEditForm({
  isEditing,
  teamData,
  onTeamChange,
  onSubmit,
  isUpdating = false,
  userId = 'snowball-demo-user'
}: TeamEditFormProps) {
  const [localTeamData, setLocalTeamData] = useState<TeamMember[]>(teamData)
  const [uploadingImages, setUploadingImages] = useState<{ [key: number]: boolean }>({})
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const updatedTeam = [...localTeamData]
    updatedTeam[index] = { ...updatedTeam[index], [field]: value }
    setLocalTeamData(updatedTeam)
    onTeamChange(updatedTeam)
  }

  const addMember = () => {
    const newMember: TeamMember = { 
      name: '', 
      role: '', 
      bio: '', 
      profile_picture_url: '',
      linkedin_url: '',
      email: ''
    }
    const updatedTeam = [...localTeamData, newMember]
    setLocalTeamData(updatedTeam)
    onTeamChange(updatedTeam)
  }

  const handleImageUpload = async (index: number, file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setUploadingImages(prev => ({ ...prev, [index]: true }))

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('teamMemberId', `member-${index}-${Date.now()}`)
      formData.append('userId', userId)
      formData.append('memberName', localTeamData[index].name)

      const response = await fetch('/api/upload-profile-pic', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        const updatedTeam = [...localTeamData]
        updatedTeam[index] = { ...updatedTeam[index], profile_picture_url: result.url }
        setLocalTeamData(updatedTeam)
        onTeamChange(updatedTeam)
      } else {
        alert('Failed to upload image. Please try again.')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingImages(prev => ({ ...prev, [index]: false }))
    }
  }

  const handleImageClick = (index: number) => {
    fileInputRefs.current[index]?.click()
  }

  const removeMember = (index: number) => {
    const updatedTeam = localTeamData.filter((_, i) => i !== index)
    setLocalTeamData(updatedTeam)
    onTeamChange(updatedTeam)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Filter out empty members
    const validMembers = localTeamData.filter(member => 
      member.name.trim() && member.role.trim()
    )
    onSubmit(validMembers)
  }

  if (!isEditing) {
    // Display mode
    return (
      <div className="space-y-4">
        {teamData.map((member, index) => (
          <Card key={index} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                {member.profile_picture_url ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={member.profile_picture_url}
                      alt={`${member.name} profile picture`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold text-gray-900">{member.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{member.role}</p>
                  {member.bio && (
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">{member.bio}</p>
                  )}
                  
                  {/* Contact Links */}
                  <div className="flex items-center space-x-4">
                    {member.linkedin_url && (
                      <a
                        href={member.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                      >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                        </svg>
                        LinkedIn
                      </a>
                    )}
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {teamData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No team members added yet.
          </div>
        )}
      </div>
    )
  }

  // Edit mode
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {localTeamData.map((member, index) => (
          <Card key={index} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Team Member {index + 1}
                </h4>
                {localTeamData.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMember(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                )}
              </div>

              {/* Profile Picture Upload */}
              <div className="mb-4">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Profile Picture
                </Label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {member.profile_picture_url ? (
                      <div className="w-16 h-16 rounded-full overflow-hidden">
                        <Image
                          src={member.profile_picture_url}
                          alt={`${member.name} profile picture`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No image</span>
                      </div>
                    )}
                    {uploadingImages[index] && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={(el) => {
                        fileInputRefs.current[index] = el
                      }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(index, file)
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleImageClick(index)}
                      disabled={uploadingImages[index]}
                    >
                      {member.profile_picture_url ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                    {member.profile_picture_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updatedTeam = [...localTeamData]
                          updatedTeam[index] = { ...updatedTeam[index], profile_picture_url: '' }
                          setLocalTeamData(updatedTeam)
                          onTeamChange(updatedTeam)
                        }}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor={`name-${index}`} className="text-sm font-medium text-gray-700">
                    Full Name *
                  </Label>
                  <Input
                    id={`name-${index}`}
                    type="text"
                    value={member.name}
                    onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                    required
                    className="mt-1"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor={`role-${index}`} className="text-sm font-medium text-gray-700">
                    Role/Title *
                  </Label>
                  <Input
                    id={`role-${index}`}
                    type="text"
                    value={member.role}
                    onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                    required
                    className="mt-1"
                    placeholder="Co-founder & CEO"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor={`bio-${index}`} className="text-sm font-medium text-gray-700">
                  Bio/Background
                </Label>
                <Textarea
                  id={`bio-${index}`}
                  value={member.bio}
                  onChange={(e) => handleMemberChange(index, 'bio', e.target.value)}
                  rows={2}
                  className="mt-1"
                  placeholder="Brief background and experience..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`linkedin-${index}`} className="text-sm font-medium text-gray-700">
                    LinkedIn URL
                  </Label>
                  <Input
                    id={`linkedin-${index}`}
                    type="url"
                    value={member.linkedin_url || ''}
                    onChange={(e) => handleMemberChange(index, 'linkedin_url', e.target.value)}
                    className="mt-1"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div>
                  <Label htmlFor={`email-${index}`} className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    value={member.email || ''}
                    onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                    className="mt-1"
                    placeholder="john@company.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={addMember}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          + Add Team Member
        </Button>
        
        <Button
          type="submit"
          disabled={isUpdating}
          className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? 'Updating...' : 'Save Team & Create Update'}
        </Button>
      </div>
    </form>
  )
}
