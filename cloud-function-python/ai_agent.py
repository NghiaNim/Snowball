"""
AI Agent for query processing and criteria generation

This module handles:
1. Follow-up question generation
2. Query to criteria translation with hard constraint extraction
3. Smart filtering logic
"""

import os
import json
import re
from typing import Dict, List, Any, Optional, Tuple
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

# Initialize LangChain OpenAI client
try:
    api_key = os.getenv('OPENAI_API_KEY')
    if api_key and api_key.startswith('sk-') and len(api_key) > 20:
        llm = ChatOpenAI(
            model="gpt-4o",  # Use gpt-4o for follow-up questions
            api_key=api_key,
            temperature=0.3
        )
        
        # Separate LLM for criteria generation with best available model
        criteria_llm = ChatOpenAI(
            model="gpt-5-2025-08-07",  # Use GPT-5 for more intelligent criteria generation
            api_key=api_key,
            temperature=0.1  # Lower temperature for more consistent results
        )
        print(f'✅ AI Agent OpenAI client initialized successfully')
    else:
        llm = None
        print(f'⚠️ OpenAI API key not configured properly in AI Agent')
except Exception as e:
    llm = None
    print(f'⚠️ Failed to initialize AI Agent OpenAI client: {str(e)}')

def generate_follow_up_questions(query: str, dataset_schema: Optional[Dict] = None, extensive_questions: bool = False) -> List[Dict[str, Any]]:
    """
    Generate follow-up questions to refine the search query
    """
    if not llm:
        return []
    
    try:
        system_prompt = """
You are an expert recruiter. Generate 2-3 targeted follow-up questions to refine a candidate search query.

IMPORTANT RULES:
- ALL questions must be type "multiple_choice" 
- ALL questions must include "Other" as the last option
- Include 4-6 relevant options plus "Other"
- Keep questions focused and actionable

Focus on:
1. Role-specific requirements (skills, technologies, roles)
2. Experience level preferences  
3. Industry or domain expertise
4. Cultural fit considerations

Return JSON format:
{
  "questions": [
    {
      "id": "experience_level",
      "question": "What experience level are you looking for?",
      "type": "multiple_choice",
      "options": ["Entry-level", "Mid-level", "Senior", "Executive", "Other"],
      "required": false
    },
    {
      "id": "skills_required",
      "question": "What specific skills or technologies are important?",
      "type": "multiple_choice", 
      "options": ["Python", "JavaScript", "Leadership", "Sales", "Marketing", "Other"],
      "required": false
    }
  ]
}
"""
        
        user_prompt = f"""
Generate follow-up questions for this search query: "{query}"

Dataset context: {json.dumps(dataset_schema, indent=2) if dataset_schema else 'No schema provided'}
"""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = llm.invoke(messages)
        content = response.content.strip()
        
        # Extract JSON from response
        start_brace = content.find('{')
        end_brace = content.rfind('}')
        
        if start_brace != -1 and end_brace != -1:
            json_content = content[start_brace:end_brace + 1]
            result = json.loads(json_content)
            return result.get('questions', [])
        
        return []
        
    except Exception as error:
        print(f'❌ Error generating follow-up questions: {str(error)}')
        return []

