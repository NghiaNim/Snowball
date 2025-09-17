import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { JsonOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'

// Initialize LangChain OpenAI client
const llm = process.env.OPENAI_API_KEY ? new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini',
  temperature: 0.7,
}) : null

export async function generateClarifyingQuestions(
  query: string,
  schemaAnalysis: { fields?: Array<{ name: string; type?: string; description?: string }> }
): Promise<Array<{
  id: string
  type: 'text' | 'multiple_choice' | 'slider' | 'checkbox'
  question: string
  options?: string[]
  multiple?: boolean
  placeholder?: string
}>> {
  // If no LangChain model available, return mock questions
  if (!llm) {
    return getMockClarifyingQuestions(query, schemaAnalysis)
  }

  try {
    const fieldsDescription = schemaAnalysis.fields
      ?.map(f => `- ${f.name} (${f.type || 'text'}): ${f.description || 'No description'}`)
      .join('\n') || 'No field information available'

    // Create a LangChain prompt template
    const promptTemplate = PromptTemplate.fromTemplate(`
You are an AI assistant helping to generate clarifying questions for a people search system. 

User's search query: "{query}"

Available data fields:
{fieldsDescription}

Generate 3-5 clarifying questions that would help narrow down the search results. Each question should be relevant to the query and the available data fields.

Return a JSON array of questions with this exact format:
[
  {{
    "id": "unique_id",
    "type": "multiple_choice" | "text" | "slider" | "checkbox",
    "question": "Question text",
    "options": ["Option 1", "Option 2"] (only for multiple_choice),
    "multiple": true/false (only for multiple_choice),
    "placeholder": "Placeholder text" (only for text type)
  }}
]

Focus on questions about:
- Experience level or seniority
- Location preferences
- Industry focus
- Company size/stage
- Specific skills or background

Make the questions specific and actionable.
`)

    // Create a JSON output parser
    const parser = new JsonOutputParser()

    // Create a LangChain chain
    const chain = RunnableSequence.from([
      promptTemplate,
      llm,
      parser
    ])

    // Execute the chain
    const result = await chain.invoke({
      query,
      fieldsDescription
    })

    return Array.isArray(result) ? result : getMockClarifyingQuestions(query, schemaAnalysis)
  } catch (error) {
    console.error('LangChain API error:', error)
    // Fallback to mock questions if LangChain fails
    return getMockClarifyingQuestions(query, schemaAnalysis)
  }
}

export async function refineResultsWithLLM(
  query: string,
  candidates: Array<{
    id: string
    data: Record<string, unknown>
    score: number
    matchReasons?: string[]
  }>
): Promise<{
  refinedCandidates: typeof candidates
  explanations: string[]
  confidence: number
}> {
  // If no LangChain model available, return mock refinement
  if (!llm) {
    return getMockRefinement(query, candidates)
  }

  try {
    const candidatesText = candidates.slice(0, 10).map((candidate, index) => {
      const data = candidate.data
      return `${index + 1}. ${data.name || 'Unknown'} - ${data.title || 'No title'} at ${data.company || 'Unknown company'}
         Location: ${data.location || 'Unknown'}
         Experience: ${data.experience || 'Unknown'}
         Industry: ${data.industry || 'Unknown'}
         Current Score: ${(candidate.score * 100).toFixed(1)}%`
    }).join('\n\n')

    // Create a LangChain prompt template for refinement
    const promptTemplate = PromptTemplate.fromTemplate(`
You are an AI assistant helping to refine and re-rank people search results based on relevance to a query.

Original query: "{query}"

Current top candidates:
{candidatesText}

Please:
1. Re-rank these candidates based on relevance to the query
2. Provide a detailed explanation for each candidate explaining why they are a good match
3. Give an overall confidence score for the quality of matches

Return a JSON object with this exact format:
{{
  "refinedCandidates": [
    {{
      "originalIndex": 0,
      "relevanceScore": 0.95,
      "explanation": "Detailed explanation of why this person is relevant"
    }}
  ],
  "confidence": 0.85
}}

Focus on:
- Alignment with the query intent
- Relevant experience and background
- Industry and role fit
- Geographic considerations if mentioned
`)

    // Create a JSON output parser
    const parser = new JsonOutputParser()

    // Create a lower temperature model for more consistent ranking
    const refinementLLM = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 2000,
    })

    // Create a LangChain chain for refinement
    const chain = RunnableSequence.from([
      promptTemplate,
      refinementLLM,
      parser
    ])

    // Execute the chain
    const result = await chain.invoke({
      query,
      candidatesText
    })
    
    // Reconstruct refined candidates based on LangChain ranking
    const refinedCandidates = result.refinedCandidates.map((item: { originalIndex: number }) => 
      candidates[item.originalIndex]
    ).filter(Boolean)

    const explanations = result.refinedCandidates.map((item: { explanation: string }) => item.explanation)

    return {
      refinedCandidates: refinedCandidates.length > 0 ? refinedCandidates : candidates,
      explanations,
      confidence: result.confidence || 0.8
    }
  } catch (error) {
    console.error('LangChain refinement error:', error)
    // Fallback to mock refinement if LangChain fails
    return getMockRefinement(query, candidates)
  }
}

