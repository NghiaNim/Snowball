'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { api } from '@/lib/trpc/client'
import { useRouter } from 'next/navigation'

// Type definitions for admin template customization
interface TeamMember {
  name: string;
  role: string;
  background: string;
}

interface CurrentMetrics {
  users: string;
  mrr: string;
  growth: string;
  retention: string;
}

interface FounderProfile {
  companyName: string;
  description: string;
  industry: string;
  fundingStage: string;
  amountRaising: string;
  website: string;
  teamMembers: TeamMember[];
  currentMetrics: CurrentMetrics;
}

interface MonthlyUpdate {
  title: string;
  headlineMetrics: Record<string, string>;
  keyWins: string[];
  challengesAsks: string[];
  fundraisingStatus: string;
  statusColor: 'purple' | 'yellow' | 'red' | 'green';
}

interface Company {
  id: number;
  name: string;
  description: string;
  industry: string;
  stage: string;
  location: string;
  fundingTarget: string;
  status: 'closing' | 'starting' | 'preparing';
  tribe: string;
  logo: string;
  metrics: Record<string, string>;
}

interface AdminTemplateState {
  title: string;
  subtitle: string;
  primaryColor: string;
  companies: Company[];
  founderProfile: FounderProfile;
  monthlyUpdate: MonthlyUpdate;
}

const colorOptions = [
  { value: 'blue', label: 'Blue', hex: '#3B82F6' },
  { value: 'green', label: 'Green', hex: '#10B981' },
  { value: 'purple', label: 'Purple', hex: '#8B5CF6' },
  { value: 'orange', label: 'Orange', hex: '#F59E0B' },
  { value: 'red', label: 'Red', hex: '#EF4444' },
  { value: 'gray', label: 'Gray', hex: '#6B7280' },
] as const

type TabType = 'link-generator' | 'template-builder' | 'template-manager'
type RoleType = 'investor' | 'founder'

