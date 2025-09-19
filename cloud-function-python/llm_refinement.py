"""
LLM-based candidate refinement and contextual analysis

This module uses OpenAI's GPT models to provide deep contextual
analysis of candidates beyond simple keyword matching.
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

# Initialize LangChain OpenAI client
try:
    api_key = os.getenv('OPENAI_API_KEY')
    if api_key and api_key.startswith('sk-') and len(api_key) > 20:
        llm = ChatOpenAI(
            model="gpt-4o",
            api_key=api_key,
            temperature=0.7  # GPT-4o optimal temperature
        )
        print(f'✅ LangChain OpenAI client initialized successfully')
    else:
        llm = None
        print(f'⚠️ OpenAI API key not configured properly. Key: {api_key[:10] if api_key else "None"}...')
except Exception as e:
    llm = None
    print(f'⚠️ Failed to initialize LangChain OpenAI client: {str(e)}')

def refine_candidates_with_llm(
    bm25_results: List[Dict[str, Any]], 
    criteria: Dict[str, Any], 
    final_limit: int
) -> List[Dict[str, Any]]:
    """
    Use LLM to analyze and refine candidate matches with contextual understanding
    """
    if not llm:
        print('⚠️ LangChain not configured, using fallback refinement')
        return fallback_refinement(bm25_results, criteria, final_limit)

    try:
        print(f'🧠 Starting LLM refinement on {len(bm25_results)} candidates')
        
        # Process candidates in batches to avoid token limits
        batch_size = 5
        refined_candidates = []
        
        for i in range(0, len(bm25_results), batch_size):
            batch = bm25_results[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (len(bm25_results) + batch_size - 1) // batch_size
            
            print(f'🔍 Processing batch {batch_num}/{total_batches}')
            
            batch_results = process_batch_with_llm(batch, criteria)
            refined_candidates.extend(batch_results)
        
        # Sort by combined score and return top results
        final_results = sorted(
            refined_candidates, 
            key=lambda x: x['overall_score'], 
            reverse=True
        )[:final_limit]
        
        print(f'✅ LLM refinement completed: {len(final_results)} final candidates')
        return final_results
        
    except Exception as error:
        print(f'❌ Error in LLM refinement: {str(error)}')
        # Fallback to BM25 results if LLM fails
        return fallback_refinement(bm25_results, criteria, final_limit)

def process_batch_with_llm(
    candidate_batch: List[Dict[str, Any]], 
    criteria: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Process a batch of candidates with LLM analysis
    """
    system_prompt = f"""
You are an expert recruiter and talent evaluator. Your job is to analyze candidates and provide detailed assessments of their fit for a specific search.

CRITICAL: These candidates have already passed hard constraint filtering. Your job is to rank and assess them for soft criteria and overall fit.

SEARCH CRITERIA:
{json.dumps(criteria, indent=2)}

HARD CONSTRAINTS (already satisfied):
{json.dumps(criteria.get('hardConstraints', {}), indent=2)}

For each candidate, provide:
1. Detailed relevance analysis based on soft criteria and contextual fit
2. Specific reasons why they are a good/poor match beyond the hard constraints
3. Assessment of cultural fit, working style, and career stage alignment
4. Overall relevance score (0.0 to 1.0) - be critical and use the full range
5. Key strengths and potential concerns

SCORING GUIDELINES:
- 0.9-1.0: Perfect match, exceptional candidate
- 0.7-0.8: Strong match, highly recommended
- 0.5-0.6: Good match, recommended with caveats
- 0.3-0.4: Weak match, consider carefully
- 0.0-0.2: Poor match, not recommended

Be thorough but concise. Focus on qualitative insights that go beyond keyword matching.

Return your analysis as a JSON object with this structure:
{{
  "candidates": [
    {{
      "candidate_id": "string",
      "llm_relevance_score": 0.85,
      "detailed_analysis": "Comprehensive analysis of why this candidate fits...",
      "match_strengths": ["Strong healthcare experience", "Startup founding background"],
      "potential_concerns": ["Limited enterprise experience", "Geographic mismatch"],
      "cultural_fit_assessment": "Strong alignment with startup mentality...",
      "recommendation": "Highly recommended" // or "Recommended" | "Consider with caveats" | "Not recommended"
    }}
  ]
}}
"""

    candidate_data = []
    for candidate in candidate_batch:
        candidate_data.append({
            'id': candidate['id'],
            'bm25_score': candidate['bm25_score'],
            'profile': candidate['data'],
            'preliminary_reasons': candidate['preliminary_reasons']
        })

    user_prompt = f"""
Analyze these {len(candidate_batch)} candidates for fit with the search criteria:

{json.dumps(candidate_data, indent=2)}

Provide detailed analysis for each candidate.
"""

    try:
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = llm.invoke(messages)
        content = response.content
        
        print(f'🔍 Raw OpenAI LLM response: {repr(content)}')
        
        # Check if content is empty or None
        if not content or content.strip() == '':
            print('⚠️ OpenAI returned empty content for LLM analysis, using fallback')
            return [create_fallback_candidate(candidate, criteria) for candidate in candidate_batch]
        
        # Clean the content - sometimes AI adds extra text before/after JSON
        content = content.strip()
        
        # Try to find JSON in the response
        start_brace = content.find('{')
        end_brace = content.rfind('}')
        
        if start_brace == -1 or end_brace == -1:
            print('⚠️ No JSON braces found in LLM response, using fallback')
            return [create_fallback_candidate(candidate, criteria) for candidate in candidate_batch]
            
        json_content = content[start_brace:end_brace + 1]
        print(f'🔍 Extracted LLM JSON: {json_content[:500]}...')  # First 500 chars
        
        # Parse JSON response
        analysis = json.loads(json_content)
        
        # Validate the result has expected structure
        if not isinstance(analysis, dict) or 'candidates' not in analysis:
            print('⚠️ Invalid LLM response structure, using fallback')
            return [create_fallback_candidate(candidate, criteria) for candidate in candidate_batch]
        
        # Combine LLM analysis with original candidate data
        enhanced_candidates = []
        for candidate in candidate_batch:
            llm_analysis = next(
                (c for c in analysis['candidates'] if c['candidate_id'] == candidate['id']), 
                None
            )
            
            if not llm_analysis:
                print(f"⚠️ No LLM analysis found for candidate {candidate['id']}")
                enhanced_candidates.append(create_fallback_candidate(candidate, criteria))
                continue
            
            # Calculate combined score
            weights = criteria.get('weights', {
                'bm25Score': 0.4, 
                'llmRelevance': 0.5, 
                'fieldMatches': 0.1
            })
            
            field_match_score = len(candidate.get('field_matches', {})) * 0.1
            
            overall_score = (
                (candidate['bm25_score'] * weights['bm25Score']) +
                (llm_analysis['llm_relevance_score'] * weights['llmRelevance']) +
                (field_match_score * weights['fieldMatches'])
            )
            
            enhanced_candidates.append({
                'id': candidate['id'],
                'data': candidate['data'],
                'bm25_score': candidate['bm25_score'],
                'llm_relevance_score': llm_analysis['llm_relevance_score'],
                'overall_score': round(overall_score, 3),
                'match_score': round(overall_score, 3),  # Frontend expects match_score
                'llm_analysis': llm_analysis['detailed_analysis'],
                'match_strengths': llm_analysis.get('match_strengths', []),
                'potential_concerns': llm_analysis.get('potential_concerns', []),
                'cultural_fit_assessment': llm_analysis.get('cultural_fit_assessment', ''),
                'recommendation': llm_analysis.get('recommendation', 'Consider'),
                'field_matches': candidate.get('field_matches', {}),
                'match_reasons': generate_final_match_reasons(candidate, llm_analysis)
            })
        
        return enhanced_candidates
        
    except json.JSONDecodeError as error:
        print(f'❌ JSON parsing error in LLM batch processing: {str(error)}')
        print(f'🔍 Content that failed to parse: {repr(content) if "content" in locals() else "No content"}')
        # Return fallback candidates if JSON parsing fails
        return [create_fallback_candidate(candidate, criteria) for candidate in candidate_batch]
        
    except Exception as error:
        print(f'❌ Error in LLM batch processing: {str(error)}')
        import traceback
        print(f'🔍 Full traceback: {traceback.format_exc()}')
        # Return fallback candidates if LLM processing fails
        return [create_fallback_candidate(candidate, criteria) for candidate in candidate_batch]

