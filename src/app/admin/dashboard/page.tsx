'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/trpc/client'
import { useRouter } from 'next/navigation'

const colorOptions = [
  { value: 'blue', label: 'Blue', hex: '#3B82F6' },
  { value: 'green', label: 'Green', hex: '#10B981' },
  { value: 'purple', label: 'Purple', hex: '#8B5CF6' },
  { value: 'orange', label: 'Orange', hex: '#F59E0B' },
  { value: 'red', label: 'Red', hex: '#EF4444' },
  { value: 'gray', label: 'Gray', hex: '#6B7280' },
] as const

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [backgroundColor, setBackgroundColor] = useState<'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray'>('blue')
  const [generatedLinks, setGeneratedLinks] = useState<{
    investorLink: string
    founderLink: string
    expiresAt: string
  } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const router = useRouter()
  const generateLinksMutation = api.admin.generateReferralLinks.useMutation()

  useEffect(() => {
    // Check if admin is authenticated
    const token = localStorage.getItem('admin-token')
    if (!token) {
      router.push('/admin')
      return
    }
    setIsAuthenticated(true)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('admin-token')
    router.push('/admin')
  }

  const handleGenerateLinks = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!welcomeMessage.trim()) {
      alert('Please enter a welcome message')
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateLinksMutation.mutateAsync({
        welcomeMessage: welcomeMessage.trim(),
        backgroundColor,
      })
      setGeneratedLinks(result)
    } catch (error) {
      alert('Failed to generate links. Please try again.')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Link copied to clipboard!')
  }

  const resetForm = () => {
    setWelcomeMessage('')
    setBackgroundColor('blue')
    setGeneratedLinks(null)
  }

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Snowball Admin</h1>
              <p className="text-muted-foreground">Referral Link Management</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!generatedLinks ? (
          /* Link Generator Form */
          <Card>
            <CardHeader>
              <CardTitle>Generate Referral Links</CardTitle>
              <CardDescription>
                Create custom branded signup experiences for investors and founders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateLinks} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="welcome-message">Custom Welcome Message</Label>
                  <Input
                    id="welcome-message"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Enter a personalized welcome message for new users..."
                    className="bg-white text-gray-900"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This message will appear on the signup page for both investors and founders.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background-color">Background Color</Label>
                  <Select value={backgroundColor} onValueChange={(value) => setBackgroundColor(value as typeof backgroundColor)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: option.hex }}
                            />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: colorOptions.find(c => c.value === backgroundColor)?.hex }}
                    />
                    <span className="text-xs text-muted-foreground">Current selection</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isGenerating}>
                    {isGenerating ? 'Generating...' : 'Generate Referral Links'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Generated Links Display */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-green-600">✅ Referral Links Generated</CardTitle>
                    <CardDescription>
                      Expires: {new Date(generatedLinks.expiresAt).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={resetForm}>
                    Generate New Links
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Investor Link */}
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                      🏦 Investor Referral Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={generatedLinks.investorLink}
                        readOnly
                        className="font-mono text-sm bg-white text-gray-900"
                      />
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(generatedLinks.investorLink)}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-blue-700">
                      Share this link with potential investors
                    </p>
                  </CardContent>
                </Card>

                {/* Founder Link */}
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-green-900 flex items-center gap-2">
                      🚀 Founder Referral Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={generatedLinks.founderLink}
                        readOnly
                        className="font-mono text-sm bg-white text-gray-900"
                      />
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(generatedLinks.founderLink)}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-green-700">
                      Share this link with startup founders
                    </p>
                  </CardContent>
                </Card>

                {/* Link Settings Summary */}
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertDescription>
                    <div className="space-y-2">
                      <h4 className="font-medium text-amber-800">Link Configuration</h4>
                      <div className="text-sm text-amber-700 space-y-1">
                        <p><strong>Welcome Message:</strong> &ldquo;{welcomeMessage}&rdquo;</p>
                        <div className="flex items-center gap-2">
                          <strong>Background Color:</strong>
                          <Badge variant="secondary" className="gap-1">
                            <div
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: colorOptions.find(c => c.value === backgroundColor)?.hex }}
                            />
                            {colorOptions.find(c => c.value === backgroundColor)?.label}
                          </Badge>
                        </div>
                        <p><strong>Expiration:</strong> 24 hours from creation</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
