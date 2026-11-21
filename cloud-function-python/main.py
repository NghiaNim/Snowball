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
    Execute the full search pipeline with detailed logging
    """
    def log_stage(stage_name: str, message: str, progress: int = None):
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        elapsed = time.time() - start_time
        progress_str = f" [{progress}%]" if progress is not None else ""
        print(f'🕐 {timestamp} | ⏱️ {elapsed:.1f}s | {stage_name}{progress_str}: {message}')
        
        # Update database with progress if query_id provided
        if query_id:
            try:
                update_query_progress(query_id, stage_name, message, progress or 0, False)
            except Exception as e:
                print(f'⚠️  Failed to update progress: {str(e)}')
    
    try:
        log_stage('🚀 CRITERIA', f'Starting search pipeline for query: "{query}"', 0)
        log_stage('📝 CRITERIA', 'Analyzing requirements and translating query to search criteria...', 10)
        
        # Stage 2: Query to Criteria Translation
        criteria = translate_query_to_criteria(query, dataset_schema, follow_up_answers)
        criteria_summary = {k: v for k, v in criteria.items() if k in ['primary_focus', 'industries', 'experience_level']}
        log_stage('📝 CRITERIA', f'✅ Generated search criteria: {json.dumps(criteria_summary, indent=2)}', 20)

        log_stage('📊 DATASET', f'Loading and parsing dataset: {dataset_id}...', 25)
        
        # Stage 3: Load and parse dataset
        people = parse_dataset(dataset_id, storage_client)
        log_stage('📊 DATASET', f'✅ Successfully loaded {len(people):,} person records from dataset', 35)

        log_stage('🔍 BM25', f'Starting BM25 text search across {len(people):,} records (top_k={top_k})...', 40)
        
        # Stage 4: BM25 Search
        bm25_results = search_with_bm25(people, criteria, top_k)
        log_stage('🔍 BM25', f'✅ BM25 search completed: {len(bm25_results)} candidates found', 60)

        log_stage('🧠 LLM', f'Starting GPT-4o analysis of top {len(bm25_results)} candidates...', 70)
        
        # Stage 5: LLM Refinement  
        refined_results = refine_candidates_with_llm(bm25_results, criteria, limit)
        log_stage('🧠 LLM', f'✅ GPT-4o analysis completed: {len(refined_results)} final recommendations', 90)

        processing_time = time.time() - start_time
        log_stage('🎯 LLM', f'✅ Search pipeline completed in {processing_time:.1f}s', 100)

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
        log_stage('❌ LLM', f'Pipeline failed after {elapsed:.1f}s: {str(error)}')
        
        # Update database with error if query_id provided
        if query_id:
            try:
                update_query_progress(query_id, 'error', f'Search failed: {str(error)}', 0, True)
            except Exception as e:
                print(f'⚠️  Failed to update error status: {str(e)}')
        
        raise error

# Removed get_api_base_url function - no longer needed since we update Supabase directly

def update_query_progress(query_id: str, stage: str, message: str, progress: int, completed: bool):
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
        
        update_data = {
            'status': status,
            'metadata': {
                'current_stage': stage,
                'stage_message': message,
                'progress': progress,
                'last_update': datetime.now().isoformat()
            },
            'updated_at': datetime.now().isoformat()
        }
        
        print(f"🔄 Updating query {query_id} in Supabase: {stage} ({progress}%)")
        
        result = supabase.table('query_history').update(update_data).eq('id', query_id).execute()
        
        if result.data:
            print(f"✅ Progress update successful")
        else:
            print(f"⚠️ No rows updated - query {query_id} may not exist")
            
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
