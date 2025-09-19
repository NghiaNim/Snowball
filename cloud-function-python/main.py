"""
Multi-stage AI recommendation system using Python and OkapiBM25

Cloud Function entry point for the recommendation system.
Handles HTTP requests and orchestrates the multi-stage pipeline:
1. Follow-up questions generation
2. Query to criteria translation
3. BM25 text search
4. LLM contextual refinement
5. Ranked results return
"""

import os
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
from flask import Request, jsonify
from flask_cors import cross_origin
import functions_framework
from google.cloud import storage
from supabase import create_client, Client

from ai_agent import generate_follow_up_questions, translate_query_to_criteria
from bm25_search import search_with_bm25
from llm_refinement import refine_candidates_with_llm
from data_parser import parse_dataset

# Initialize Google Cloud Storage
storage_client = storage.Client()

# Initialize Supabase client
def get_supabase_client() -> Client:
    """Initialize Supabase client with service role key"""
    # Try both possible environment variable names
    supabase_url = os.environ.get('SUPABASE_URL') or os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    supabase_service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_service_key:
        print("⚠️ Supabase credentials not configured - database updates disabled")
        print(f"   SUPABASE_URL: {'✅' if supabase_url else '❌'}")
        print(f"   SUPABASE_SERVICE_ROLE_KEY: {'✅' if supabase_service_key else '❌'}")
        return None
    
    try:
        print(f"🔗 Connecting to Supabase: {supabase_url}")
        client = create_client(supabase_url, supabase_service_key)
        print("✅ Supabase client initialized successfully")
        return client
    except Exception as error:
        print(f"❌ Failed to initialize Supabase client: {str(error)}")
        print(f"   Error type: {type(error).__name__}")
        # Import version info for debugging
        try:
            import supabase
            print(f"   Supabase version: {supabase.__version__}")
        except:
            print("   Could not determine Supabase version")
        try:
            import httpx
            print(f"   httpx version: {httpx.__version__}")
        except:
            print("   Could not determine httpx version")
        return None

# In-memory storage for async results (use Redis/Firestore in production)
results_store = {}

@functions_framework.http
@cross_origin()
def get_recommendations(request: Request):
    """
    Main Cloud Function entry point
    
    Supports two stages:
    - 'questions': Generate follow-up questions for query refinement
    - 'search': Execute full search pipeline with BM25 + LLM analysis
    """
    
    start_time = time.time()
    
    try:
        # Handle CORS preflight
        if request.method == 'OPTIONS':
            return ('', 204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            })
        
        if request.method == 'GET':
            # Health check endpoint
            return handle_health_check()
        
        # Parse request body
        request_json = request.get_json(silent=True)
        if not request_json:
            return jsonify({
                'success': False,
                'error': 'Invalid JSON in request body'
            }), 400
        
        stage = request_json.get('stage', 'search')
        query = request_json.get('query')
        dataset_id = request_json.get('datasetId')
        dataset_schema = request_json.get('datasetSchema')
        follow_up_answers = request_json.get('followUpAnswers', {})
        limit = request_json.get('limit', 10)
        top_k = request_json.get('topK', 50)
        query_id = request_json.get('queryId')  # ID to update in database
        
        print(f"🚀 Starting {stage} stage for query: '{query}'")
        
        # === STAGE 1: FOLLOW-UP QUESTIONS ===
        if stage == 'questions':
            if not query:
                return jsonify({
                    'success': False,
                    'error': 'Query is required for follow-up questions'
                }), 400
            
            questions = generate_follow_up_questions(query, dataset_schema)
            
            return jsonify({
                'success': True,
                'stage': 'questions',
                'query': query,
                'questions': questions,
                'metadata': {
                    'processing_time': time.time() - start_time
                }
            })
        
        # === STAGE 2-5: FULL SEARCH PIPELINE ===
        elif stage == 'search':
            if not query or not dataset_id:
                return jsonify({
                    'success': False,
                    'error': 'Missing required parameters: query and datasetId'
                }), 400
            
            # Execute the full pipeline
            results = execute_search_pipeline(
                query, dataset_id, dataset_schema, 
                follow_up_answers, limit, top_k, start_time, query_id
            )
            
            # Update database if query_id provided
            if query_id and results.get('success'):
                try:
                    update_query_in_database(query_id, results)
                except Exception as db_error:
                    print(f"⚠️ Failed to update database: {str(db_error)}")
                    # Don't fail the whole request for database errors
            
            return jsonify(results)
        
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid stage. Must be "questions" or "search"'
            }), 400
            
    except Exception as error:
        print(f"❌ Error in get_recommendations: {str(error)}")
        return jsonify({
            'success': False,
            'error': str(error),
            'stage': 'error'
        }), 500

