"""
Data parsing module for CSV and Excel files from Google Cloud Storage

This module handles:
1. Downloading files from GCS
2. Parsing CSV files with proper encoding
3. Parsing Excel files (XLSX/XLS)
4. Data cleaning and validation
"""

import io
import re
from typing import List, Dict, Any
import pandas as pd
import chardet
from google.cloud import storage

BUCKET_NAME = 'chief_of_staff_datasets'
RAW_DATASETS_FOLDER = 'raw_datasets'

def parse_dataset(dataset_id: str, storage_client: storage.Client) -> List[Dict[str, Any]]:
    """
    Parse dataset from Google Cloud Storage with proper encoding handling
    """
    try:
        print(f"📊 Loading dataset {dataset_id} from Google Cloud Storage")
        
        # Step 1: Download file from GCS
        file_buffer, file_name = download_dataset_buffer(dataset_id, storage_client)
        
        # Step 2: Determine file type and parse accordingly
        file_extension = file_name.lower().split('.')[-1] if '.' in file_name else 'csv'
        
        if file_extension == 'csv':
            people = parse_csv_buffer(file_buffer)
        elif file_extension in ['xlsx', 'xls']:
            people = parse_excel_buffer(file_buffer)
        else:
            raise Exception(f"Unsupported file format: {file_extension}")
        
        # Step 3: Clean and validate data
        cleaned_people = validate_and_clean_data(people)
        
        print(f"✅ Successfully parsed {len(cleaned_people)} records from {file_name}")
        return cleaned_people
        
    except Exception as error:
        print(f"❌ Error parsing dataset: {str(error)}")
        raise Exception(f"Failed to parse dataset: {str(error)}")

def download_dataset_buffer(dataset_path: str, storage_client: storage.Client) -> tuple:
    """
    Download dataset as buffer from GCS using full path and return buffer with filename
    """
    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        
        # Handle both full paths and legacy timestamp prefixes
        if dataset_path.startswith('raw_datasets/'):
            # Full GCS path provided (new approach)
            file_blob = bucket.blob(dataset_path)
            if not file_blob.exists():
                raise Exception(f"Dataset {dataset_path} not found in Google Cloud Storage")
            file_name = dataset_path.split('/')[-1]
        else:
            # Legacy: Find the file by datasetId (timestamp prefix)
            blobs = bucket.list_blobs(prefix=f"{RAW_DATASETS_FOLDER}/{dataset_path}")
            matching_files = list(blobs)
            if not matching_files:
                raise Exception(f"Dataset {dataset_path} not found in Google Cloud Storage")
            file_blob = matching_files[0]
            file_name = file_blob.name.split('/')[-1]
        
        print(f"📥 Downloading: {file_blob.name}")
        
        # Download as bytes
        file_buffer = file_blob.download_as_bytes()
        
        return file_buffer, file_name
        
    except Exception as error:
        raise Exception(f"Failed to download dataset: {str(error)}")

def parse_csv_buffer(buffer: bytes) -> List[Dict[str, Any]]:
    """
    Parse CSV buffer with proper encoding detection
    """
    try:
        print('📋 Parsing CSV file with encoding detection...')
        
        # Detect encoding
        detected = chardet.detect(buffer)
        encoding = detected.get('encoding', 'utf-8')
        confidence = detected.get('confidence', 0)
        
        print(f"📊 Detected encoding: {encoding} (confidence: {confidence:.2f})")
        
        # Try to decode with detected encoding, fallback to utf-8
        try:
            text_content = buffer.decode(encoding)
        except (UnicodeDecodeError, LookupError):
            print("⚠️ Falling back to UTF-8 encoding")
            text_content = buffer.decode('utf-8', errors='ignore')
        
        # Use pandas to parse CSV for robust handling
        csv_io = io.StringIO(text_content)
        
        # Read CSV with error handling
        df = pd.read_csv(
            csv_io,
            encoding=None,  # Let pandas auto-detect
            skipinitialspace=True,
            on_bad_lines='skip',  # Skip problematic lines
            dtype=str  # Read everything as string initially
        )
        
        # Convert to list of dictionaries
        people = df.to_dict('records')
        
        print(f"✅ CSV parsing completed: {len(people)} records")
        return people
        
    except Exception as error:
        print(f"❌ CSV parsing error: {str(error)}")
        raise Exception(f"CSV parsing failed: {str(error)}")

