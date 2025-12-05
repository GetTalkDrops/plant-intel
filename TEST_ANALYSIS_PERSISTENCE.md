# Testing Analysis Persistence - Quick Guide

**Purpose**: Verify that analysis results are being saved to and retrieved from the database

---

## Quick Smoke Test (5 minutes)

### Prerequisites
```bash
# Ensure all containers are running
docker-compose ps

# All should show "healthy" status
# ✅ plantintel-api-1      - Up, healthy
# ✅ plantintel-web-1      - Up, healthy
# ✅ plantintel-postgres-1 - Up
# ✅ plantintel-redis-1    - Up
```

### Test Flow

#### Step 1: Check API Health
```bash
curl http://localhost:8000/api/v1/health
# Expected: {"status":"healthy","service":"plant-intel-api","timestamp":"..."}
```

#### Step 2: Get Auth Token (Simulated for Testing)
Since we're testing locally, you'll need to either:
- **Option A**: Use the frontend at http://localhost:3001 and sign in with Clerk
- **Option B**: Use a test JWT token (see backend tests for examples)

For this guide, we'll use **Option A** (frontend testing).

---

## Frontend Testing (Recommended)

### Step 1: Sign In
1. Open browser to http://localhost:3001
2. Sign in with Clerk (or create test account)
3. You should land on the dashboard

### Step 2: Upload CSV & Run Analysis
1. Navigate to **Upload** page
2. Create a test CSV file:
   ```csv
   date,product,quantity,cost,machine
   2024-01-01,Widget A,100,1500,Machine 1
   2024-01-02,Widget B,150,2000,Machine 2
   2024-01-03,Widget A,120,1800,Machine 1
   ```
3. Upload the CSV
4. Map the columns (you can use auto-mapping or manual)
5. Click **"Run Analysis"**
6. Wait for analysis to complete

**Expected Result**:
- ✅ Analysis runs successfully
- ✅ Shows insights (urgent, notable, summary)
- ✅ Returns an `analysis_id` (check network tab)

### Step 3: Verify Persistence - Refresh Page
1. **Refresh the browser** (Cmd+R / F5)
2. Navigate to **AI Chat** page
3. Look at the **Analysis Context Selector** dropdown

**Expected Result**:
- ✅ Dropdown shows the analysis you just ran
- ✅ Analysis ID and batch ID are visible
- ✅ Can select it from the dropdown

**If you see the analysis in the dropdown after refresh, persistence is working!** ✅

### Step 4: Test Chat Context
1. Select the analysis from dropdown
2. Type a message: "What insights did you find from this analysis?"
3. Send the message

**Expected Result**:
- ✅ AI responds with insights from the specific analysis
- ✅ References the data from your CSV

### Step 5: Check Analysis List
1. Keep the browser developer tools open (F12)
2. Go to Network tab
3. Navigate to Chat page (if not already there)
4. Look for a request to `/api/v1/analyze/list`

**Expected Response**:
```json
{
  "success": true,
  "org_id": "org_...",
  "analyses": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "batch_id": "batch_...",
      "data_tier": "Tier 1",
      "created_at": "2025-12-05T...",
      "insights": { ... }
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

## API Testing (Direct Backend Testing)

If you want to test the API directly without the frontend:

### Step 1: Get a Valid Token
The API requires authentication. For testing, you can:

1. **Use the backend test suite**:
   ```bash
   cd backend
   make test-coverage
   ```
   This will run all tests including analysis persistence tests.

2. **Or extract token from frontend**:
   - Sign in at http://localhost:3001
   - Open browser DevTools (F12)
   - Go to Network tab
   - Make any API request
   - Copy the `Authorization: Bearer <token>` header

### Step 2: Test Analysis Creation
```bash
# Replace <TOKEN> with your actual JWT token
TOKEN="eyJhbGc..."

# Run analysis
curl -X POST http://localhost:8000/api/v1/analyze/auto \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": "test_batch_123",
    "csv_headers": ["date", "product", "quantity", "cost", "machine"],
    "data_tier": 1
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "analysis_id": "550e8400-...",
  "execution_time_ms": 1234,
  "data_tier": "Tier 1",
  "analyzers_run": ["cost", "efficiency"],
  "insights": {
    "urgent": [...],
    "notable": [...],
    "summary": {...}
  }
}
```

**Key Check**: ✅ `analysis_id` is present (this proves it was saved)

### Step 3: Retrieve the Analysis
```bash
# Use the analysis_id from previous response
ANALYSIS_ID="550e8400-..."

curl http://localhost:8000/api/v1/analyze/results/$ANALYSIS_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "id": "550e8400-...",
  "org_id": "org_...",
  "batch_id": "test_batch_123",
  "data_tier": "Tier 1",
  "created_at": "2025-12-05T...",
  "insights": {...}
}
```

**Key Check**: ✅ Returns the same data you sent

### Step 4: List All Analyses
```bash
curl http://localhost:8000/api/v1/analyze/list \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "analyses": [
    {
      "id": "550e8400-...",
      "batch_id": "test_batch_123",
      ...
    }
  ],
  "total": 1
}
```

---

## Database Verification (Advanced)

### Check Database Directly
```bash
# Connect to PostgreSQL (if using local DB)
docker-compose exec postgres psql -U postgres -d plantintel

