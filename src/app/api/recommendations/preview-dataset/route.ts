import { NextRequest, NextResponse } from 'next/server'
import { downloadDatasetFromGCS } from '@/lib/gcs-production'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gcsPath = searchParams.get('gcsPath')

    if (!gcsPath) {
      return NextResponse.json(
        { error: 'GCS path is required' },
        { status: 400 }
      )
    }

    // Download the dataset from GCS
    const buffer = await downloadDatasetFromGCS(gcsPath)
    
    // Determine file type from path
    const isExcel = gcsPath.toLowerCase().includes('.xlsx') || gcsPath.toLowerCase().includes('.xls')
    
    let preview: string[] = []
    
    if (isExcel) {
      // Parse Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // Convert to CSV format for preview
      const csvData = XLSX.utils.sheet_to_csv(worksheet)
      preview = csvData.split('\n').slice(0, 10) // First 10 rows
    } else {
      // Parse CSV file
      const csvData = buffer.toString('utf-8')
      preview = csvData.split('\n').slice(0, 10) // First 10 rows
    }

    // Filter out empty lines
    preview = preview.filter(line => line.trim().length > 0)

    return NextResponse.json({
      success: true,
      preview,
      rowCount: preview.length
    })

  } catch (error) {
    console.error('❌ Preview dataset API error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to preview dataset',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    )
  }
}