def handle_health_check():
    """Health check endpoint"""
    try:
        # Test Google Cloud Storage connection
        buckets = list(storage_client.list_buckets(max_results=1))
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'services': {
                'storage': 'connected',
                'openai': 'configured' if os.getenv('OPENAI_API_KEY') else 'not_configured'
            },
            'version': '2.0.0-python-bm25'
        })
    except Exception as error:
        return jsonify({
            'status': 'unhealthy',
            'error': str(error),
            'timestamp': datetime.now().isoformat()
        }), 500

def execute_search_pipeline(
    query: str, 
    dataset_id: str, 
    dataset_schema: Optional[Dict], 
    follow_up_answers: Dict, 
    limit: int, 
    top_k: int, 
    start_time: float,
    query_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Execute the full search pipeline with detailed logging and progress updates
    """
    def log_stage(stage_name: str, message: str, progress: int = None, substep_data: Dict = None):
        timestamp = datetime.now().strftime("%H:%M:%S")[:-3]
        elapsed = time.time() - start_time
        progress_str = f" [{progress}%]" if progress is not None else ""
        
        # Simplified logging - less verbose
        print(f'🕐 {elapsed:.1f}s | {stage_name}{progress_str}: {message}')
        
        # Only log key data points, not everything
        if substep_data and any(key in substep_data for key in ['filtered_count', 'candidates_found', 'final_results', 'error_type']):
            key_data = {k: v for k, v in substep_data.items() if k in ['filtered_count', 'candidates_found', 'final_results', 'hard_constraints', 'error_type']}
            if key_data:
                print(f'   📊 Key data: {json.dumps(key_data)}')
        
        # Update database with progress if query_id provided
        if query_id:
            try:
                update_query_progress(query_id, stage_name, message, progress or 0, False, substep_data)
            except Exception as e:
                print(f'⚠️  Progress update failed: {str(e)}')
    
    try:
        log_stage('🚀 CRITERIA', f'Starting search pipeline for query: "{query}"', 0, {
            'query': query,
            'dataset_id': dataset_id,
            'limit': limit,
            'top_k': top_k
        })
        
        # Stage 2A: Smart Query Analysis
        log_stage('📝 CRITERIA', 'Analyzing query with advanced AI...', 10)
        
        # Stage 2B: Intelligent Criteria Generation
        criteria = translate_query_to_criteria(query, dataset_schema, follow_up_answers)
        hard_constraints = criteria.get('hardConstraints', {})
        log_stage('📝 CRITERIA', f'✅ Intelligent criteria generated', 20, {
            'hard_constraints': {k: v for k, v in hard_constraints.items() if v}
        })

        # Stage 3: Dataset Loading
        log_stage('📊 DATASET', f'Loading dataset...', 30)
        people = parse_dataset(dataset_id, storage_client)
        log_stage('📊 DATASET', f'✅ Dataset loaded: {len(people):,} records', 35)

        # Stage 4: Smart Search Algorithm
        log_stage('🔍 BM25', f'Running intelligent search...', 50)
        bm25_results = search_with_bm25(people, criteria, top_k)
        log_stage('🔍 BM25', f'✅ Found {len(bm25_results)} candidates', 60, {
            'candidates_found': len(bm25_results)
        })

        # Stage 5: AI Analysis
        log_stage('🧠 LLM', f'Analyzing candidates with AI...', 70)
        refined_results = refine_candidates_with_llm(bm25_results, criteria, limit)
        log_stage('🧠 LLM', f'✅ Analysis complete', 90, {
            'final_results': len(refined_results)
        })

        processing_time = time.time() - start_time
        log_stage('🎯 COMPLETED', f'✅ Search completed in {processing_time:.1f}s', 100, {
            'final_results': len(refined_results)
        })

        # Final database update
        if query_id:
            try:
                update_query_progress(query_id, 'completed', 'Search completed successfully', 100, True)
            except Exception as e:
                print(f'⚠️  Failed to update completion status: {str(e)}')

        return {
            'success': True,
            'stage': 'completed',
            'query': query,
            'criteria_used': criteria,
            'recommendations': refined_results,
            'metadata': {
                'total_dataset_size': len(people),
                'bm25_candidates': len(bm25_results),
                'final_results': len(refined_results),
                'processing_time': processing_time,
                'timestamp': datetime.now().isoformat(),
                'stages_completed': [
                    'criteria_generation',
                    'dataset_loading', 
                    'bm25_search',
                    'llm_refinement'
                ]
            }
        }

    except Exception as error:
        elapsed = time.time() - start_time
        import traceback
        error_details = {
            'error_type': type(error).__name__,
            'error_message': str(error),
            'traceback': traceback.format_exc(),
            'elapsed_time': round(elapsed, 2),
            'stage_reached': 'unknown'
        }
        
        log_stage('❌ ERROR', f'Pipeline failed after {elapsed:.1f}s: {str(error)}', 0, error_details)
        
        # Update database with detailed error if query_id provided
        if query_id:
            try:
                update_query_progress(query_id, 'error', f'Search failed: {str(error)}', 0, True, error_details)
            except Exception as e:
                print(f'⚠️  Failed to update error status: {str(e)}')
        
        raise error

# Helper functions for enhanced logging
def analyze_dataset_fields(sample_people: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze dataset field distribution and types"""
    if not sample_people:
        return {}
    
    field_stats = {}
    for person in sample_people:
        for field, value in person.items():
            if field not in field_stats:
                field_stats[field] = {'count': 0, 'types': set(), 'samples': []}
            
            field_stats[field]['count'] += 1
            field_stats[field]['types'].add(type(value).__name__)
            if len(field_stats[field]['samples']) < 3 and value:
                field_stats[field]['samples'].append(str(value)[:50])
    
    # Convert to serializable format
    return {
        field: {
            'coverage': stats['count'] / len(sample_people),
            'types': list(stats['types']),
            'samples': stats['samples'][:2]  # Limit samples
        }
        for field, stats in field_stats.items()
    }

def get_recommendation_distribution(results: List[Dict[str, Any]]) -> Dict[str, int]:
    """Get distribution of recommendation types"""
    distribution = {}
    for result in results:
        rec = result.get('recommendation', 'Unknown')
        distribution[rec] = distribution.get(rec, 0) + 1
    return distribution

def refine_candidates_with_llm_enhanced(
    bm25_results: List[Dict[str, Any]], 
    criteria: Dict[str, Any], 
    final_limit: int,
    log_stage_func,
    start_time: float
) -> List[Dict[str, Any]]:
    """Enhanced LLM refinement with detailed progress logging"""
    from llm_refinement import refine_candidates_with_llm
    
    # Log LLM processing details
    batch_size = 5
    total_batches = (len(bm25_results) + batch_size - 1) // batch_size
    
    # Process with detailed logging
    progress_base = 70
    progress_range = 15  # 70% to 85%
    
    for i in range(0, len(bm25_results), batch_size):
        batch_num = (i // batch_size) + 1
        current_progress = progress_base + int((batch_num / total_batches) * progress_range)
        
        log_stage_func('🧠 LLM', f'Processing batch {batch_num}/{total_batches} with GPT-4o...', current_progress, {
            'batch_number': batch_num,
            'total_batches': total_batches,
            'candidates_in_batch': min(batch_size, len(bm25_results) - i),
            'llm_model': 'gpt-4o'
        })
    
    # Call the actual refinement function
    results = refine_candidates_with_llm(bm25_results, criteria, final_limit)
    
    return results

# Removed get_api_base_url function - no longer needed since we update Supabase directly

def update_query_progress(query_id: str, stage: str, message: str, progress: int, completed: bool, substep_data: Dict = None):
    """Update query progress directly in Supabase database"""
    try:
        supabase = get_supabase_client()
        if not supabase:
            print(f"🔍 Progress update skipped - Supabase not configured")
            return
        
        # Determine status based on stage and completion
        if stage == 'error':
            status = 'error'
        elif completed:
            status = 'completed'
        else:
            status = 'processing'
        
        # Build enhanced metadata
        metadata = {
            'current_stage': stage,
            'stage_message': message,
            'progress': progress,
            'last_update': datetime.now().isoformat()
        }
        
        # Add substep data if provided
        if substep_data:
            metadata['substep_data'] = substep_data
            
        update_data = {
            'status': status,
            'metadata': metadata,
            'updated_at': datetime.now().isoformat()
        }
        
        print(f"🔄 Updating query {query_id} in Supabase: {stage} ({progress}%)")
        print(f"📊 Metadata being stored: {metadata}")
        
        result = supabase.table('query_history').update(update_data).eq('id', query_id).execute()
        
        if result.data:
            print(f"✅ Progress update successful - {len(result.data)} rows updated")
            print(f"🔍 Updated data: {result.data[0] if result.data else 'No data'}")
        else:
            print(f"⚠️ No rows updated - query {query_id} may not exist")
            print(f"🔍 Update data was: {update_data}")
            
    except Exception as error:
        print(f"⚠️ Progress update error: {str(error)}")
        # Don't fail the whole function for progress update errors

def store_results(result_id: str, results: Dict[str, Any]) -> None:
    """Store results for later retrieval (simple in-memory storage)"""
    results_store[result_id] = results
    # In production, use Redis or Firestore with TTL

def get_stored_results(result_id: str) -> Optional[Dict[str, Any]]:
    """Get stored results by ID"""
    return results_store.get(result_id)

def update_query_in_database(query_id: str, results: Dict[str, Any]) -> None:
    """Update query status and results directly in Supabase database"""
    try:
        supabase = get_supabase_client()
        if not supabase:
            print(f"🔍 Database update skipped - Supabase not configured")
            return
        
        # Prepare the update payload  
        if results.get('success'):
            # Map the cloud function response to the expected database format
            recommendations = results.get('recommendations', [])
            
            update_data = {
                'status': 'completed',
                'results': recommendations,
                'metadata': results.get('metadata', {}),
                'updated_at': datetime.now().isoformat()
            }
            print(f"🔄 Updating query {query_id} with {len(recommendations)} results")
        else:
            update_data = {
                'status': 'error',
                'metadata': {
                    'error': results.get('error', 'Unknown error occurred'),
                    'last_update': datetime.now().isoformat()
                },
                'updated_at': datetime.now().isoformat()
            }
            print(f"🔄 Updating query {query_id} with error status")
        
        # Update the database directly
        result = supabase.table('query_history').update(update_data).eq('id', query_id).execute()
        
        if result.data:
            print(f"✅ Successfully updated query {query_id} in database")
        else:
            print(f"⚠️ No rows updated - query {query_id} may not exist")
            
    except Exception as error:
        print(f"❌ Database update error: {str(error)}")
        # Don't re-raise - we don't want to fail the whole function for database issues
