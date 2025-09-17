import { NextRequest, NextResponse } from 'next/server'
import { deleteDatasetFromGCS } from '@/lib/gcs-production'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gcsPath = searchParams.get('gcsPath')

    if (!gcsPath) {
      return NextResponse.json(
        { error: 'GCS path is required' },
        { status: 400 }
      )
    }

    // Delete from Google Cloud Storage
    await deleteDatasetFromGCS(gcsPath)

    console.log(`✅ Successfully deleted dataset: ${gcsPath}`)

    return NextResponse.json({
      success: true,
      message: 'Dataset deleted successfully from Google Cloud Storage'
    })

  } catch (error) {
    console.error('❌ Delete dataset API error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete dataset',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    )
  }
}
