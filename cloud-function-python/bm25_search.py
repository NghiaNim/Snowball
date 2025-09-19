"""
BM25-based text search using OkapiBM25 algorithm

This module provides fast text matching using the BM25 algorithm
to filter candidates before LLM analysis.
"""

import json
import re
from typing import List, Dict, Any, Tuple
from rank_bm25 import BM25Okapi

def search_with_bm25(people: List[Dict[str, Any]], criteria: Dict[str, Any], top_k: int = 50) -> List[Dict[str, Any]]:
    """
    BM25-based text search with hard constraint pre-filtering
    """
    try:
        print(f"🔍 Starting BM25 search on {len(people)} records for top {top_k} results")

        # Step 0: Apply hard constraints first
        hard_constraints = criteria.get('hardConstraints', {})
        if hard_constraints and any(hard_constraints.values()):
            print(f"🚫 Applying hard constraints: {hard_constraints}")
            filtered_people = apply_hard_constraints(people, hard_constraints)
            print(f"📊 After hard constraint filtering: {len(filtered_people)} candidates remain")
            
            # If no one passes hard constraints, return empty
            if not filtered_people:
                print("❌ No candidates pass hard constraints - returning empty results")
                return []
        else:
            filtered_people = people
        
        # Step 1: Create searchable documents from filtered people
        documents = [create_searchable_document(person) for person in filtered_people]
        
        # Step 2: Tokenize documents for BM25
        tokenized_docs = [doc.split() for doc in documents]
        
        # Step 3: Initialize BM25 with tokenized documents
        bm25 = BM25Okapi(tokenized_docs)
        
        # Step 4: Build search query from criteria
        search_query = build_bm25_query(criteria)
        print(f"📝 BM25 query: '{search_query}'")
        
        # Step 5: Execute BM25 search
        tokenized_query = search_query.split()
        scores = bm25.get_scores(tokenized_query)
        
        # Step 6: Apply minimum score threshold (lowered for more flexibility)
        MIN_SCORE_THRESHOLD = 0.1  # Lowered threshold for more flexible matching
        
        scored_results = []
        for i, score in enumerate(scores):
            if score >= MIN_SCORE_THRESHOLD and passes_soft_filters(filtered_people[i], criteria):
                scored_results.append({
                    'person': filtered_people[i],
                    'bm25_score': float(score),
                    'index': i
                })
        
        # Sort by BM25 score and take top K
        scored_results.sort(key=lambda x: x['bm25_score'], reverse=True)
        scored_results = scored_results[:top_k]
        
        # Step 7: Enhance results with detailed scoring
        enhanced_results = []
        for result in scored_results:
            enhanced_results.append({
                'id': generate_person_id(result['person']),
                'data': result['person'],
                'bm25_score': round(result['bm25_score'], 3),
                'field_matches': analyze_field_matches(result['person'], criteria),
                'preliminary_reasons': generate_preliminary_reasons(result['person'], criteria)
            })

        print(f"✅ BM25 search completed: {len(enhanced_results)} candidates selected")
        return enhanced_results

    except Exception as error:
        print(f"❌ Error in BM25 search: {str(error)}")
        raise Exception(f"BM25 search failed: {str(error)}")

def create_searchable_document(person: Dict[str, Any]) -> str:
    """
    Create a searchable text document from a person profile
    """
    text_fields = []
    
    for key, value in person.items():
        if isinstance(value, str) and value.strip():
            # Add field name as context and the value
            text_fields.append(f"{key}: {value}")
            # Also add just the value for broader matching
            text_fields.append(value)
    
    return ' '.join(text_fields).lower()

def build_bm25_query(criteria: Dict[str, Any]) -> str:
    """
    Build BM25 search query from structured criteria
    """
    query_parts = []
    
    textual_criteria = criteria.get('textualCriteria', {})
    keyword_search = textual_criteria.get('keywordSearch', {})
    field_search = textual_criteria.get('fieldSpecificSearch', {})
    
    # Add required keywords (high weight)
    required = keyword_search.get('required', [])
    for keyword in required:
        query_parts.append(keyword)
        query_parts.append(keyword)  # Duplicate for higher weight
    
    # Add preferred keywords
    preferred = keyword_search.get('preferred', [])
    query_parts.extend(preferred)
    
    # Add exact phrases
    phrases = keyword_search.get('phrases', [])
    query_parts.extend(phrases)
    
    # Add field-specific search terms
    for field_type, terms in field_search.items():
        if isinstance(terms, list) and terms:
            for term in terms:
                # Add field context
                query_parts.append(f"{field_type}: {term}")
                query_parts.append(term)  # Also add standalone term
    
    # If no specific criteria, use contextual intent
    if not query_parts:
        contextual_criteria = criteria.get('contextualCriteria', {})
        intent_analysis = contextual_criteria.get('intentAnalysis', {})
        
        primary_goal = intent_analysis.get('primaryGoal')
        if primary_goal:
            query_parts.append(primary_goal)
            
        context = intent_analysis.get('context')
        if context:
            query_parts.append(context)
    
    return ' '.join(query_parts)