def parse_excel_buffer(buffer: bytes) -> List[Dict[str, Any]]:
    """
    Parse Excel buffer using pandas
    """
    try:
        print('📋 Parsing Excel file...')
        
        # Use pandas to read Excel file
        excel_io = io.BytesIO(buffer)
        
        # Read the first sheet
        df = pd.read_excel(
            excel_io,
            engine='openpyxl',  # For .xlsx files
            dtype=str,  # Read everything as string initially
            na_filter=False  # Don't convert empty strings to NaN
        )
        
        # Convert to list of dictionaries
        people = df.to_dict('records')
        
        print(f"✅ Excel parsing completed: {len(people)} records")
        return people
        
    except Exception as error:
        print(f"❌ Excel parsing error: {str(error)}")
        
        # Try with xlrd engine for older .xls files
        try:
            print("🔄 Trying xlrd engine for legacy Excel format...")
            excel_io = io.BytesIO(buffer)
            df = pd.read_excel(
                excel_io,
                engine='xlrd',
                dtype=str,
                na_filter=False
            )
            people = df.to_dict('records')
            print(f"✅ Excel parsing completed with xlrd: {len(people)} records")
            return people
            
        except Exception as xlrd_error:
            print(f"❌ xlrd parsing also failed: {str(xlrd_error)}")
            raise Exception(f"Excel parsing failed: {str(error)}")

def validate_and_clean_data(people: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Validate and clean person data
    """
    print("🧹 Cleaning and validating data...")
    
    cleaned_people = []
    
    for person in people:
        # Clean up the person data
        clean_person = {}
        has_meaningful_data = False
        
        for key, value in person.items():
            # Clean up field names and values
            if pd.isna(value) or value == '' or str(value).strip() == '':
                continue
                
            # Clean field name
            clean_key = clean_field_name(str(key))
            if not clean_key:
                continue
                
            # Clean value
            clean_value = clean_field_value(str(value))
            if not clean_value:
                continue
                
            clean_person[clean_key] = clean_value
            has_meaningful_data = True
        
        # Only include records with at least some meaningful data
        if has_meaningful_data and len(clean_person) >= 2:
            cleaned_people.append(clean_person)
    
    print(f"✅ Data cleaning completed: {len(cleaned_people)} valid records")
    return cleaned_people

def clean_field_name(field_name: str) -> str:
    """
    Clean and standardize field names
    """
    if not field_name or field_name.strip() == '':
        return ''
    
    # Remove special characters and normalize
    clean_name = re.sub(r'[^\w\s-]', '', field_name.strip())
    
    # Replace spaces and dashes with underscores
    clean_name = re.sub(r'[\s-]+', '_', clean_name)
    
    # Convert to lowercase
    clean_name = clean_name.lower()
    
    # Remove leading/trailing underscores
    clean_name = clean_name.strip('_')
    
    return clean_name if clean_name else ''

def clean_field_value(value: str) -> str:
    """
    Clean and standardize field values
    """
    if not value or str(value).strip() == '':
        return ''
    
    # Convert to string and strip whitespace
    clean_value = str(value).strip()
    
    # Remove excessive whitespace
    clean_value = re.sub(r'\s+', ' ', clean_value)
    
    # Remove null-like values
    null_values = ['null', 'none', 'n/a', 'na', 'nan', 'undefined', '-']
    if clean_value.lower() in null_values:
        return ''
    
    return clean_value if clean_value else ''
