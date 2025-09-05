'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

interface TeamMember {
  name: string
  role: string
  bio: string
}

interface TeamEditFormProps {
  isEditing: boolean
  teamData: TeamMember[]
  onTeamChange: (data: TeamMember[]) => void
  onSubmit: (data: TeamMember[]) => void
  isUpdating?: boolean
}

export function TeamEditForm({
  isEditing,
  teamData,
  onTeamChange,
  onSubmit,
  isUpdating = false
}: TeamEditFormProps) {
  const [localTeamData, setLocalTeamData] = useState<TeamMember[]>(teamData)

  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const updatedTeam = [...localTeamData]
    updatedTeam[index] = { ...updatedTeam[index], [field]: value }
    setLocalTeamData(updatedTeam)
    onTeamChange(updatedTeam)
  }

  const addMember = () => {
    const newMember: TeamMember = { name: '', role: '', bio: '' }
    const updatedTeam = [...localTeamData, newMember]
    setLocalTeamData(updatedTeam)
    onTeamChange(updatedTeam)
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
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold text-gray-900">{member.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{member.role}</p>
                  {member.bio && (
                    <p className="text-sm text-gray-700 leading-relaxed">{member.bio}</p>
                  )}
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
