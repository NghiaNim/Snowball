#!/bin/bash

# Python Multi-stage AI Recommendation System Deployment Script
# Version 3.0 with robust error handling and smart URL detection

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

echo "🚀 Deploying AI Recommendation System v3.0"
echo "📡 ${FUNCTION_NAME} → ${PROJECT_ID}"

# Check for .env.yaml file first
ENV_YAML_PATH="../secret/.env.yaml"
if [ -f "$ENV_YAML_PATH" ]; then
    echo "✅ Found .env.yaml"
    ENV_FILE_FLAG="--env-vars-file $ENV_YAML_PATH"
else
    echo "⚠️ No .env.yaml found"
    if [ -z "$OPENAI_API_KEY" ]; then
        read -s -p "OpenAI API key: " OPENAI_API_KEY
    fi
    
    if [ ! -z "$OPENAI_API_KEY" ]; then
        ENV_FILE_FLAG="--set-env-vars OPENAI_API_KEY=${OPENAI_API_KEY}"
        echo "✅ OpenAI configured"
    else
        ENV_FILE_FLAG=""
        echo "⚠️ Fallback mode"
    fi
fi

echo "🔧 Deploying..."
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
    echo "🎉 v3.0 deployment successful!"
    echo ""
    echo "📡 Endpoint: https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}"
    echo ""
    echo "📊 Features: Multi-stage • BM25 • LLM • Error handling • Smart URLs"
    if [ ! -z "$OPENAI_API_KEY" ] || [ -f "$ENV_YAML_PATH" ]; then
        echo "✅ OpenAI enabled"
    else
        echo "⚠️ Fallback mode"
    fi
else
    echo "❌ Deployment failed!"
    exit 1
fi
