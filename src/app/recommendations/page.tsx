'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RecommendationsPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    const auth = localStorage.getItem('production-auth')
    
    if (auth === 'true') {
      // Redirect to dashboard if already logged in
      router.push('/recommendations/dashboard')
    } else {
      // Redirect to login if not authenticated
      router.push('/recommendations/login')
    }
  }, [router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading AI Recommendation System...</p>
      </div>
    </div>
  )
}