def apply_hard_constraints(people: List[Dict[str, Any]], hard_constraints: Dict[str, List[str]]) -> List[Dict[str, Any]]:
    """
    Apply hard constraints to filter the dataset before BM25 search
    """
    filtered_people = []
    
    for person in people:
        if passes_hard_constraints(person, hard_constraints):
            filtered_people.append(person)
    
    return filtered_people

def passes_hard_constraints(person: Dict[str, Any], hard_constraints: Dict[str, List[str]]) -> bool:
    """
    Check if a person passes all hard constraints (name, location, title, company)
    """
    person_text = json.dumps(person).lower()
    
    # Check name matches
    name_matches = hard_constraints.get('nameMatches', [])
    if name_matches:
        has_name_match = False
        for required_name in name_matches:
            # Check in various name fields
            name_fields = ['name', 'full_name', 'fullname', 'first_name', 'last_name']
            for field in name_fields:
                if field in person and person[field]:
                    if required_name.lower() in person[field].lower():
                        has_name_match = True
                        break
            if has_name_match:
                break
        
        if not has_name_match:
            print(f"❌ Name constraint failed for {person.get('name', 'unknown')}. Required: {name_matches}")
            return False
    
    # Check location requirements
    location_requirements = hard_constraints.get('locationRequirements', [])
    if location_requirements:
        has_location_match = any(
            location.lower() in person_text 
            for location in location_requirements
        )
        if not has_location_match:
            print(f"❌ Location constraint failed for {person.get('name', 'unknown')}. Required: {location_requirements}")
            return False
    
    # Check title requirements
    title_requirements = hard_constraints.get('titleRequirements', [])
    if title_requirements:
        has_title_match = any(
            title.lower() in person_text 
            for title in title_requirements
        )
        if not has_title_match:
            print(f"❌ Title constraint failed for {person.get('name', 'unknown')}. Required: {title_requirements}")
            return False
    
    # Check company requirements
    company_requirements = hard_constraints.get('companyRequirements', [])
    if company_requirements:
        has_company_match = any(
            company.lower() in person_text 
            for company in company_requirements
        )
        if not has_company_match:
            print(f"❌ Company constraint failed for {person.get('name', 'unknown')}. Required: {company_requirements}")
            return False
    
    # Check exclusions
    exclusions = hard_constraints.get('exclusions', [])
    if exclusions:
        for exclusion in exclusions:
            if exclusion.lower() in person_text:
                print(f"❌ Exclusion constraint failed for {person.get('name', 'unknown')}. Excluded: {exclusion}")
                return False
    
    return True

def passes_soft_filters(person: Dict[str, Any], criteria: Dict[str, Any]) -> bool:
    """
    Apply soft filters (preferences that affect ranking but don't exclude)
    """
    textual_criteria = criteria.get('textualCriteria', {})
    keyword_search = textual_criteria.get('keywordSearch', {})
    
    # Check exclusion keywords (these are still hard filters)
    excluded = keyword_search.get('excluded', [])
    if excluded:
        person_text = json.dumps(person).lower()
        
        for excluded_term in excluded:
            if excluded_term.lower() in person_text:
                return False
    
    # All other criteria are now soft preferences handled by scoring
    return True

def analyze_field_matches(person: Dict[str, Any], criteria: Dict[str, Any]) -> Dict[str, List[str]]:
    """
    Analyze which specific fields matched the search criteria
    """
    matches = {}
    
    textual_criteria = criteria.get('textualCriteria', {})
    field_search = textual_criteria.get('fieldSpecificSearch', {})
    
    for field_type, search_terms in field_search.items():
        if not isinstance(search_terms, list) or not search_terms:
            continue
            
        matched_terms = []
        person_text = json.dumps(person).lower()
        
        for term in search_terms:
            if term.lower() in person_text:
                matched_terms.append(term)
        
        if matched_terms:
            matches[field_type] = matched_terms
    
    return matches

def generate_preliminary_reasons(person: Dict[str, Any], criteria: Dict[str, Any]) -> List[str]:
    """
    Generate preliminary match reasons based on BM25 results
    """
    reasons = []
    
    textual_criteria = criteria.get('textualCriteria', {})
    keyword_search = textual_criteria.get('keywordSearch', {})
    
    # Check keyword matches
    required = keyword_search.get('required', [])
    if required:
        person_text = json.dumps(person).lower()
        matched_keywords = [
            keyword for keyword in required 
            if keyword.lower() in person_text
        ]
        
        if matched_keywords:
            reasons.append(f"Contains required keywords: {', '.join(matched_keywords)}")
    
    # Check field-specific matches
    field_matches = analyze_field_matches(person, criteria)
    for field_type, terms in field_matches.items():
        field_name = field_type.replace('_', ' ').title()
        reasons.append(f"{field_name} match: {', '.join(terms)}")
    
    # Add BM25 relevance indicator
    reasons.append('High text relevance score')
    
    return reasons

def generate_person_id(person: Dict[str, Any]) -> str:
    """
    Generate a unique ID for a person
    """
    # Try to find name fields
    name_fields = ['name', 'full_name', 'fullname', 'first_name', 'last_name']
    name = 'unknown'
    
    for field in name_fields:
        if field in person and person[field]:
            name = re.sub(r'[^a-z0-9]', '_', person[field].lower())
            break
    
    # Add some randomness to ensure uniqueness
    import random
    import string
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=5))
    return f"{name}_{random_suffix}"
