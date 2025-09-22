'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Crown, Zap, Check, Loader2 } from 'lucide-react'
import { getAuthHeaders } from '@/lib/auth-helpers'

interface UserUsage {
  searchCount: number
  planType: 'free' | 'pro'
  hasReachedLimit: boolean
  isSubscribed: boolean
}

interface UpgradeButtonProps {
  usage: UserUsage
  onUpgradeClick?: () => void
}

export function UpgradeButton({ usage, onUpgradeClick }: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || process.env.STRIPE_PRODUCT_ID
        })
      })

      const data = await response.json()

      if (data.success && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        console.error('Failed to create checkout session:', data.error)
        alert('Failed to start checkout process. Please try again.')
      }
    } catch (error) {
      console.error('Error starting checkout:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }

    onUpgradeClick?.()
  }

  // Don't show if already subscribed
  if (usage.isSubscribed) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg text-green-700">Pro Plan Active</CardTitle>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              Unlimited
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-green-600 text-sm">
            You have unlimited searches with your Pro subscription!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Upgrade to Pro</CardTitle>
          </div>
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
            {5 - usage.searchCount} searches left today
          </Badge>
        </div>
        <CardDescription>
          Get unlimited searches and advanced features
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            <span>Unlimited daily searches</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            <span>Priority support</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            <span>Advanced AI features</span>
          </div>
        </div>

        <Button 
          onClick={handleUpgrade}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting checkout...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </>
          )}
        </Button>

        {usage.hasReachedLimit && (
          <div className="text-center">
            <p className="text-sm text-amber-600 font-medium">
              You&apos;ve reached your daily search limit.
            </p>
            <p className="text-xs text-amber-500 mt-1">
              Upgrade now for unlimited searches!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
