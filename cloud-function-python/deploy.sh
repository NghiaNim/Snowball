#!/bin/bash

# Python Multi-stage AI Recommendation System Deployment Script
# Version 2.0 with OkapiBM25 and LLM refinement

set -e

# Configuration
FUNCTION_NAME="getRecommendationsV2"
RUNTIME="python312"
TRIGGER="--trigger-http"
ALLOW_UNAUTHENTICATED="--allow-unauthenticated"
ENTRY_POINT="get_recommendations"
MEMORY="1GiB"
TIMEOUT="600s"  # 10 minutes for complex processing
REGION="us-central1"
PROJECT_ID="snowball-471001"
GEN2="--gen2"  # Use 2nd gen functions for better performance

echo "🚀 Deploying Python Multi-Stage AI Recommendation System v2.0"
echo "Project: ${PROJECT_ID}"
echo "Function: ${FUNCTION_NAME}"
echo "Runtime: ${RUNTIME}"
echo "Memory: ${MEMORY}"
echo "Timeout: ${TIMEOUT}"
echo ""

# Check for .env.yaml file first
ENV_YAML_PATH="../secret/.env.yaml"
if [ -f "$ENV_YAML_PATH" ]; then
    echo "✅ Found .env.yaml file at $ENV_YAML_PATH"
    ENV_FILE_FLAG="--env-vars-file $ENV_YAML_PATH"
else
    echo "⚠️  .env.yaml file not found at $ENV_YAML_PATH"
    
    # Check if OpenAI API key is set as environment variable
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "Enter your OpenAI API key (or press Enter to deploy without AI features):"
        read -s OPENAI_API_KEY
    fi
    
    # Set environment variables for the function
    if [ ! -z "$OPENAI_API_KEY" ]; then
        ENV_FILE_FLAG="--set-env-vars OPENAI_API_KEY=${OPENAI_API_KEY}"
        echo "✅ OpenAI API key configured from environment"
    else
        ENV_FILE_FLAG=""
        echo "⚠️  Deploying without OpenAI - will use fallback methods"
    fi
fi

echo ""
echo "🔧 Deploying Python Cloud Function..."

# Enable required APIs for 2nd gen functions
echo "🔧 Enabling required APIs..."
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable run.googleapis.com 
gcloud services enable cloudbuild.googleapis.com

# Deploy the function
gcloud functions deploy ${FUNCTION_NAME} \
  --runtime ${RUNTIME} \
  ${TRIGGER} \
  ${ALLOW_UNAUTHENTICATED} \
  --entry-point ${ENTRY_POINT} \
  --memory ${MEMORY} \
  --timeout ${TIMEOUT} \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  ${GEN2} \
  --cpu 1 \
  --concurrency 1000 \
  --max-instances 100 \
  ${ENV_FILE_FLAG} \
  --source .

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Python deployment successful!"
    echo ""
    echo "📡 Function URLs:"
    echo "Main endpoint: https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}"
    echo "Health check: https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}"
    echo ""
    echo "🧪 Test the function:"
    echo "curl -X POST https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME} \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"stage\": \"questions\", \"query\": \"find healthcare investors\"}'"
    echo ""
    echo "📊 Python features enabled:"
    echo "✅ Multi-stage processing"
    echo "✅ OkapiBM25 text search"
    echo "✅ LLM contextual refinement"
    echo "✅ Follow-up questions"
    echo "✅ Pandas data processing"
    echo "✅ Robust CSV/Excel parsing"
    if [ ! -z "$OPENAI_API_KEY" ] || [ -f "$ENV_YAML_PATH" ]; then
        echo "✅ OpenAI integration"
    else
        echo "⚠️  OpenAI fallback mode"
    fi
else
    echo "❌ Deployment failed!"
    exit 1
fi