// Sample companies that users can customize
const defaultCompanies: Company[] = [
  {
    id: 1,
    name: 'TechFlow AI',
    description: 'AI-powered workflow automation for enterprise',
    industry: 'Enterprise Software',
    stage: 'Series A',
    location: 'San Francisco, CA',
    fundingTarget: '$5M',
    status: 'closing' as const,
    tribe: 'Stanford Alumni',
    logo: '🤖',
    metrics: {
      'mrr': '$125K',
      'growth': '+40% MoM',
      'customers': '50+ Enterprise'
    }
  },
  {
    id: 2,
    name: 'GreenTech Solutions',
    description: 'Sustainable energy storage systems',
    industry: 'CleanTech',
    stage: 'Seed',
    location: 'Austin, TX',
    fundingTarget: '$2.5M',
    status: 'starting' as const,
    tribe: 'Y Combinator',
    logo: '🌱',
    metrics: {
      'revenue': '$50K ARR',
      'growth': '+80% QoQ',
      'partnerships': '3 Major Utilities'
    }
  },
  {
    id: 3,
    name: 'HealthAI Diagnostics',
    description: 'AI-powered medical imaging analysis',
    industry: 'HealthTech',
    stage: 'Series A',
    location: 'Boston, MA',
    fundingTarget: '$8M',
    status: 'preparing' as const,
    tribe: 'MIT Network',
    logo: '🏥',
    metrics: {
      'revenue': '$500K ARR',
      'growth': '+25% MoM',
      'hospitals': '15 Pilot Programs'
    }
  }
]

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('link-generator')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [backgroundColor, setBackgroundColor] = useState<'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray'>('blue')
  const [generatedLinks, setGeneratedLinks] = useState<{
    investorLink: string
    founderLink: string
    expiresAt: string
  } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Template builder state
  const [selectedInvestorTemplate, setSelectedInvestorTemplate] = useState<string>('default')
  const [selectedFounderTemplate, setSelectedFounderTemplate] = useState<string>('default')
  const [previewRole, setPreviewRole] = useState<RoleType>('investor')
  const [editableCompanies, setEditableCompanies] = useState(defaultCompanies)
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  
  // Current template customizations
  const [currentTemplate, setCurrentTemplate] = useState<AdminTemplateState>({
    title: 'Investor Dashboard',
    subtitle: 'Deal Flow',
    primaryColor: '#3B82F6',
    companies: defaultCompanies,
    founderProfile: {
      companyName: 'TechFlow AI',
      description: 'AI-powered workflow automation platform that helps enterprise teams streamline their operations',
      industry: 'Enterprise Software',
      fundingStage: 'Series A',
      amountRaising: '$5M',
      website: 'https://techflow.ai',
      teamMembers: [
        { name: 'Sarah Chen', role: 'CEO & Co-founder', background: 'Ex-Google PM, Stanford CS' },
        { name: 'Marcus Johnson', role: 'CTO & Co-founder', background: 'Ex-Meta Engineering, MIT' },
        { name: 'Priya Patel', role: 'Head of Sales', background: 'Ex-Salesforce, Harvard MBA' }
      ],
      currentMetrics: {
        users: '2,500+',
        mrr: '$125K',
        growth: '+40% MoM',
        retention: '94%'
      }
    },
    monthlyUpdate: {
      title: 'December 2024 Progress Update',
      headlineMetrics: {
        'Users': '2,800 (+12% MoM)',
        'MRR': '$140K (+12% MoM)',
        'Retention': '94% (↑2%)',
        'Growth Rate': '+40% MoM'
      },
      keyWins: [
        'Closed partnership with Microsoft for enterprise distribution',
        'Hired VP of Sales (ex-Salesforce) to scale go-to-market',
        'Launched AI-powered automation features - 40% increase in user engagement'
      ],
      challengesAsks: [
        'Looking for enterprise security expert for advisor role',
        'Seeking warm intros to Fortune 500 CTOs for pilot programs'
      ],
      fundraisingStatus: 'Actively raising Series A',
      statusColor: 'yellow' as const
    }
  })

  const router = useRouter()
  const generateLinksMutation = api.admin.generateReferralLinksWithTemplates.useMutation()
  const saveTemplateMutation = api.admin.saveSimpleTemplate.useMutation()
  const deleteTemplateMutation = api.admin.deleteTemplate.useMutation()
  const templatesQuery = api.admin.getAllTemplates.useQuery()

  useEffect(() => {
    // Check if admin is authenticated
    const token = localStorage.getItem('admin-token')
    if (!token) {
      router.push('/demo/admin')
      return
    }
    setIsAuthenticated(true)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('admin-token')
    router.push('/demo/admin')
  }

  const handleGenerateLinks = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    
    try {
      const result = await generateLinksMutation.mutateAsync({
        welcomeMessage: welcomeMessage.trim(),
        backgroundColor,
        investorTemplateId: selectedInvestorTemplate && selectedInvestorTemplate !== 'default' ? selectedInvestorTemplate : undefined,
        founderTemplateId: selectedFounderTemplate && selectedFounderTemplate !== 'default' ? selectedFounderTemplate : undefined,
      })
      setGeneratedLinks(result)
    } catch (error) {
      alert('Failed to generate links. Please try again.')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    setWelcomeMessage('')
    setBackgroundColor('blue')
    setGeneratedLinks(null)
    setSelectedInvestorTemplate('default')
    setSelectedFounderTemplate('default')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Link copied to clipboard!')
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    try {
      await saveTemplateMutation.mutateAsync({
        templateName: templateName.trim(),
        description: templateDescription.trim(),
        targetRole: previewRole,
        customizations: currentTemplate,
      })
      setIsTemplateDialogOpen(false)
      setTemplateName('')
      setTemplateDescription('')
      templatesQuery.refetch()
      alert('Template saved successfully!')
    } catch (error) {
      alert('Failed to save template. Please try again.')
      console.error(error)
    }
  }

  const updateCompany = (id: number, field: string, value: string) => {
    const updatedCompanies = editableCompanies.map(company => 
      company.id === id 
        ? { ...company, [field]: value }
        : company
    )
    setEditableCompanies(updatedCompanies)
    setCurrentTemplate(prev => ({ ...prev, companies: updatedCompanies }))
  }

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    const confirmed = confirm(`Are you sure you want to delete "${templateName}"? This action cannot be undone.`)
    if (!confirmed) return

    try {
      await deleteTemplateMutation.mutateAsync({ templateId })
      templatesQuery.refetch()
      alert('Template deleted successfully!')
    } catch (error) {
      alert('Failed to delete template. Please try again.')
      console.error(error)
    }
  }

  const resetToDefaults = () => {
    setEditableCompanies(defaultCompanies)
    if (previewRole === 'investor') {
      setCurrentTemplate({
        title: 'Investor Dashboard',
        subtitle: 'Deal Flow',
        primaryColor: '#3B82F6',
        companies: defaultCompanies,
        founderProfile: currentTemplate.founderProfile,
        monthlyUpdate: currentTemplate.monthlyUpdate
      })
    } else {
      setCurrentTemplate({
        title: 'Founder Dashboard',
        subtitle: 'Fundraising',
        primaryColor: '#10B981',
        companies: defaultCompanies,
        founderProfile: {
          companyName: 'TechFlow AI',
          description: 'AI-powered workflow automation platform that helps enterprise teams streamline their operations',
          industry: 'Enterprise Software',
          fundingStage: 'Series A',
          amountRaising: '$5M',
          website: 'https://techflow.ai',
          teamMembers: [
            { name: 'Sarah Chen', role: 'CEO & Co-founder', background: 'Ex-Google PM, Stanford CS' },
            { name: 'Marcus Johnson', role: 'CTO & Co-founder', background: 'Ex-Meta Engineering, MIT' },
            { name: 'Priya Patel', role: 'Head of Sales', background: 'Ex-Salesforce, Harvard MBA' }
          ],
          currentMetrics: {
            users: '2,500+',
            mrr: '$125K',
            growth: '+40% MoM',
            retention: '94%'
          }
        },
        monthlyUpdate: {
          title: 'December 2024 Progress Update',
          headlineMetrics: {
            'Users': '2,800 (+12% MoM)',
            'MRR': '$140K (+12% MoM)',
            'Retention': '94% (↑2%)',
            'Growth Rate': '+40% MoM'
          },
          keyWins: [
            'Closed partnership with Microsoft for enterprise distribution',
            'Hired VP of Sales (ex-Salesforce) to scale go-to-market',
            'Launched AI-powered automation features - 40% increase in user engagement'
          ],
          challengesAsks: [
            'Looking for enterprise security expert for advisor role',
            'Seeking warm intros to Fortune 500 CTOs for pilot programs'
          ],
          fundraisingStatus: 'Actively raising Series A',
          statusColor: 'yellow' as const
        }
      })
    }
  }

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  const tabs = [
    { id: 'link-generator', label: 'Generate Links', icon: '🔗' },
    { id: 'template-builder', label: 'Template Builder', icon: '🎨' },
    { id: 'template-manager', label: 'Manage Templates', icon: '📋' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Snowball Admin</h1>
              <p className="text-muted-foreground">Dashboard Template Builder & Link Management</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* LINK GENERATOR TAB */}
        {activeTab === 'link-generator' && (
          <div className="space-y-6">
        {!generatedLinks ? (
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Investor Dashboard Template</Label>
                        <Select value={selectedInvestorTemplate} onValueChange={setSelectedInvestorTemplate}>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select investor template (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default Template</SelectItem>
                            {templatesQuery.data?.filter(t => t.target_role === 'investor').map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.template_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Founder Dashboard Template</Label>
                        <Select value={selectedFounderTemplate} onValueChange={setSelectedFounderTemplate}>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select founder template (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default Template</SelectItem>
                            {templatesQuery.data?.filter(t => t.target_role === 'founder').map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.template_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                  </CardContent>
                </Card>

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
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* TEMPLATE BUILDER TAB */}
        {activeTab === 'template-builder' && (
          <div className="space-y-6">
            {/* Header with role selection */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Template Builder</CardTitle>
                    <CardDescription>
                      Customize dashboard content and save as templates for different scenarios
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Select value={previewRole} onValueChange={(value) => setPreviewRole(value as RoleType)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investor">Investor</SelectItem>
                        <SelectItem value="founder">Founder</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={resetToDefaults}>
                      Reset to Defaults
                    </Button>
                                      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>Save Template</Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white border border-gray-200 shadow-lg">
                        <DialogHeader>
                          <DialogTitle>Save Template</DialogTitle>
                          <DialogDescription>
                            Save your customizations as a reusable template
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Template Name</Label>
                            <Input
                              value={templateName}
                              onChange={(e) => setTemplateName(e.target.value)}
                              placeholder="e.g., MIT Accelerator Demo"
                              className="bg-white"
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Input
                              value={templateDescription}
                              onChange={(e) => setTemplateDescription(e.target.value)}
                              placeholder="Brief description of this template"
                              className="bg-white"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleSaveTemplate}
                              disabled={saveTemplateMutation.isPending}
                            >
                              {saveTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Dashboard Preview with Editable Content */}
            {previewRole === 'investor' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Investor Dashboard Preview</CardTitle>
                  <CardDescription>
                    Click on any company below to edit its information. This is what investors will see.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 border rounded-lg overflow-hidden">
                    {/* Dashboard Header */}
                    <div className="bg-white border-b p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <Input
                            value={currentTemplate.title}
                            onChange={(e) => setCurrentTemplate(prev => ({ ...prev, title: e.target.value }))}
                            className="text-2xl font-bold border-0 px-0 h-auto bg-transparent"
                            style={{ color: currentTemplate.primaryColor }}
                          />
                          <Input
                            value={currentTemplate.subtitle}
                            onChange={(e) => setCurrentTemplate(prev => ({ ...prev, subtitle: e.target.value }))}
                            className="text-gray-600 border-0 px-0 h-auto bg-transparent"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label className="text-sm">Color:</Label>
                          <Select 
                            value={currentTemplate.primaryColor} 
                            onValueChange={(value) => setCurrentTemplate(prev => ({ ...prev, primaryColor: value }))}
                          >
                            <SelectTrigger className="w-32">
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-4 h-4 rounded border"
                                  style={{ backgroundColor: currentTemplate.primaryColor }}
                                />
                                <span>Color</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {colorOptions.map((option) => (
                                <SelectItem key={option.value} value={option.hex}>
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
                        </div>
                      </div>
                    </div>

                    {/* Company Cards */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Deal Flow - Click any card to edit</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {editableCompanies.map((company) => (
                          <div 
                            key={company.id} 
                            className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setEditingCompanyId(company.id)}
                          >
                            {/* Company Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="text-2xl">{company.logo}</div>
                                <div className="flex-1">
                                  {editingCompanyId === company.id ? (
                                    <div className="space-y-2">
                                      <Input
                                        value={company.name}
                                        onChange={(e) => updateCompany(company.id, 'name', e.target.value)}
                                        className="text-lg font-semibold"
                                        placeholder="Company Name"
                                      />
                                      <Input
                                        value={company.tribe}
                                        onChange={(e) => updateCompany(company.id, 'tribe', e.target.value)}
                                        className="text-sm text-gray-600"
                                        placeholder="Tribe/Network"
                                      />
                                    </div>
                                  ) : (
                                    <div>
                                      <h3 className="text-lg font-semibold">{company.name}</h3>
                                      <p className="text-sm text-gray-600">{company.tribe}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-600">
                                {company.status === 'closing' && '🔴 Closing soon'}
                                {company.status === 'starting' && '🟡 Starting fundraise'}
                                {company.status === 'preparing' && '🟣 Preparing to raise'}
                              </div>
                            </div>

                            {/* Company Description */}
                            {editingCompanyId === company.id ? (
                              <Input
                                value={company.description}
                                onChange={(e) => updateCompany(company.id, 'description', e.target.value)}
                                className="text-sm mb-4"
                                placeholder="Company Description"
                              />
                            ) : (
                              <p className="text-gray-700 text-sm mb-4">{company.description}</p>
                            )}

                            {/* Company Details */}
                            <div className="space-y-2 mb-4 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Industry:</span>
                                {editingCompanyId === company.id ? (
                                  <Input
                                    value={company.industry}
                                    onChange={(e) => updateCompany(company.id, 'industry', e.target.value)}
                                    className="w-32 h-6 text-xs"
                                  />
                                ) : (
                                  <span>{company.industry}</span>
                                )}
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Stage:</span>
                                {editingCompanyId === company.id ? (
                                  <Input
                                    value={company.stage}
                                    onChange={(e) => updateCompany(company.id, 'stage', e.target.value)}
                                    className="w-32 h-6 text-xs"
                                  />
                                ) : (
                                  <span>{company.stage}</span>
                                )}
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Target:</span>
                                {editingCompanyId === company.id ? (
                                  <Input
                                    value={company.fundingTarget}
                                    onChange={(e) => updateCompany(company.id, 'fundingTarget', e.target.value)}
                                    className="w-32 h-6 text-xs"
                                  />
                                ) : (
                                  <span>{company.fundingTarget}</span>
                                )}
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Location:</span>
                                {editingCompanyId === company.id ? (
                                  <Input
                                    value={company.location}
                                    onChange={(e) => updateCompany(company.id, 'location', e.target.value)}
                                    className="w-32 h-6 text-xs"
                                  />
                                ) : (
                                  <span>{company.location}</span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-2 mt-4">
                              {editingCompanyId === company.id ? (
                                <Button 
                                  size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingCompanyId(null)
                                  }}
                                  className="w-full"
                                >
                                  Done Editing
                                </Button>
                              ) : (
                                <>
                                  <Button size="sm" variant="outline" className="flex-1">
                                    Track
                          </Button>
                                  <Button 
                                    size="sm" 
                                    className="flex-1 text-white"
                                    style={{ backgroundColor: currentTemplate.primaryColor }}
                                  >
                                    🚪 Knock
                          </Button>
                                </>
                              )}
                            </div>
                        </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Founder Dashboard Preview</CardTitle>
                  <CardDescription>
                    Click on any section below to edit the founder profile and monthly update content.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 border rounded-lg overflow-hidden">
                    {/* Dashboard Header */}
                    <div className="bg-white border-b p-6">
                      <Input
                        value={currentTemplate.title}
                        onChange={(e) => setCurrentTemplate(prev => ({ ...prev, title: e.target.value }))}
                        className="text-2xl font-bold border-0 px-0 h-auto bg-transparent"
                        style={{ color: currentTemplate.primaryColor }}
                      />
                      <Input
                        value={currentTemplate.subtitle}
                        onChange={(e) => setCurrentTemplate(prev => ({ ...prev, subtitle: e.target.value }))}
                        className="text-gray-600 border-0 px-0 h-auto bg-transparent"
                      />
                      <div className="flex items-center space-x-2 mt-4">
                        <Label className="text-sm">Color:</Label>
                        <Select 
                          value={currentTemplate.primaryColor} 
                          onValueChange={(value) => setCurrentTemplate(prev => ({ ...prev, primaryColor: value }))}
                        >
                          <SelectTrigger className="w-32">
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: currentTemplate.primaryColor }}
                              />
                              <span>Color</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {colorOptions.map((option) => (
                              <SelectItem key={option.value} value={option.hex}>
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
                      </div>
                    </div>

                    {/* Founder Profile Section */}
                    <div className="p-6 border-b bg-white">
                      <h3 className="text-lg font-semibold mb-4">Company Profile</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">COMPANY NAME</Label>
                          <Input
                            value={currentTemplate.founderProfile?.companyName || ''}
                            onChange={(e) => setCurrentTemplate(prev => ({
                              ...prev,
                              founderProfile: { ...prev.founderProfile!, companyName: e.target.value }
                            }))}
                            className="font-semibold"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">INDUSTRY</Label>
                          <Input
                            value={currentTemplate.founderProfile?.industry || ''}
                            onChange={(e) => setCurrentTemplate(prev => ({
                              ...prev,
                              founderProfile: { ...prev.founderProfile!, industry: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">FUNDING STAGE</Label>
                          <Input
                            value={currentTemplate.founderProfile?.fundingStage || ''}
                            onChange={(e) => setCurrentTemplate(prev => ({
                              ...prev,
                              founderProfile: { ...prev.founderProfile!, fundingStage: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">AMOUNT RAISING</Label>
                          <Input
                            value={currentTemplate.founderProfile?.amountRaising || ''}
                            onChange={(e) => setCurrentTemplate(prev => ({
                              ...prev,
                              founderProfile: { ...prev.founderProfile!, amountRaising: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label className="text-xs text-gray-500">COMPANY DESCRIPTION</Label>
                        <Input
                          value={currentTemplate.founderProfile?.description || ''}
                          onChange={(e) => setCurrentTemplate(prev => ({
                            ...prev,
                            founderProfile: { ...prev.founderProfile!, description: e.target.value }
                          }))}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Current Metrics Section */}
                    <div className="p-6 border-b bg-gray-50">
                      <h3 className="text-lg font-semibold mb-4">Current Metrics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">USERS</Label>
                          <Input
                            value={currentTemplate.founderProfile?.currentMetrics?.users || ''}
                            onChange={(e) => setCurrentTemplate(prev => ({
                              ...prev,
                              founderProfile: {
                                ...prev.founderProfile!,
                                currentMetrics: { ...prev.founderProfile!.currentMetrics, users: e.target.value }
                              }
                            }))}
                            className="font-bold"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">MRR</Label>
                          <Input
                            value={currentTemplate.founderProfile?.currentMetrics?.mrr || ''}
                            onChange={(e) => setCurrentTemplate(prev => ({
                              ...prev,
                              founderProfile: {
                                ...prev.founderProfile!,
                                currentMetrics: { ...prev.founderProfile!.currentMetrics, mrr: e.target.value }
                              }
                            }))}
                            className="font-bold"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">GROWTH</Label>
                          <Input
                            value={currentTemplate.founderProfile?.currentMetrics?.growth || ''}
                            onChange={(e) => setCurrentTemplate(prev => ({
                              ...prev,
                              founderProfile: {
                                ...prev.founderProfile!,
                                currentMetrics: { ...prev.founderProfile!.currentMetrics, growth: e.target.value }
                              }
                            }))}
                            className="font-bold"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">RETENTION</Label>
                          <Input
                            value={currentTemplate.founderProfile?.currentMetrics?.retention || ''}
                            onChange={(e) => setCurrentTemplate(prev => ({
                              ...prev,
                              founderProfile: {
                                ...prev.founderProfile!,
                                currentMetrics: { ...prev.founderProfile!.currentMetrics, retention: e.target.value }
                              }
                            }))}
                            className="font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Monthly Update Section */}
                    <div className="p-6 bg-white">
                      <h3 className="text-lg font-semibold mb-4">Latest Monthly Update</h3>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Input
                            value={currentTemplate.monthlyUpdate?.title || ''}
                            onChange={(e) => setCurrentTemplate(prev => ({
                              ...prev,
                              monthlyUpdate: { ...prev.monthlyUpdate!, title: e.target.value }
                            }))}
                            className="font-semibold text-lg border-0 px-0 h-auto bg-transparent"
                          />
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: 
                                  currentTemplate.monthlyUpdate?.statusColor === 'purple' ? '#8B5CF6' :
                                  currentTemplate.monthlyUpdate?.statusColor === 'yellow' ? '#F59E0B' :
                                  currentTemplate.monthlyUpdate?.statusColor === 'red' ? '#EF4444' :
                                  currentTemplate.monthlyUpdate?.statusColor === 'green' ? '#10B981' :
                                  '#F59E0B'
                              }}
                            />
                            <Select 
                              value={currentTemplate.monthlyUpdate?.statusColor || 'yellow'}
                              onValueChange={(value: 'purple' | 'yellow' | 'red' | 'green') => 
                                setCurrentTemplate(prev => ({
                                  ...prev,
                                  monthlyUpdate: { ...prev.monthlyUpdate, statusColor: value }
                                }))
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="purple">🟣 Preparing</SelectItem>
                                <SelectItem value="yellow">🟡 Raising</SelectItem>
                                <SelectItem value="red">🔴 Closing</SelectItem>
                                <SelectItem value="green">🟢 Raised</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">📊 Headline Metrics</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {Object.entries(currentTemplate.monthlyUpdate?.headlineMetrics || {}).map(([key, value], idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span className="text-gray-600">{key}:</span>
                                  <span className="font-medium">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">🎉 Key Wins</h4>
                            <ul className="text-sm space-y-1">
                              {currentTemplate.monthlyUpdate?.keyWins?.map((win, idx) => (
                                <li key={idx} className="text-gray-600">• {win}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">🤝 Challenges & Asks</h4>
                            <ul className="text-sm space-y-1">
                              {currentTemplate.monthlyUpdate?.challengesAsks?.map((ask, idx) => (
                                <li key={idx} className="text-gray-600">• {ask}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="flex space-x-4 mt-4 pt-3 border-t">
                          <button className="text-sm text-gray-600 hover:text-gray-800" disabled>
                            👍 Like
                          </button>
                          <button className="text-sm text-gray-600 hover:text-gray-800" disabled>
                            💬 Comment
                          </button>
                          <button className="text-sm text-gray-600 hover:text-gray-800" disabled>
                            ✉️ DM
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
                </div>
        )}

        {/* TEMPLATE MANAGER TAB */}
        {activeTab === 'template-manager' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Manager</CardTitle>
                <CardDescription>
                  View, edit, and delete your saved templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templatesQuery.data?.map((template) => (
                    <Card key={template.id} className="border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{template.template_name}</CardTitle>
                            <CardDescription>{template.description}</CardDescription>
                          </div>
                          <Badge variant={template.target_role === 'investor' ? 'default' : 'secondary'}>
                            {template.target_role === 'investor' ? '🏦' : '🚀'} {template.target_role}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-xs text-gray-500">
                          Created: {new Date(template.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Load template for editing
                              setCurrentTemplate(template.customizations as AdminTemplateState)
                              setPreviewRole(template.target_role as RoleType)
                              setActiveTab('template-builder')
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTemplate(template.id, template.template_name)}
                            disabled={deleteTemplateMutation.isPending}
                          >
                            {deleteTemplateMutation.isPending ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