def translate_query_to_criteria(query: str, dataset_schema: Optional[Dict] = None, follow_up_answers: Dict = None) -> Dict[str, Any]:
    """
    Translate natural language query into structured search criteria with intelligent interpretation
    """
    # Use the more advanced model for criteria generation
    active_llm = criteria_llm if 'criteria_llm' in globals() else llm
    if not active_llm:
        return create_fallback_criteria(query)
    
    try:
        # First, extract hard constraints using pattern matching
        hard_constraints = extract_hard_constraints(query)
        
        system_prompt = """
You are an expert AI recruiter with deep understanding of natural language and human intent. Your job is to intelligently interpret search queries and translate them into flexible, creative search criteria.

CRITICAL INTELLIGENCE GUIDELINES:
- Be CREATIVE and INTELLIGENT in interpretation - don't just use literal keywords
- "abroad" means "international locations", "foreign countries", "non-local" - expand to actual country names
- "cool people" means innovative, creative, interesting backgrounds - look for diverse experiences
- Consider CONTEXT and INTENT, not just literal words
- Use SYNONYMS, RELATED TERMS, and CONCEPTUAL MATCHES

CONSTRAINT CLASSIFICATION:
- Hard constraints: Only for EXPLICIT, SPECIFIC requirements (exact names, specific companies)
- Soft preferences: Most location/skill/background requirements should be soft preferences for flexibility

LOCATION INTELLIGENCE:
- "abroad/international" → Expand to major countries: ["United States", "Canada", "United Kingdom", "Germany", "France", "Australia", "Singapore", "India", "Brazil", "Mexico", "Japan", "Korea", "China"]
- "Silicon Valley" → ["San Francisco", "Palo Alto", "Mountain View", "Cupertino"] 
- "NYC" → ["New York", "Manhattan", "Brooklyn"]

CREATIVE INTERPRETATION EXAMPLES:
- "Cool people from abroad" → international experience, diverse backgrounds, cross-cultural expertise
- "Technical founders" → startup experience, CTO roles, technical leadership, engineering background
- "Creative marketers" → brand building, content creation, growth hacking, digital marketing

Return JSON format:
{
  "hardConstraints": {
    "nameMatches": [],  // Only for explicit names like "John Smith"
    "locationRequirements": [],  // Only for very specific location requirements
    "titleRequirements": [],  // Only for exact title matches
    "companyRequirements": [],  // Only for specific company names
    "exclusions": []  // Hard exclusions
  },
  "textualCriteria": {
    "keywordSearch": {
      "required": [],  // Must have keywords (use sparingly)
      "preferred": ["international", "global", "cross-cultural", "diverse"],  // Creative interpretations
      "phrases": [],  // Exact phrases (use rarely)
      "excluded": []  // Exclude if present
    },
    "fieldSpecificSearch": {
      "skills": ["international experience", "cross-cultural communication"],
      "industries": ["technology", "startups", "consulting"],
      "roles": ["founder", "entrepreneur", "leader"],
      "experience": ["international", "multicultural", "global"],
      "locations": ["United States", "Canada", "United Kingdom", "Germany", "France", "Australia", "Singapore"]
    }
  },
  "contextualCriteria": {
    "experienceLevel": "any",
    "careerStage": "any", 
    "workingStyle": "collaborative",
    "personalityTraits": ["innovative", "adaptable", "curious"],
    "backgroundDiversity": "international"
  },
  "weights": {
    "bm25Score": 0.2,
    "llmRelevance": 0.7,
    "fieldMatches": 0.1
  }
}
"""
        
        user_prompt = f"""
Query: "{query}"

Hard constraints already detected: {json.dumps(hard_constraints, indent=2)}

Dataset schema: {json.dumps(dataset_schema, indent=2) if dataset_schema else 'No schema provided'}

Follow-up answers: {json.dumps(follow_up_answers, indent=2) if follow_up_answers else 'None provided'}

Translate this query into structured criteria. Be very careful to identify hard constraints that MUST be satisfied.
"""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = llm.invoke(messages)
        content = response.content.strip()
        
        # Extract JSON from response
        start_brace = content.find('{')
        end_brace = content.rfind('}')
        
        if start_brace != -1 and end_brace != -1:
            json_content = content[start_brace:end_brace + 1]
            criteria = json.loads(json_content)
            
            # Merge extracted hard constraints
            if 'hardConstraints' not in criteria:
                criteria['hardConstraints'] = {}
            
            for key, value in hard_constraints.items():
                if value:  # Only add non-empty constraints
                    if key not in criteria['hardConstraints']:
                        criteria['hardConstraints'][key] = value
                    else:
                        # Merge if both exist
                        if isinstance(value, list):
                            criteria['hardConstraints'][key].extend(value)
                        
            return criteria
        
        # Fallback if JSON parsing fails
        return create_fallback_criteria(query, hard_constraints)
        
    except Exception as error:
        print(f'❌ Error in query translation: {str(error)}')
        return create_fallback_criteria(query)