# Or connect to Supabase using their SQL Editor
```

**Run this query**:
```sql
SELECT
    id,
    org_id,
    batch_id,
    data_tier,
    created_at,
    analyzers_run,
    jsonb_pretty(insights) as insights
FROM analyses
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result**:
- ✅ See your analysis records
- ✅ `id` is a UUID
- ✅ `org_id` matches your organization
- ✅ `insights` contains the analysis results
- ✅ `created_at` is recent

---

## Automated Testing

### Run Backend Tests
```bash
cd backend

# Run all tests
make test

# Run only analysis tests
pytest tests/test_analysis_service.py -v

# Run with coverage
make test-coverage
```

**Expected Output**:
```
tests/test_analysis_service.py::test_save_analysis PASSED
tests/test_analysis_service.py::test_get_analysis PASSED
tests/test_analysis_service.py::test_list_analyses PASSED
tests/test_routers/test_analysis.py::test_auto_analyze PASSED
tests/test_routers/test_analysis.py::test_get_results PASSED
tests/test_routers/test_analysis.py::test_list_analyses PASSED
```

---

## Common Issues & Troubleshooting

### Issue 1: "Supabase not configured"
**Symptom**: Analysis runs but doesn't persist, warning in logs

**Fix**:
```bash
# Check environment variables
docker-compose exec api env | grep SUPABASE

# Should show:
# SUPABASE_URL=https://...
# SUPABASE_SERVICE_KEY=eyJ...
```

If missing, add to `.env` file and restart:
```bash
docker-compose restart api
```

### Issue 2: "Analysis not found" (404)
**Symptom**: Analysis creates successfully but retrieval fails

**Possible Causes**:
1. **Wrong org_id**: RLS policies blocking access
2. **Analysis not saved**: Check API logs for save errors

**Debug**:
```bash
# Check API logs
docker-compose logs api | grep "Analysis saved"

# Should see:
# INFO: Analysis saved successfully: 550e8400-...
```

### Issue 3: Chat dropdown empty after refresh
**Symptom**: Analysis dropdown doesn't show saved analyses

**Fix**:
1. Open browser DevTools
2. Check Network tab for `/api/v1/analyze/list` request
3. Look for errors in response
4. Check Console tab for JavaScript errors

**Common causes**:
- API route mismatch (check endpoint path)
- Response format mismatch (check data.analyses)
- Authentication expired (re-sign in)

### Issue 4: Database connection errors
**Symptom**: "Failed to create Supabase client" in logs

**Fix**:
```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
     https://your-project.supabase.co/rest/v1/

# Should return 404 or list of tables, not 401
```

---

## Success Criteria

Your testing is successful if:

- ✅ **Analysis Creation**: POST to `/analyze/auto` returns `analysis_id`
- ✅ **Persistence**: Analysis survives page refresh
- ✅ **Retrieval**: GET from `/analyze/results/{id}` returns saved data
- ✅ **List**: GET from `/analyze/list` shows all saved analyses
- ✅ **Chat Context**: Dropdown shows saved analyses
- ✅ **Multi-tenancy**: Can't access other org's analyses
- ✅ **Database**: Records visible in `analyses` table

---

## Quick Verification Checklist

Run through this checklist to confirm everything works:

1. [ ] Containers running and healthy
2. [ ] Can sign in to frontend
3. [ ] Can upload CSV and run analysis
4. [ ] Analysis returns `analysis_id`
5. [ ] After page refresh, analysis appears in chat dropdown
6. [ ] Can select analysis and chat about it
7. [ ] API logs show "Analysis saved successfully"
8. [ ] Database shows records in `analyses` table
9. [ ] Multiple analyses accumulate over time
10. [ ] Old analyses still accessible after days

---

## Performance Testing (Optional)

### Test Multiple Analyses
```bash
# Run 10 analyses in sequence
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/v1/analyze/auto \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"batch_id\": \"batch_$i\",
      \"csv_headers\": [\"date\", \"product\", \"quantity\"],
      \"data_tier\": 1
    }"
  sleep 2
done

# Then list all
curl http://localhost:8000/api/v1/analyze/list?limit=20 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: All 10 analyses should be listed

### Test Pagination
```bash
# Get first page
curl "http://localhost:8000/api/v1/analyze/list?limit=5&offset=0" \
  -H "Authorization: Bearer $TOKEN"

# Get second page
curl "http://localhost:8000/api/v1/analyze/list?limit=5&offset=5" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Different results in each page, no duplicates

---

## Next Steps After Testing

Once testing confirms everything works:

1. **Document findings** - Note any issues discovered
2. **Fix any bugs** - Address problems found during testing
3. **Load test** - Test with larger data sets
4. **Security test** - Verify multi-tenancy isolation
5. **Deploy** - Move to production with confidence

---

## Need Help?

If tests fail:
1. Check [BLOCKER_4_RESOLUTION.md](docs/BLOCKER_4_RESOLUTION.md) for implementation details
2. Review API logs: `docker-compose logs api -f`
3. Check database: Connect to Supabase and verify schema
4. Test authentication: Ensure JWT tokens are valid

**The system is designed to work. If tests fail, it's likely a configuration issue, not a code issue.**

---

**Last Updated**: December 5, 2025
**Status**: Ready for Testing
