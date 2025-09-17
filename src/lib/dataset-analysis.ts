import * as XLSX from 'xlsx'

export interface DatasetField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date'
  sampleValues: string[]
}

export interface DatasetSchema {
  fields: DatasetField[]
  totalRows: number
  sampleData: Record<string, unknown>[]
}

/**
 * Analyze a CSV/Excel file to extract schema information for the LLM
 */
export async function analyzeDatasetSchema(file: File): Promise<DatasetSchema> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const result = e.target?.result
        let data: string[][]
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          const text = result as string
          data = parseCSV(text)
        } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
          const arrayBuffer = result as ArrayBuffer
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
        } else {
          throw new Error('Unsupported file type')
        }
        
        const schema = analyzeData(data)
        resolve(schema)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    
    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  })
}

/**
 * Parse CSV text into 2D array
 */
function parseCSV(text: string): string[][] {
  const lines = text.split('\n').filter(line => line.trim())
  return lines.map(line => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  })
}

/**
 * Analyze parsed data to extract schema
 */
function analyzeData(data: string[][]): DatasetSchema {
  if (data.length < 2) {
    throw new Error('Dataset must have at least a header row and one data row')
  }
  
  const headers = data[0]
  const rows = data.slice(1).filter(row => row.length === headers.length)
  const totalRows = rows.length
  
  // Analyze each field
  const fields: DatasetField[] = headers.map((header, index) => {
    const columnValues = rows.map(row => row[index] || '').filter(val => val.trim())
    const sampleValues = [...new Set(columnValues)].slice(0, 5) // Unique sample values
    const type = inferColumnType(columnValues)
    
    return {
      name: header.trim(),
      type,
      sampleValues
    }
  })
  
  // Get sample data (first 3 rows)
  const sampleData = rows.slice(0, 3).map(row => {
    const obj: Record<string, unknown> = {}
    headers.forEach((header, index) => {
      obj[header.trim()] = row[index] || ''
    })
    return obj
  })
  
  return {
    fields,
    totalRows,
    sampleData
  }
}

/**
 * Infer the data type of a column based on its values
 */
function inferColumnType(values: string[]): 'string' | 'number' | 'boolean' | 'date' {
  if (values.length === 0) return 'string'
  
  // Check if all values are numbers
  const numberValues = values.filter(val => !isNaN(parseFloat(val)) && isFinite(parseFloat(val)))
  if (numberValues.length > values.length * 0.8) {
    return 'number'
  }
  
  // Check if all values are booleans
  const booleanValues = values.filter(val => 
    val.toLowerCase() === 'true' || 
    val.toLowerCase() === 'false' || 
    val === '1' || 
    val === '0'
  )
  if (booleanValues.length > values.length * 0.8) {
    return 'boolean'
  }
  
  // Check if values look like dates
  const dateValues = values.filter(val => {
    const date = new Date(val)
    return !isNaN(date.getTime()) && val.length > 4
  })
  if (dateValues.length > values.length * 0.6) {
    return 'date'
  }
  
  return 'string'
}

/**
 * Convert schema to a format suitable for the Cloud Function
 */
export function formatSchemaForAI(schema: DatasetSchema): Record<string, unknown> {
  return {
    fields: schema.fields.map(field => ({
      name: field.name,
      type: field.type,
      sampleValues: field.sampleValues
    })),
    totalRows: schema.totalRows,
    sampleData: schema.sampleData
  }
}