// Fallback functions for when OpenAI is not available
function getMockClarifyingQuestions(
  query: string,
  schemaAnalysis: { fields?: Array<{ name: string }> }
) {
  const questions = []

  // Always ask about experience level
  questions.push({
    id: 'experience_level',
    type: 'multiple_choice' as const,
    question: 'What experience level are you looking for?',
    options: ['Entry Level (0-3 years)', 'Mid Level (4-7 years)', 'Senior Level (8-12 years)', 'Executive (13+ years)'],
  })

  // Location preference if schema has location data
  if (schemaAnalysis?.fields?.some((f) => f.name === 'location')) {
    questions.push({
      id: 'location_preference',
      type: 'text' as const,
      question: 'Any specific location or region preference?',
      placeholder: 'e.g., San Francisco, Remote, Boston',
    })
  }

  // Industry focus if schema has industry data
  if (schemaAnalysis?.fields?.some((f) => f.name === 'industry')) {
    questions.push({
      id: 'industry_focus',
      type: 'multiple_choice' as const,
      question: 'Which industries are most relevant?',
      options: ['Healthcare', 'Biotech', 'FinTech', 'AI/ML', 'Enterprise Software', 'Consumer'],
      multiple: true,
    })
  }

  // Company stage if relevant to the query
  if (query.toLowerCase().includes('startup') || query.toLowerCase().includes('founder')) {
    questions.push({
      id: 'company_stage',
      type: 'multiple_choice' as const,
      question: 'What company stage interests you most?',
      options: ['Pre-seed', 'Seed', 'Series A', 'Series B+', 'Public Company'],
      multiple: true,
    })
  }

  return questions
}

function getMockRefinement(
  query: string,
  candidates: Array<{
    id: string
    data: Record<string, unknown>
    score: number
    matchReasons?: string[]
  }>
) {
  // Mock LLM refinement with better explanations
  const refinedCandidates = [...candidates]
    .sort((a, b) => {
      // Re-rank based on relevance to query
      let scoreA = a.score
      let scoreB = b.score
      
      // Boost healthcare professionals for health-related queries
      if (query.toLowerCase().includes('health')) {
        if (a.data.industry === 'Healthcare') scoreA += 0.1
        if (b.data.industry === 'Healthcare') scoreB += 0.1
      }
      
      // Boost founders for founder-related queries
      if (query.toLowerCase().includes('founder')) {
        if (a.data.title?.toString().toLowerCase().includes('founder')) scoreA += 0.15
        if (b.data.title?.toString().toLowerCase().includes('founder')) scoreB += 0.15
      }
      
      return scoreB - scoreA
    })

  const explanations = refinedCandidates.map((candidate) => {
    const data = candidate.data
    const reasons = []
    
    if (data.industry === 'Healthcare' && query.toLowerCase().includes('health')) {
      reasons.push(`Strong healthcare industry background at ${data.company}`)
    }
    
    if (data.title?.toString().toLowerCase().includes('founder') || data.title?.toString().toLowerCase().includes('ceo')) {
      reasons.push(`Leadership experience as ${data.title}`)
    }
    
    if (data.location?.toString().includes('San Francisco') && query.toLowerCase().includes('sf')) {
      reasons.push(`Located in San Francisco for easy networking`)
    }
    
    const experienceYears = parseInt(data.experience?.toString().match(/\d+/)?.[0] || '0')
    if (experienceYears >= 8) {
      reasons.push(`${experienceYears} years of relevant experience`)
    }
    
    if (reasons.length === 0) {
      reasons.push(`Good overall match based on profile and experience`)
    }
    
    return `${data.name} is an excellent match because: ${reasons.join(', ')}. Their role as ${data.title} at ${data.company} aligns well with your search criteria.`
  })

  return {
    refinedCandidates,
    explanations,
    confidence: 0.87 + Math.random() * 0.1,
  }
}
