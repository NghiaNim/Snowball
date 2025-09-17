import { NextRequest, NextResponse } from 'next/server'
import { generateClarifyingQuestions, refineResultsWithLLM } from '@/lib/langchain'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    console.log('🧪 Testing GPT-5 LangChain integration...')
    
    // Test question generation
    const mockSchema = {
      fields: [
        { name: 'name', type: 'text', description: 'Full name' },
        { name: 'title', type: 'text', description: 'Job title' },
        { name: 'company', type: 'text', description: 'Company name' },
        { name: 'industry', type: 'text', description: 'Industry sector' },
        { name: 'location', type: 'text', description: 'Geographic location' },
        { name: 'experience', type: 'text', description: 'Years of experience' }
      ]
    }
    
    const testQuery = 'Find healthcare professionals with startup experience'
    
    console.log('🤖 Calling generateClarifyingQuestions with GPT-5...')
    const questions = await generateClarifyingQuestions(testQuery, mockSchema)
    
    console.log('✅ Questions generated:', questions.length)
    
    // Test result refinement
    const mockCandidates = [
      {
        id: '1',
        data: {
          name: 'Dr. Sarah Johnson',
          title: 'Chief Medical Officer',
          company: 'HealthTech Startup',
          industry: 'Healthcare',
          location: 'San Francisco',
          experience: '12 years'
        },
        score: 0.85,
        matchReasons: ['Healthcare background', 'Startup experience']
      },
      {
        id: '2',
        data: {
          name: 'Dr. Michael Chen',
          title: 'Founder & CEO',
          company: 'MedDevice Inc',
          industry: 'Medical Devices',
          location: 'Boston',
          experience: '15 years'
        },
        score: 0.92,
        matchReasons: ['Founder experience', 'Medical background']
      }
    ]
    
    console.log('🤖 Calling refineResultsWithLLM with GPT-5...')
    const refinement = await refineResultsWithLLM(testQuery, mockCandidates)
    
    console.log('✅ Refinement completed')
    
    return NextResponse.json({
      success: true,
      gpt5_working: true,
      test_results: {
        questions_generated: questions.length,
        questions: questions,
        refinement_confidence: refinement.confidence,
        refinement_explanations: refinement.explanations.length,
        sample_explanation: refinement.explanations[0]
      },
      model_info: {
        questions_model: 'gpt-5-mini-2025-08-07',
        refinement_model: 'gpt-5-mini-2025-08-07'
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: unknown) {
    console.error('❌ GPT-5 LangChain test error:', error)
    
    return NextResponse.json({
      success: false,
      gpt5_working: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      error_type: (error as Record<string, unknown>)?.type || 'unknown',
      error_code: (error as Record<string, unknown>)?.code || 'unknown',
      timestamp: new Date().toISOString()
    }, { 
      status: 500
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query, test_type } = await req.json()
    
    if (test_type === 'questions') {
      const mockSchema = {
        fields: [
          { name: 'name', type: 'text', description: 'Full name' },
          { name: 'title', type: 'text', description: 'Job title' },
          { name: 'industry', type: 'text', description: 'Industry sector' }
        ]
      }
      
      const questions = await generateClarifyingQuestions(query || 'Find experts in AI', mockSchema)
      
      return NextResponse.json({
        success: true,
        questions,
        model: 'gpt-5-mini-2025-08-07'
      })
    }
    
    return NextResponse.json({ error: 'Invalid test_type' }, { status: 400 })
    
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
