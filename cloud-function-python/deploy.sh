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
    echo "✅ Found .env.yaml with credentials"
    
    # The .env.yaml file should contain the Supabase credentials
    # We need to add the cloud function specific variables to the deployment
    # Extract values from .env.yaml and set them as additional environment variables
    
    # Read values from .env.yaml (assuming standard YAML format)
    SUPABASE_URL=$(grep -E "^NEXT_PUBLIC_SUPABASE_URL:" "$ENV_YAML_PATH" | cut -d':' -f2- | tr -d ' "'"'"'')
    SUPABASE_SERVICE_ROLE_KEY=$(grep -E "^SUPABASE_SERVICE_ROLE_KEY:" "$ENV_YAML_PATH" | cut -d':' -f2- | tr -d ' "'"'"'')
    OPENAI_API_KEY=$(grep -E "^OPENAI_API_KEY:" "$ENV_YAML_PATH" | cut -d':' -f2- | tr -d ' "'"'"'')
    
    echo "🔗 Using Supabase URL from .env.yaml"
    echo "🔑 Using service role key from .env.yaml"
    
    # Build additional environment variables for cloud function
    CLOUD_FUNCTION_VARS=""
    if [ ! -z "$SUPABASE_URL" ]; then
        CLOUD_FUNCTION_VARS="SUPABASE_URL=${SUPABASE_URL}"
    fi
    if [ ! -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        if [ ! -z "$CLOUD_FUNCTION_VARS" ]; then
            CLOUD_FUNCTION_VARS="${CLOUD_FUNCTION_VARS},SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}"
        else
            CLOUD_FUNCTION_VARS="SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}"
        fi
    fi
    if [ ! -z "$OPENAI_API_KEY" ]; then
        if [ ! -z "$CLOUD_FUNCTION_VARS" ]; then
            CLOUD_FUNCTION_VARS="${CLOUD_FUNCTION_VARS},OPENAI_API_KEY=${OPENAI_API_KEY}"
        else
            CLOUD_FUNCTION_VARS="OPENAI_API_KEY=${OPENAI_API_KEY}"
        fi
    fi
    
    # Use only --set-env-vars with variables extracted from .env.yaml
    if [ ! -z "$CLOUD_FUNCTION_VARS" ]; then
        ENV_FILE_FLAG="--set-env-vars ${CLOUD_FUNCTION_VARS}"
        echo "✅ Environment variables configured from .env.yaml"
    else
        ENV_FILE_FLAG=""
        echo "⚠️ No cloud function variables found in .env.yaml"
    fi
else
    echo "⚠️ No .env.yaml found at: $ENV_YAML_PATH"
    echo "   Please see CREATE_ENV_YAML.md for setup instructions"
    echo ""
    read -p "Press Enter to continue with manual setup, or Ctrl+C to exit and create .env.yaml: "
    
    # Manual fallback
    read -p "Supabase URL: " SUPABASE_URL
    read -s -p "Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
    echo
    read -s -p "OpenAI API Key (optional): " OPENAI_API_KEY
    echo
    
    # Build environment variables manually
    ENV_VARS=""
    if [ ! -z "$SUPABASE_URL" ]; then
        ENV_VARS="SUPABASE_URL=${SUPABASE_URL}"
    fi
    if [ ! -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        if [ ! -z "$ENV_VARS" ]; then
            ENV_VARS="${ENV_VARS},SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}"
        else
            ENV_VARS="SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}"
        fi
    fi
    if [ ! -z "$OPENAI_API_KEY" ]; then
        if [ ! -z "$ENV_VARS" ]; then
            ENV_VARS="${ENV_VARS},OPENAI_API_KEY=${OPENAI_API_KEY}"
        else
            ENV_VARS="OPENAI_API_KEY=${OPENAI_API_KEY}"
        fi
    fi
    
    if [ ! -z "$ENV_VARS" ]; then
        ENV_FILE_FLAG="--set-env-vars ${ENV_VARS}"
        echo "✅ Environment variables configured manually"
    else
        ENV_FILE_FLAG=""
        echo "⚠️ No environment variables set"
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
    echo "📊 Features: Multi-stage • BM25 • LLM • Direct Supabase updates"
    
    if [ -f "$ENV_YAML_PATH" ]; then
        echo "🗄️ Database: Supabase direct connection (from .env.yaml)"
        echo "✅ Progress updates enabled"
    else
        echo "⚠️ No .env.yaml file - database updates may be limited"
    fi
    
    if [ ! -z "$OPENAI_API_KEY" ] || [ -f "$ENV_YAML_PATH" ]; then
        echo "🤖 OpenAI enabled"
    else
        echo "⚠️ Fallback mode (no OpenAI)"
    fi
    
    echo ""
    echo "🚀 Ready to process AI recommendations!"
    echo "   No more localhost connection issues!"
else
    echo "❌ Deployment failed!"
    exit 1
fi
