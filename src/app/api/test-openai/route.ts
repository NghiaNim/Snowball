import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Test OpenAI API directly without LangChain
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not found in environment variables' },
        { status: 400 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    console.log('Testing OpenAI API with key:', process.env.OPENAI_API_KEY.substring(0, 10) + '...')

    // Test with a simple request
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use the standard model name
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with a simple JSON object.'
        },
        {
          role: 'user',
          content: 'Generate a test response with your model name and current status. Return JSON format: {"model": "model-name", "status": "working", "message": "test message"}'
        }
      ],
      temperature: 0.3,
      max_tokens: 100,
    })

    const content = response.choices[0]?.message?.content
    console.log('OpenAI Response:', content)

    return NextResponse.json({
      success: true,
      model_used: response.model,
      response: content,
      usage: response.usage,
      api_key_prefix: process.env.OPENAI_API_KEY.substring(0, 10) + '...',
      timestamp: new Date().toISOString()
    })

  } catch (error: unknown) {
    console.error('OpenAI API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      error_type: (error as Record<string, unknown>)?.type || 'unknown',
      error_code: (error as Record<string, unknown>)?.code || 'unknown',
      api_key_prefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...' || 'not found',
      timestamp: new Date().toISOString()
    }, { 
      status: (error as Record<string, unknown>)?.status as number || 500 
    })
  }
}

// Test different models
export async function POST(req: NextRequest) {
  try {
    const { model, message } = await req.json()
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not found' },
        { status: 400 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    console.log(`Testing model: ${model || 'gpt-4o-mini'}`)

    // Use appropriate token parameter based on model
    const modelToUse = model || 'gpt-4o-mini'
    const tokenParam = modelToUse.startsWith('gpt-5') 
      ? { max_completion_tokens: 100 }
      : { max_tokens: 100 }
    
    // GPT-5 only supports default temperature (1), other models can use custom temperature
    const temperatureParam = modelToUse.startsWith('gpt-5') 
      ? {} // Omit temperature for GPT-5 to use default
      : { temperature: 0.3 }
    
    const response = await openai.chat.completions.create({
      model: modelToUse,
      messages: [
        {
          role: 'user',
          content: message || 'Say hello and tell me which model you are'
        }
      ],
      ...temperatureParam,
      ...tokenParam,
    })

    return NextResponse.json({
      success: true,
      model_requested: model || 'gpt-4o-mini',
      model_used: response.model,
      response: response.choices[0]?.message?.content,
      usage: response.usage,
      timestamp: new Date().toISOString()
    })

  } catch (error: unknown) {
    console.error('Model test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      error_type: (error as Record<string, unknown>)?.type || 'unknown',
      timestamp: new Date().toISOString()
    }, { 
      status: (error as Record<string, unknown>)?.status as number || 500 
    })
  }
}
