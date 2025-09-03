'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/trpc/client'

interface FeedbackButtonsProps {
  companyId: string
  companyName: string
}

export default function FeedbackButtons({ companyId, companyName }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)
  const [showReasonInput, setShowReasonInput] = useState(false)
  const [reason, setReason] = useState('')

  const provideFeedback = api.investor.provideFeedback.useMutation({
    onSuccess: () => {
      setShowReasonInput(false)
      setReason('')
    },
    onError: (error) => {
      console.error('Failed to provide feedback:', error)
    }
  })

  const handleFeedback = (isPositive: boolean) => {
    const feedbackType = isPositive ? 'positive' : 'negative'
    setFeedback(feedbackType)
    
    if (!isPositive) {
      setShowReasonInput(true)
    } else {
      // For positive feedback, submit immediately
      provideFeedback.mutate({
        company_id: companyId,
        is_positive: true,
        reason: 'Interested in this opportunity'
      })
    }
  }

  const submitNegativeFeedback = () => {
    provideFeedback.mutate({
      company_id: companyId,
      is_positive: false,
      reason: reason.trim() || 'Not a fit for investment criteria'
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant={feedback === 'positive' ? 'default' : 'outline'}
          onClick={() => handleFeedback(true)}
          disabled={provideFeedback.isPending}
          className="flex-1"
        >
          👍 {feedback === 'positive' ? 'Liked' : 'Like'}
        </Button>
        <Button
          size="sm"
          variant={feedback === 'negative' ? 'destructive' : 'outline'}
          onClick={() => handleFeedback(false)}
          disabled={provideFeedback.isPending}
          className="flex-1"
        >
          👎 {feedback === 'negative' ? 'Passed' : 'Pass'}
        </Button>
      </div>

      {showReasonInput && (
        <div className="space-y-2">
          <textarea
            placeholder="Optional: Why is this not a fit? (helps improve recommendations)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-xs p-2 border rounded-md resize-none"
            rows={2}
            maxLength={200}
          />
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={submitNegativeFeedback}
              disabled={provideFeedback.isPending}
              className="flex-1"
            >
              Submit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowReasonInput(false)
                setFeedback(null)
                setReason('')
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {feedback && !showReasonInput && (
        <p className="text-xs text-gray-500 text-center">
          Thanks for your feedback on {companyName}! This helps us improve your deal flow.
        </p>
      )}
    </div>
  )
}