def generate_final_match_reasons(
    candidate: Dict[str, Any], 
    llm_analysis: Dict[str, Any]
) -> List[str]:
    """
    Generate comprehensive match reasons combining BM25 and LLM insights
    """
    reasons = []
    
    # Add LLM strengths as primary reasons
    match_strengths = llm_analysis.get('match_strengths', [])
    if match_strengths:
        reasons.extend(match_strengths[:3])
    
    # Add BM25 preliminary reasons as supporting evidence
    preliminary_reasons = candidate.get('preliminary_reasons', [])
    if preliminary_reasons:
        reasons.extend(preliminary_reasons[:2])
    
    # Add field match summary
    field_matches = candidate.get('field_matches', {})
    if field_matches:
        field_types = list(field_matches.keys())
        reasons.append(f"Matches in {', '.join(field_types)} criteria")
    
    return reasons[:5]  # Limit to top 5 reasons

def create_fallback_candidate(
    candidate: Dict[str, Any], 
    criteria: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Create fallback candidate when LLM analysis fails
    """
    weights = criteria.get('weights', {
        'bm25Score': 0.6, 
        'llmRelevance': 0.3, 
        'fieldMatches': 0.1
    })
    
    field_match_score = len(candidate.get('field_matches', {})) * 0.1
    fallback_llm_score = 0.5  # Neutral LLM score
    
    overall_score = (
        (candidate['bm25_score'] * weights['bm25Score']) +
        (fallback_llm_score * weights['llmRelevance']) +
        (field_match_score * weights['fieldMatches'])
    )
    
    return {
        'id': candidate['id'],
        'data': candidate['data'],
        'bm25_score': candidate['bm25_score'],
        'llm_relevance_score': fallback_llm_score,
        'overall_score': round(overall_score, 3),
        'match_score': round(overall_score, 3),  # Frontend expects match_score
        'llm_analysis': 'Candidate shows good text relevance based on keyword matching. Manual review recommended for detailed assessment.',
        'match_strengths': candidate.get('preliminary_reasons', ['Good text relevance']),
        'potential_concerns': ['Requires manual review'],
        'cultural_fit_assessment': 'Unable to assess automatically',
        'recommendation': 'Consider',
        'field_matches': candidate.get('field_matches', {}),
        'match_reasons': candidate.get('preliminary_reasons', ['Profile relevance'])
    }

def fallback_refinement(
    bm25_results: List[Dict[str, Any]], 
    criteria: Dict[str, Any], 
    final_limit: int
) -> List[Dict[str, Any]]:
    """
    Fallback refinement when LLM is not available
    """
    print('🔄 Using fallback refinement without LLM')
    
    # Simple scoring based on BM25 and field matches
    scored_results = []
    for candidate in bm25_results:
        field_match_score = len(candidate.get('field_matches', {})) * 0.2
        overall_score = (candidate['bm25_score'] * 0.7) + (field_match_score * 0.3)
        
        scored_results.append({
            'id': candidate['id'],
            'data': candidate['data'],
            'bm25_score': candidate['bm25_score'],
            'llm_relevance_score': 0.5,  # Neutral score
            'overall_score': round(overall_score, 3),
            'match_score': round(overall_score, 3),  # Frontend expects match_score
            'llm_analysis': 'LLM analysis not available. Ranking based on text relevance and field matches.',
            'match_strengths': candidate.get('preliminary_reasons', ['Text relevance']),
            'potential_concerns': ['Manual review recommended'],
            'cultural_fit_assessment': 'Not assessed',
            'recommendation': 'Consider',
            'field_matches': candidate.get('field_matches', {}),
            'match_reasons': candidate.get('preliminary_reasons', ['Profile relevance'])
        })
    
    return sorted(
        scored_results, 
        key=lambda x: x['overall_score'], 
        reverse=True
    )[:final_limit]
