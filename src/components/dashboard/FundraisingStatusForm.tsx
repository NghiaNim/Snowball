'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type FundraisingStatus = 'not_fundraising' | 'preparing_to_raise' | 'actively_fundraising'

interface FundraisingStatusData {
  status: FundraisingStatus
  target_amount?: number
  stage?: string
  deadline?: string
  notes?: string
}

interface FundraisingStatusFormProps {
  isEditing: boolean
  statusData: FundraisingStatusData | null
  onStatusChange: (data: FundraisingStatusData) => void
  onSubmit: (data: FundraisingStatusData) => void
  isUpdating?: boolean
}

const statusConfig = {
  not_fundraising: {
    label: 'Not Fundraising',
    icon: '⚪',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    description: 'Not currently raising funds'
  },
  preparing_to_raise: {
    label: 'Preparing to Raise',
    icon: '🟡',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    description: 'Getting ready for fundraising'
  },
  actively_fundraising: {
    label: 'Active Fundraising',
    icon: '🟢',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Currently raising funds'
  }
}

export function FundraisingStatusForm({
  isEditing,
  statusData,
  onStatusChange,
  onSubmit,
  isUpdating = false
}: FundraisingStatusFormProps) {
  const [localStatusData, setLocalStatusData] = useState<FundraisingStatusData>(
    statusData || {
      status: 'not_fundraising',
      target_amount: undefined,
      stage: '',
      deadline: '',
      notes: ''
    }
  )

  const handleFieldChange = (field: keyof FundraisingStatusData, value: string | number | undefined) => {
    let updatedData = { ...localStatusData, [field]: value }
    
    // If status is changing to 'not_fundraising', clear fundraising-specific fields
    if (field === 'status' && value === 'not_fundraising') {
      updatedData = {
        ...updatedData,
        target_amount: undefined,
        stage: '',
        deadline: '',
        notes: ''
      }
    }
    
    setLocalStatusData(updatedData)
    onStatusChange(updatedData)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clean up the data before submitting - convert empty strings to undefined
    const cleanedData = {
      ...localStatusData,
      target_amount: localStatusData.target_amount || undefined,
      stage: localStatusData.stage || undefined,
      deadline: localStatusData.deadline || undefined,
      notes: localStatusData.notes || undefined
    }
    
    onSubmit(cleanedData)
  }

  if (!isEditing) {
    // Display mode
    const config = statusConfig[statusData?.status || 'not_fundraising']
    
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center`}>
                <span className="text-2xl">{config.icon}</span>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${config.color}`}>{config.label}</h3>
                <p className="text-sm text-gray-500">{config.description}</p>
              </div>
            </div>
            <Badge variant="outline" className={`${config.color} border-current`}>
              {config.label}
            </Badge>
          </div>

          {statusData && (
            <div className="space-y-3 text-sm">
              {statusData.target_amount && (
                <div>
                  <span className="font-medium text-gray-700">Target Amount:</span>{' '}
                  <span className="text-gray-600">${statusData.target_amount.toLocaleString()}</span>
                </div>
              )}
              {statusData.stage && (
                <div>
                  <span className="font-medium text-gray-700">Stage:</span>{' '}
                  <span className="text-gray-600">{statusData.stage}</span>
                </div>
              )}
              {statusData.deadline && (
                <div>
                  <span className="font-medium text-gray-700">Target Deadline:</span>{' '}
                  <span className="text-gray-600">{new Date(statusData.deadline).toLocaleDateString()}</span>
                </div>
              )}
              {statusData.notes && (
                <div>
                  <span className="font-medium text-gray-700">Notes:</span>
                  <p className="text-gray-600 mt-1">{statusData.notes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Edit mode
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          {/* Status Selection */}
          <div className="space-y-4 mb-6">
            <Label className="text-sm font-medium text-gray-700">
              Fundraising Status *
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(statusConfig).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleFieldChange('status', key as FundraisingStatus)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    localStatusData.status === key
                      ? `${config.bgColor} border-current ${config.color}`
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-2xl">{config.icon}</span>
                    <span className="text-sm font-medium">{config.label}</span>
                    <span className="text-xs text-gray-500 text-center">{config.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Fields */}
          {(localStatusData.status === 'preparing_to_raise' || localStatusData.status === 'actively_fundraising') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="target-amount" className="text-sm font-medium text-gray-700">
                  Target Amount ($)
                </Label>
                <Input
                  id="target-amount"
                  type="number"
                  value={localStatusData.target_amount || ''}
                  onChange={(e) => handleFieldChange('target_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="mt-1"
                  placeholder="2000000"
                />
              </div>
              <div>
                <Label htmlFor="stage" className="text-sm font-medium text-gray-700">
                  Funding Stage
                </Label>
                <Select
                  value={localStatusData.stage || ''}
                  onValueChange={(value) => handleFieldChange('stage', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pre-seed">Pre-seed</SelectItem>
                    <SelectItem value="Seed">Seed</SelectItem>
                    <SelectItem value="Series A">Series A</SelectItem>
                    <SelectItem value="Series B">Series B</SelectItem>
                    <SelectItem value="Series C">Series C</SelectItem>
                    <SelectItem value="Bridge">Bridge Round</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {localStatusData.status === 'actively_fundraising' && (
            <div className="mb-4">
              <Label htmlFor="deadline" className="text-sm font-medium text-gray-700">
                Target Deadline
              </Label>
              <Input
                id="deadline"
                type="date"
                value={localStatusData.deadline || ''}
                onChange={(e) => handleFieldChange('deadline', e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={localStatusData.notes || ''}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              rows={3}
              className="mt-1"
              placeholder="Additional details about your fundraising status..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isUpdating}
          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? 'Updating...' : 'Save Fundraising Status'}
        </Button>
      </div>
    </form>
  )
}
