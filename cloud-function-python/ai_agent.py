"""
AI Agent for query processing and follow-up question generation

This module handles:
1. Generating intelligent follow-up questions to refine searches
2. Translating natural language queries into structured criteria
3. Building dataset context for better AI responses
"""

import os
import json
from typing import Dict, List, Any, Optional
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

def generate_follow_up_questions(natural_language_query: str, dataset_schema: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Generate intelligent follow-up questions to refine search
    """
    if not llm:
        print('⚠️ LangChain not configured, using fallback questions')
        return get_fallback_questions(natural_language_query)

    dataset_context = build_dataset_context(dataset_schema)

    system_prompt = f"""
You are an expert recruiter and business development specialist. Your job is to ask 3-5 intelligent follow-up questions to refine a search query for finding the perfect people.

{dataset_context}

Based on the user's initial query and the available dataset fields, generate follow-up questions that will help create a more targeted and effective search.

Guidelines:
1. Ask questions that leverage the actual fields available in the dataset
2. Focus on clarifying intent, context, and specific requirements
3. Include questions about success metrics and deal-breakers
4. Keep questions conversational and easy to answer
5. Each question should have 3-4 multiple choice options plus "Other"

Return a JSON object with this structure:
{{
  "questions": [
    {{
      "id": "intent",
      "question": "What's your primary goal with this search?",
      "type": "single_choice",
      "options": ["Hiring", "Investment", "Partnership", "Advisory", "Other"],
      "required": true
    }},
    {{
      "id": "timeline", 
      "question": "What's your timeline for this search?",
      "type": "single_choice",
      "options": ["Immediate (1-2 weeks)", "Short-term (1-3 months)", "Long-term (3+ months)", "Other"],
      "required": false
    }}
  ],
  "explanation": "These questions will help me find the most relevant candidates for your specific needs."
}}

Make questions specific to the query and dataset fields available.
"""

    user_prompt = f'User\'s query: "{natural_language_query}"\n\nGenerate 3-5 targeted follow-up questions to refine this search.'

    try:
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = llm.invoke(messages)
        content = response.content
        
        print(f'🔍 Raw OpenAI response: {repr(content)}')
        
        # Check if content is empty or None
        if not content or content.strip() == '':
            print('⚠️ OpenAI returned empty content, using fallback')
            return get_fallback_questions(natural_language_query)
        
        # Clean the content - sometimes AI adds extra text before/after JSON
        content = content.strip()
        
        # Try to find JSON in the response
        start_brace = content.find('{')
        end_brace = content.rfind('}')
        
        if start_brace == -1 or end_brace == -1:
            print('⚠️ No JSON braces found in response, using fallback')
            return get_fallback_questions(natural_language_query)
            
        json_content = content[start_brace:end_brace + 1]
        print(f'🔍 Extracted JSON: {json_content}')
        
        # Parse JSON response
        result = json.loads(json_content)
        
        # Validate the result has expected structure
        if not isinstance(result, dict) or 'questions' not in result:
            print('⚠️ Invalid response structure, using fallback')
            return get_fallback_questions(natural_language_query)
            
        return result

    except json.JSONDecodeError as error:
        print(f'❌ JSON parsing error in follow-up questions: {str(error)}')
        print(f'🔍 Content that failed to parse: {repr(content) if "content" in locals() else "No content"}')
        return get_fallback_questions(natural_language_query)
    except Exception as error:
        print(f'❌ LangChain API error in follow-up questions: {str(error)}')
        return get_fallback_questions(natural_language_query)

def translate_query_to_criteria(
    natural_language_query: str, 
    dataset_schema: Optional[Dict] = None, 
    follow_up_answers: Dict[str, str] = None
) -> Dict[str, Any]:
    """
    Translate refined query with follow-up answers to structured criteria
    """
    if follow_up_answers is None:
        follow_up_answers = {}
        
    if not llm:
        print('⚠️ LangChain not configured, using fallback translation')
        return get_fallback_criteria(natural_language_query, dataset_schema)

    dataset_context = build_dataset_context(dataset_schema)
    follow_up_context = ""
    if follow_up_answers:
        follow_up_context = f"\n\nAdditional context from follow-up questions:\n{json.dumps(follow_up_answers, indent=2)}"

    system_prompt = f"""
You are an expert search query translator. Convert natural language searches into structured criteria for finding people in a dataset.

{dataset_context}{follow_up_context}

Based on the user's query, follow-up answers, and available dataset fields, generate comprehensive search criteria.

Generate criteria matching this exact schema:
{{
  "textualCriteria": {{
    "keywordSearch": {{
      "required": ["must", "have", "keywords"],
      "preferred": ["nice", "to", "have"], 
      "excluded": ["exclude", "these"],
      "phrases": ["exact phrase matches"]
    }},
    "fieldSpecificSearch": {{
      "skills": ["technical", "skills"],
      "industries": ["healthcare", "fintech"],
      "roles": ["founder", "investor"],
      "companies": ["previous", "companies"],
      "locations": ["geographic", "areas"],
      "education": ["schools", "degrees"]
    }}
  }},
  "contextualCriteria": {{
    "intentAnalysis": {{
      "primaryGoal": "find seed investors",
      "context": "for healthcare AI startup",
      "successMetrics": ["relevant experience", "check size match"]
    }},
    "qualitativeFilters": {{
      "culturalFit": "startup mentality",
      "workingStyle": "hands-on approach",
      "personalityTraits": ["data-driven", "execution-focused"],
      "careerStage": "seasoned professional"
    }},
    "relationshipContext": {{
      "connectionType": "investment",
      "engagementLevel": "long-term partnership",
      "timeline": "immediate"
    }}
  }},
  "weights": {{
    "bm25Score": 0.4,
    "llmRelevance": 0.5,
    "fieldMatches": 0.1
  }}
}}

CRITICAL RULES:
1. Use ONLY field names that exist in the dataset
2. Base keyword searches on actual content that would appear in profiles
3. Make criteria specific and actionable
4. Include contextual analysis for LLM refinement stage
5. Set appropriate weights based on query type
"""

    user_prompt = f"""
Original query: "{natural_language_query}"
{f'Follow-up answers: {json.dumps(follow_up_answers, indent=2)}' if follow_up_answers else ''}

Generate comprehensive search criteria for this request.
"""

    try:
        # Create LangChain LLM for this task (GPT-5 requires temperature=1)
        criteria_llm = ChatOpenAI(
            model="gpt-5-2025-08-07",
            api_key=os.getenv('OPENAI_API_KEY'),
            temperature=1.0
        )
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = criteria_llm.invoke(messages)
        content = response.content
        
        print(f'🔍 Raw OpenAI criteria response: {repr(content)}')
        
        # Check if content is empty or None
        if not content or content.strip() == '':
            print('⚠️ OpenAI returned empty content for criteria, using fallback')
            return get_fallback_criteria(natural_language_query, dataset_schema)
        
        # Clean the content - sometimes AI adds extra text before/after JSON
        content = content.strip()
        
        # Try to find JSON in the response
        start_brace = content.find('{')
        end_brace = content.rfind('}')
        
        if start_brace == -1 or end_brace == -1:
            print('⚠️ No JSON braces found in criteria response, using fallback')
            return get_fallback_criteria(natural_language_query, dataset_schema)
            
        json_content = content[start_brace:end_brace + 1]
        print(f'🔍 Extracted criteria JSON: {json_content}')
        
        # Parse JSON response
        criteria = json.loads(json_content)
        
        # Validate the result has expected structure
        if not isinstance(criteria, dict) or 'textualCriteria' not in criteria:
            print('⚠️ Invalid criteria response structure, using fallback')
            return get_fallback_criteria(natural_language_query, dataset_schema)
        
        print('✅ AI criteria translation successful')
        return criteria

    except json.JSONDecodeError as error:
        print(f'❌ JSON parsing error in criteria translation: {str(error)}')
        print(f'🔍 Content that failed to parse: {repr(content) if "content" in locals() else "No content"}')
        return get_fallback_criteria(natural_language_query, dataset_schema)
    except Exception as error:
        print(f'❌ LangChain API error in criteria translation: {str(error)}')
        return get_fallback_criteria(natural_language_query, dataset_schema)

def build_dataset_context(dataset_schema: Optional[Dict]) -> str:
    """
    Build dataset context string for AI prompts
    """
    if not dataset_schema or not dataset_schema.get('fields'):
        return 'Dataset schema not available.'

    field_descriptions = []
    for field in dataset_schema['fields']:
        sample_values = ""
        if field.get('sampleValues'):
            sample_values = f" (examples: {', '.join(field['sampleValues'][:3])})"
        field_descriptions.append(f"- {field['name']}: {field['type']}{sample_values}")
    
    sample_data = ""
    if dataset_schema.get('sampleData'):
        sample_data = f"Sample data rows:\n{json.dumps(dataset_schema['sampleData'][:2], indent=2)}"
    
    return f"""
DATASET CONTEXT:
Available fields in the dataset:
{chr(10).join(field_descriptions)}

{sample_data}

Total records: {dataset_schema.get('totalRows', 'Unknown')}
"""

def get_fallback_questions(query: str) -> Dict[str, Any]:
    """
    Fallback questions when OpenAI is not available
    """
    return {
        "questions": [
            {
                "id": "intent",
                "question": "What's your primary goal with this search?",
                "type": "single_choice",
                "options": ["Hiring", "Investment", "Partnership", "Advisory", "Other"],
                "required": True
            },
            {
                "id": "experience_level",
                "question": "What experience level are you looking for?",
                "type": "single_choice",
                "options": ["Early career (0-3 years)", "Mid-level (3-7 years)", "Senior (7-15 years)", "Executive (15+ years)", "Other"],
                "required": False
            },
            {
                "id": "location_preference",
                "question": "Any location preferences?",
                "type": "single_choice",
                "options": ["Local only", "Remote OK", "Specific city/region", "No preference", "Other"],
                "required": False
            }
        ],
        "explanation": "These questions will help refine your search criteria."
    }

def get_fallback_criteria(query: str, dataset_schema: Optional[Dict]) -> Dict[str, Any]:
    """
    Fallback criteria generation
    """
    lower_query = query.lower()
    
    # Basic keyword extraction
    keywords = [word for word in query.split() 
                if len(word) > 2 and word.lower() not in ['the', 'and', 'for', 'with', 'find', 'looking']]

    return {
        "textualCriteria": {
            "keywordSearch": {
                "required": keywords[:3],
                "preferred": keywords[3:6],
                "excluded": [],
                "phrases": []
            },
            "fieldSpecificSearch": {
                "skills": [],
                "industries": [],
                "roles": [],
                "companies": [],
                "locations": [],
                "education": []
            }
        },
        "contextualCriteria": {
            "intentAnalysis": {
                "primaryGoal": "hiring" if "hire" in lower_query else "investment" if "invest" in lower_query else "networking",
                "context": query,
                "successMetrics": ["relevant experience"]
            },
            "qualitativeFilters": {
                "culturalFit": "",
                "workingStyle": "",
                "personalityTraits": [],
                "careerStage": ""
            },
            "relationshipContext": {
                "connectionType": "professional",
                "engagementLevel": "long-term",
                "timeline": "flexible"
            }
        },
        "weights": {
            "bm25Score": 0.6,
            "llmRelevance": 0.3,
            "fieldMatches": 0.1
        }
    }
