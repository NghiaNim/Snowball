import { NextResponse } from 'next/server'
import { listDatasetsFromGCS } from '@/lib/gcs-production'

export async function GET() {
  try {
    const datasets = await listDatasetsFromGCS()
    
    console.log(`✅ Retrieved ${datasets.length} datasets from Google Cloud Storage`)

    return NextResponse.json({
      success: true,
      datasets,
      count: datasets.length
    })

  } catch (error) {
    console.error('❌ List datasets API error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to list datasets',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    )
  }
}
