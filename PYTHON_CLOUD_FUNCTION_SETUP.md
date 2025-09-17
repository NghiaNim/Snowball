# Python Cloud Function Setup Guide

## Overview
The recommendation system has been migrated to Python for better performance and to use the OkapiBM25 algorithm for superior text matching.

## 🐍 Python Advantages

### Why Python?
- **OkapiBM25**: Access to the `rank-bm25` library for true BM25 algorithm implementation
- **Pandas**: Robust CSV/Excel parsing with encoding detection
- **Better Data Handling**: Superior text processing and data cleaning capabilities
- **NumPy/SciPy Ecosystem**: Future ML enhancements and vector operations
- **Error Handling**: More robust file parsing with encoding detection

## 📦 Dependencies

The Python Cloud Function uses these key libraries:

```python
google-cloud-storage==2.17.0  # GCS integration
functions-framework==3.5.0    # Cloud Functions runtime
openai==1.35.0                # AI integration (compatible version)
rank-bm25==0.2.2              # True OkapiBM25 algorithm
pandas==2.2.2                 # Data processing
openpyxl==3.1.2               # Excel file support
chardet==5.2.0                # Encoding detection
flask==3.0.3                  # HTTP handling
flask-cors==4.0.1             # CORS support
```

## 🔑 OpenAI API Key Setup

### Method 1: Environment Variables File (Recommended)

1. Create or edit `secret/.env.yaml`:
```yaml
OPENAI_API_KEY: sk-your-actual-openai-api-key-here
```

2. Deploy with the script:
```bash
cd cloud-function-python
./deploy.sh
```

### Method 2: Environment Variable

```bash
export OPENAI_API_KEY="sk-your-actual-openai-api-key-here"
cd cloud-function-python
./deploy.sh
```

### Method 3: Interactive Input
If no key is found, the deployment script will prompt you to enter it:
```bash
cd cloud-function-python
./deploy.sh
# Enter your OpenAI API key when prompted
```

## 🚀 Deployment

### Quick Deploy
```bash
cd /Users/nghianim/Documents/Snowball/cloud-function-python
chmod +x deploy.sh
./deploy.sh
```

### Manual Deploy
```bash
gcloud functions deploy getRecommendationsV2 \
  --runtime python312 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point get_recommendations \
  --memory 1024MB \
  --timeout 540s \
  --region us-central1 \
  --project snowball-471001 \
  --no-gen2 \
  --env-vars-file ../secret/.env.yaml \
  --source .
```

## 📡 API Endpoints

| Endpoint | URL |
|----------|-----|
| **Main Function** | `https://us-central1-snowball-471001.cloudfunctions.net/getRecommendationsV2` |
| **Health Check** | `https://us-central1-snowball-471001.cloudfunctions.net/getRecommendationsV2` (GET) |

## 🧪 Testing

### Test Follow-up Questions
```bash
curl -X POST https://us-central1-snowball-471001.cloudfunctions.net/getRecommendationsV2 \
  -H 'Content-Type: application/json' \
  -d '{"stage": "questions", "query": "find healthcare investors"}'
```

### Test Full Search (requires uploaded dataset)
```bash
curl -X POST https://us-central1-snowball-471001.cloudfunctions.net/getRecommendationsV2 \
  -H 'Content-Type: application/json' \
  -d '{
    "stage": "search",
    "query": "find healthcare investors",
    "datasetId": "1726525200000",
    "followUpAnswers": {"intent": "Investment"},
    "limit": 5
  }'
```

## 🔧 Architecture Components

### 1. `main.py` - Entry Point
- HTTP request handling
- CORS configuration
- Pipeline orchestration
- Health checks

### 2. `ai_agent.py` - AI Processing
- Follow-up question generation
- Query to criteria translation
- OpenAI GPT-4o-mini integration
- Fallback question handling

### 3. `bm25_search.py` - Text Search
- OkapiBM25 implementation using `rank-bm25`
- Fast candidate filtering
- Field-specific matching
- Hard filters (exclusions)

### 4. `llm_refinement.py` - Contextual Analysis
- Batch LLM processing
- Detailed candidate analysis
- Cultural fit assessment
- Scoring combination

### 5. `data_parser.py` - Data Processing
- Robust CSV/Excel parsing
- Encoding detection with `chardet`
- Data cleaning and validation
- Pandas-based processing

## ⚡ Performance Improvements

### BM25 Algorithm
- **True OkapiBM25**: More accurate than TF-IDF approximations
- **Fast Filtering**: Pre-filters candidates before expensive LLM calls
- **Relevance Ranking**: Better text matching with document frequency

### Data Processing
- **Encoding Detection**: Handles various file encodings automatically
- **Pandas Processing**: More efficient CSV/Excel parsing
- **Data Cleaning**: Robust field name and value normalization

### Error Handling
- **Graceful Fallbacks**: System works without OpenAI API key
- **Robust Parsing**: Handles malformed CSV/Excel files
- **Memory Management**: Efficient processing of large datasets

## 🛠️ Troubleshooting

### Common Issues

1. **OpenAI API Error**
   - Check your API key in `secret/.env.yaml`
   - Ensure key starts with `sk-`
   - Verify OpenAI account has credits

2. **Import Errors**
   - Check Python runtime version (should be python312)
   - Verify all dependencies in `requirements.txt`

3. **Memory Issues**
   - Function has 1024MB memory allocation
   - Large datasets may need memory optimization

4. **Timeout Issues**
   - Function timeout is set to 540s (9 minutes)
   - Complex LLM analysis may take time

### Logs
Check Cloud Function logs:
```bash
gcloud functions logs read getRecommendationsV2 --region=us-central1 --project=snowball-471001
```

## 🔄 Migration from JavaScript

The Python version provides these improvements over the JavaScript version:
- ✅ True OkapiBM25 algorithm (vs TF-IDF approximation)
- ✅ Better CSV/Excel parsing with encoding detection
- ✅ More robust error handling
- ✅ Pandas data processing capabilities
- ✅ Future ML/AI enhancements support

## 📝 Future Enhancements

With Python, we can easily add:
- **Vector Search**: Using scikit-learn or sentence-transformers
- **Advanced NLP**: spaCy integration for entity recognition
- **ML Models**: Custom scoring models with scikit-learn
- **Caching**: Redis integration for faster repeated queries
- **Streaming**: Real-time result streaming for large datasets

---

**Note**: Remember to replace `sk-your-actual-openai-api-key-here` with your real OpenAI API key in the `.env.yaml` file for full AI functionality.
