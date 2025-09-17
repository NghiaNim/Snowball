# Snowball AI Recommendations Cloud Function

This Google Cloud Function provides AI-powered recommendations using BigQuery and OpenAI.

## Architecture

- **AI Agent** (`ai-agent.js`): Translates natural language queries into structured criteria using OpenAI GPT-4
- **Recommendation Engine** (`recommendation-engine.js`): Uses BigQuery to find and score recommendations
- **Main Function** (`index.js`): HTTP endpoint that orchestrates the entire process

## Example Usage

### Request
```bash
POST https://your-region-your-project.cloudfunctions.net/getRecommendations
```

```json
{
  "query": "AI founder raising seed round looking for healthcare investors",
  "datasetId": "1704567890000",
  "limit": 10
}
```

### Response
```json
{
  "success": true,
  "query": "AI founder raising seed round looking for healthcare investors",
  "criteria_used": {
    "intent": "fundraising",
    "target_persona": {
      "roles": ["investor"],
      "experience_level": "senior",
      "industries": ["healthcare", "ai"]
    },
    "matching_criteria": {
      "must_have": {
        "keywords": ["healthcare", "ai", "seed"],
        "min_experience_years": 8
      }
    },
    "ranking_priorities": [
      {"factor": "healthcare_portfolio_fit", "weight": 0.4},
      {"factor": "seed_stage_activity", "weight": 0.3},
      {"factor": "ai_investment_history", "weight": 0.2},
      {"factor": "response_rate", "weight": 0.1}
    ]
  },
  "recommendations": [
    {
      "id": "sarah_chen_healthtech",
      "data": {
        "name": "Sarah Chen",
        "title": "Partner",
        "company": "HealthTech Ventures",
        "location": "San Francisco, CA",
        "industry": "Healthcare"
      },
      "match_score": 0.92,
      "match_reasons": [
        "Healthcare industry experience",
        "AI investment focus",
        "Seed stage activity"
      ]
    }
  ],
  "metadata": {
    "total_found": 5,
    "processing_time": 1250,
    "dataset_id": "1704567890000"
  }
}
```

## Deployment

### Prerequisites

1. **Google Cloud Project** with billing enabled
2. **APIs enabled**:
   - Cloud Functions API
   - BigQuery API
   - Cloud Storage API
3. **Environment variables**:
   - `OPENAI_API_KEY` (optional, fallback translation available)
   - `GOOGLE_CLOUD_PROJECT` (auto-set by Cloud Functions)

### Deploy Commands

```bash
# Navigate to cloud-function directory
cd cloud-function

# Install dependencies
npm install

# Deploy the function
gcloud functions deploy getRecommendations \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point getRecommendations \
  --memory 512MB \
  --timeout 60s \
  --set-env-vars OPENAI_API_KEY=your-openai-key

# Deploy health check function (optional)
gcloud functions deploy healthCheck \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point healthCheck \
  --memory 256MB \
  --timeout 30s
```

### Set Environment Variables

```bash
# Set OpenAI API key (optional)
gcloud functions deploy getRecommendations \
  --update-env-vars OPENAI_API_KEY=sk-your-api-key-here

# Or set via Google Cloud Console:
# 1. Go to Cloud Functions
# 2. Click on your function
# 3. Click "Edit"
# 4. Add environment variables
```

### Testing

```bash
# Test the function
curl -X POST https://your-region-your-project.cloudfunctions.net/getRecommendations \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Find healthcare founders with AI experience",
    "datasetId": "test_dataset_id",
    "limit": 5
  }'

# Health check
curl https://your-region-your-project.cloudfunctions.net/healthCheck
```

## Integration with Frontend

Update your `AIQueryInterface.tsx` component to call the Cloud Function:

```typescript
const handleQuery = async () => {
  const response = await fetch('https://your-cloud-function-url/getRecommendations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query.trim(),
      datasetId: selectedDatasetId,
      limit: 10
    })
  });

  const result = await response.json();
  setResults(result);
};
```

## Query Examples

### Fundraising
- "AI founder raising seed round looking for healthcare investors"
- "Find Series A investors with fintech experience"
- "Healthcare startup seeking growth equity partners"

### Hiring
- "Senior engineers with React and AI experience in San Francisco"
- "Engineering leaders with startup experience"
- "Product designers with healthcare background"

### Networking
- "10 of the coolest people with investments in energy"
- "Healthcare executives with innovation track records"
- "Female founders in biotech who have raised Series A"

### Collaboration
- "Research partners in quantum computing"
- "Advisory board candidates with enterprise software experience"

## Performance

- **Cold start**: ~2-3 seconds
- **Warm execution**: ~500-1500ms
- **BigQuery query time**: ~200-800ms
- **OpenAI API call**: ~500-2000ms

## Troubleshooting

### Common Issues

1. **"Dataset table not found"**
   - Ensure dataset is uploaded and processed through the main application
   - Check BigQuery console for table existence

2. **"OpenAI API error"**
   - Verify API key is set correctly
   - Function will use fallback translation if OpenAI fails

3. **"BigQuery permission denied"**
   - Ensure Cloud Function service account has BigQuery permissions
   - Grant "BigQuery Data Viewer" and "BigQuery Job User" roles

### Monitoring

- View logs: `gcloud functions logs read getRecommendations`
- Monitor in Google Cloud Console: Cloud Functions → your-function → Logs
- Set up alerting for errors and performance

## Cost Estimation

### Per 1000 requests:
- **Cloud Function**: ~$0.40 (512MB, 2 seconds average)
- **BigQuery**: ~$0.01 (depending on data size)
- **OpenAI API**: ~$0.50 (GPT-4 mini)
- **Total**: ~$0.91 per 1000 requests

Lower cost options:
- Use fallback translation (no OpenAI): ~$0.41 per 1000 requests
- Optimize BigQuery queries for better performance
- Use caching for repeated queries