def extract_hard_constraints(query: str) -> Dict[str, List[str]]:
    """
    Extract ONLY very explicit hard constraints - be conservative
    """
    query_lower = query.lower()
    constraints = {
        'nameMatches': [],
        'locationRequirements': [],
        'titleRequirements': [],
        'companyRequirements': [],
        'exclusions': []
    }
    
    # Only extract very explicit name patterns
    explicit_name_patterns = [
        r"name is (\w+)",
        r"named (\w+)",
        r"person named (\w+)",
        r"called (\w+)"
    ]
    
    for pattern in explicit_name_patterns:
        matches = re.findall(pattern, query_lower)
        constraints['nameMatches'].extend(matches)
    
    # Only extract very specific location patterns (avoid generic "in fintech" etc.)
    specific_location_patterns = [
        r"located in ([A-Z][a-zA-Z\s]+)",  # "located in San Francisco"
        r"based in ([A-Z][a-zA-Z\s]+)",   # "based in New York"
        r"from ([A-Z][a-zA-Z\s]+) and",   # "from California and"
        r"lives in ([A-Z][a-zA-Z\s]+)"    # "lives in Boston"
    ]
    
    for pattern in specific_location_patterns:
        matches = re.findall(pattern, query)  # Use original case to catch proper nouns
        # Only accept matches that look like real locations (start with capital, reasonable length)
        clean_locations = [
            loc.strip() for loc in matches 
            if len(loc.strip()) < 25 and loc.strip()[0].isupper() and 
            not any(word in loc.lower() for word in ['fintech', 'startup', 'tech', 'raised', 'funding'])
        ]
        constraints['locationRequirements'].extend(clean_locations)
    
    # Only extract very explicit company requirements
    explicit_company_patterns = [
        r"works at ([A-Z][a-zA-Z\s&]+)",
        r"employed at ([A-Z][a-zA-Z\s&]+)",
        r"currently at ([A-Z][a-zA-Z\s&]+)"
    ]
    
    for pattern in explicit_company_patterns:
        matches = re.findall(pattern, query)
        # Only accept well-known company formats
        clean_companies = [
            comp.strip() for comp in matches 
            if len(comp.strip()) < 20 and comp.strip()[0].isupper()
        ]
        constraints['companyRequirements'].extend(clean_companies)
    
    # Only extract very explicit exclusions
    explicit_exclusion_patterns = [
        r"no recruiters",
        r"not consultants", 
        r"exclude agencies"
    ]
    
    for pattern in explicit_exclusion_patterns:
        if pattern in query_lower:
            constraints['exclusions'].append(pattern.replace("no ", "").replace("not ", "").replace("exclude ", ""))
    
    # Remove duplicates and empty values
    for key in constraints:
        constraints[key] = list(set([item for item in constraints[key] if item.strip()]))
    
    # Only log if we actually found constraints
    if any(constraints.values()):
        print(f"🔍 Extracted hard constraints: {constraints}")
    else:
        print(f"🔍 No hard constraints found - using flexible search")
    
    return constraints

def fix_json_content(json_content: str) -> str:
    """
    Attempt to fix common JSON formatting issues
    """
    # Remove trailing commas before closing braces/brackets
    json_content = re.sub(r',(\s*[}\]])', r'\1', json_content)
    
    # Fix unquoted property names (common LLM issue)
    json_content = re.sub(r'(\w+)(\s*:)', r'"\1"\2', json_content)
    
    # Fix single quotes to double quotes
    json_content = json_content.replace("'", '"')
    
    # Fix comments (// comments are not valid JSON)
    json_content = re.sub(r'//.*', '', json_content)
    
    return json_content

def create_fallback_criteria(query: str, hard_constraints: Dict = None) -> Dict[str, Any]:
    """
    Create fallback criteria when LLM is not available
    """
    if hard_constraints is None:
        hard_constraints = extract_hard_constraints(query)
    
    # Simple keyword extraction with intelligent defaults
    keywords = [word for word in query.lower().split() if len(word) > 2]
    
    # Intelligent fallback based on common query patterns
    preferred_keywords = []
    field_search = {}
    
    if 'founder' in query.lower():
        preferred_keywords.extend(['founder', 'co-founder', 'startup', 'entrepreneur'])
        field_search['roles'] = ['founder', 'co-founder', 'ceo']
    
    if 'fintech' in query.lower():
        preferred_keywords.extend(['fintech', 'financial', 'finance', 'banking'])
        field_search['industries'] = ['fintech', 'financial services', 'banking']
    
    if 'raised' in query.lower() or 'funding' in query.lower():
        preferred_keywords.extend(['raised', 'funding', 'investment', 'series', 'seed'])
        field_search['experience'] = ['fundraising', 'investment', 'venture capital']
    
    return {
        'hardConstraints': hard_constraints if hard_constraints else {},
        'textualCriteria': {
            'keywordSearch': {
                'required': [],
                'preferred': preferred_keywords + keywords[:5],  # Limit keywords
                'phrases': [],
                'excluded': []
            },
            'fieldSpecificSearch': field_search
        },
        'contextualCriteria': {
            'experienceLevel': 'any',
            'careerStage': 'any',
            'workingStyle': 'any'
        },
        'weights': {
            'bm25Score': 0.3,
            'llmRelevance': 0.6,
            'fieldMatches': 0.1
        }
    }
