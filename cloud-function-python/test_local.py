#!/usr/bin/env python3
"""
Local test script for LangChain integration
Test the AI agent functions before deploying to Cloud Functions
"""

import os
import sys
import json
from ai_agent import generate_follow_up_questions, translate_query_to_criteria

def test_follow_up_questions():
    """Test the follow-up questions generation"""
    print("🧪 Testing follow-up questions generation...")
    
    # Test query
    query = "find healthcare investors for my AI startup"
    
    # Sample dataset schema
    dataset_schema = {
        "fields": [
            {"name": "name", "type": "string", "sampleValues": ["John Doe", "Jane Smith"]},
            {"name": "company", "type": "string", "sampleValues": ["HealthTech Ventures", "AI Capital"]},
            {"name": "industry", "type": "string", "sampleValues": ["Healthcare", "Technology"]},
            {"name": "location", "type": "string", "sampleValues": ["San Francisco", "New York"]},
            {"name": "role", "type": "string", "sampleValues": ["Partner", "Managing Director"]}
        ],
        "totalRows": 1000
    }
    
    try:
        result = generate_follow_up_questions(query, dataset_schema)
        print("✅ Follow-up questions generated successfully:")
        print(json.dumps(result, indent=2))
        return True
    except Exception as e:
        print(f"❌ Error generating follow-up questions: {str(e)}")
        return False

def test_criteria_translation():
    """Test the criteria translation"""
    print("\n🧪 Testing criteria translation...")
    
    query = "find healthcare investors for my AI startup"
    follow_up_answers = {
        "intent": "Investment",
        "experience_level": "Senior (7-15 years)",
        "location_preference": "No preference"
    }
    
    dataset_schema = {
        "fields": [
            {"name": "name", "type": "string"},
            {"name": "company", "type": "string"},
            {"name": "industry", "type": "string"},
            {"name": "location", "type": "string"},
            {"name": "role", "type": "string"}
        ],
        "totalRows": 1000
    }
    
    try:
        result = translate_query_to_criteria(query, dataset_schema, follow_up_answers)
        print("✅ Criteria translation successful:")
        print(json.dumps(result, indent=2))
        return True
    except Exception as e:
        print(f"❌ Error translating criteria: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting local LangChain integration tests...\n")
    
    # Check if OpenAI API key is set
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ OPENAI_API_KEY environment variable not set")
        print("Set it with: export OPENAI_API_KEY='your-api-key-here'")
        sys.exit(1)
    
    if not api_key.startswith('sk-'):
        print("❌ Invalid OpenAI API key format")
        sys.exit(1)
    
    print(f"✅ OpenAI API key found: {api_key[:10]}...")
    
    # Run tests
    test1_success = test_follow_up_questions()
    test2_success = test_criteria_translation()
    
    # Summary
    print("\n📊 Test Summary:")
    print(f"Follow-up questions: {'✅ PASS' if test1_success else '❌ FAIL'}")
    print(f"Criteria translation: {'✅ PASS' if test2_success else '❌ FAIL'}")
    
    if test1_success and test2_success:
        print("\n🎉 All tests passed! Ready for deployment.")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed. Fix issues before deploying.")
        sys.exit(1)

if __name__ == "__main__":
    main()


