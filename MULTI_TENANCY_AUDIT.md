# Multi-Tenancy Field Audit Report

**Date**: December 3, 2025
**Issue**: Inconsistent tenant identifier field usage across backend code
**Impact**: Critical blocker for MVP - prevents proper multi-tenant data isolation

---

## Executive Summary

**Problem**: The codebase uses two different field names for tenant identification:
- `facility_id` - Used in 145 places in backend analyzers/handlers
- `org_id` - Used in database schema, frontend, and some backend code

**Recommendation**: Standardize on `org_id` throughout the entire codebase.

**Reason**:
1. `org_id` matches Clerk's authentication JWT structure (JWT contains `org_id` claim)
2. Database schema already uses `org_id` exclusively
3. Frontend already uses `org_id` exclusively
4. Only backend analyzers/handlers need updating

---

## Audit Results

### ✅ Database Schema (100% `org_id`)
```
Location: scripts/init-db.sql
- org_id references: 27
- facility_id references: 0
```

**Tables using `org_id`**:
- audit_logs
- mapping_profiles
- analyses
- chat_messages
- customers
- analyzer_configs
- subscriptions
- usage_events
- work_orders
- csv_mappings
- facility_baselines

All tables have:
- `org_id UUID NOT NULL` column
- Foreign key to organizations table
- RLS policies filtering by `org_id`

### ✅ Frontend (100% `org_id`)
```
Location: frontend/**/*.{ts,tsx}
- org_id references: 11
- facility_id references: 0
```

**Files using `org_id`**:
- frontend/lib/types/api.ts (API type definitions)
- frontend/lib/api-client.ts (API client)

### ❌ Backend (Mixed - NEEDS FIX)
```
Location: backend/app/**/*.py
- facility_id references: 145
- org_id references: 74
```

**Files using `facility_id` (17 files)**:

1. **Analyzers** (4 files):
   - `backend/app/analyzers/quality_analyzer.py`
   - `backend/app/analyzers/efficiency_analyzer.py`
   - `backend/app/analyzers/equipment_predictor.py`
   - `backend/app/analyzers/cost_analyzer.py`

2. **Orchestrators** (3 files):
   - `backend/app/orchestrators/auto_analysis_orchestrator.py`
   - `backend/app/orchestrators/orchestrator.py`
   - `backend/app/ai/auto_analysis_system.py`

3. **Handlers** (6 files):
   - `backend/app/handlers/data_query_handler.py`
   - `backend/app/handlers/csv_upload_service.py`
   - `backend/app/handlers/query_router.py`
   - `backend/app/handlers/scenario_handler.py`
   - `backend/app/handlers/data_aware_responder.py`
   - `backend/app/utils/flexible_column_mapper.py`

4. **Analytics** (4 files):
   - `backend/app/analytics/correlation_analyzer.py`
   - `backend/app/analytics/baseline_tracker.py`
   - `backend/app/analytics/degradation_detector.py`
   - `backend/app/analytics/trend_detector.py`

---

## Impact Analysis

### Why This Is Critical

1. **Authentication Mismatch**:
   - Clerk JWT contains `org_id` field
   - Backend code expects `facility_id`
   - **Result**: Auth middleware provides `org_id` but analyzers can't use it

2. **Database Query Failures**:
   - Database tables have `org_id` column
   - Backend code queries for `facility_id`
   - **Result**: SQL errors or wrong data returned

3. **Data Isolation Broken**:
   - RLS policies filter by `org_id`
   - Backend code passes `facility_id`
   - **Result**: Multi-tenant isolation fails, potential data leakage

### Example Problem

**Auth Middleware** (backend/app/middleware/auth.py:123):
```python
user_context = {
    "user_id": payload.get("sub"),
    "org_id": payload.get("org_id"),  # ← Provides org_id
    "role": payload.get("role", "user"),
}
```

**Cost Analyzer** (backend/app/analyzers/cost_analyzer.py):
```python
async def analyze_cost_opportunities(
    df: pd.DataFrame,
    facility_id: str,  # ← Expects facility_id!
    supabase: Client
):
    # Query database for facility baselines
    response = supabase.table("facility_baselines") \
        .select("*") \
        .eq("facility_id", facility_id) \  # ← Column doesn't exist!
        .execute()
```

**Result**:
- Database has `org_id` column, not `facility_id`
- Query will fail with "column does not exist" error
- Even if query succeeds, RLS policy filters by `org_id`, not `facility_id`

---

## Recommendation

**Standard: Use `org_id` everywhere**

### Rationale

1. **Matches Clerk**: JWT tokens from Clerk contain `org_id` claim
2. **Database Ready**: All 11 tables already use `org_id`
3. **Frontend Ready**: All TypeScript types already use `org_id`
4. **Least Changes**: Only 17 backend files need updating vs entire database + frontend

### Migration Strategy

**Step 1**: Global find/replace in backend
```bash
# In all backend Python files, replace:
facility_id → org_id
```

**Step 2**: Update function signatures
```python
# Before
async def analyze_cost_opportunities(df: pd.DataFrame, facility_id: str, supabase: Client):

# After
async def analyze_cost_opportunities(df: pd.DataFrame, org_id: str, supabase: Client):
```

**Step 3**: Update database queries
```python
# Before
.eq("facility_id", facility_id)

# After
.eq("org_id", org_id)
```

**Step 4**: Update comments and docstrings
```python
# Before
"""
Args:
    facility_id: Unique facility identifier

# After
"""
Args:
    org_id: Organization ID (multi-tenant identifier)
```

---

## Files Requiring Changes

### High Priority (Core Analyzers - 4 files)
These are called directly from API endpoints:

1. `backend/app/analyzers/cost_analyzer.py` - Cost analysis logic
2. `backend/app/analyzers/quality_analyzer.py` - Quality metrics
3. `backend/app/analyzers/equipment_predictor.py` - Equipment predictions
4. `backend/app/analyzers/efficiency_analyzer.py` - Efficiency analysis

### Medium Priority (Orchestrators - 3 files)
These coordinate analyzer execution:

5. `backend/app/orchestrators/orchestrator.py` - Main orchestrator
6. `backend/app/orchestrators/auto_analysis_orchestrator.py` - Auto-analysis
7. `backend/app/ai/auto_analysis_system.py` - AI-powered analysis

### Medium Priority (Handlers - 6 files)
These handle data processing:

8. `backend/app/handlers/csv_upload_service.py` - CSV uploads
9. `backend/app/handlers/data_query_handler.py` - Data queries
10. `backend/app/handlers/query_router.py` - Query routing
11. `backend/app/handlers/scenario_handler.py` - Scenario analysis
12. `backend/app/handlers/data_aware_responder.py` - AI responses
13. `backend/app/utils/flexible_column_mapper.py` - Column mapping

### Low Priority (Analytics - 4 files)
These provide supporting analytics:

14. `backend/app/analytics/baseline_tracker.py` - Baseline tracking
15. `backend/app/analytics/correlation_analyzer.py` - Correlation analysis
16. `backend/app/analytics/degradation_detector.py` - Degradation detection
17. `backend/app/analytics/trend_detector.py` - Trend analysis

---

## Testing Plan

After migration, verify:

1. **Authentication Flow**:
   - JWT contains `org_id`
   - Auth middleware extracts `org_id`
   - Analyzers receive `org_id`
   - Database queries use `org_id`

2. **Database Queries**:
   - All queries reference `org_id` column (not `facility_id`)
   - RLS policies correctly filter by `org_id`
   - No SQL errors about missing columns

3. **Multi-Tenant Isolation**:
   - User A from Org 1 cannot see data from Org 2
   - Analysis results correctly filtered by `org_id`
   - CSV uploads tagged with correct `org_id`

---

## Next Steps

1. **Create migration script** to automate find/replace
2. **Update all 17 backend files** to use `org_id`
3. **Test authentication flow** end-to-end
4. **Verify RLS policies** work correctly
5. **Update documentation** to reflect `org_id` standard

---

## Risk Assessment

**Risk Level**: 🔴 **HIGH** (Blocks MVP Launch)

**Why High**:
- Breaks authentication integration
- Prevents database queries from working
- Violates multi-tenant data isolation
- Impacts all 4 core analyzers

**Mitigation**:
- Straightforward find/replace operation
- Low risk of introducing bugs (simple rename)
- Can be done in single session
- Easy to verify with tests

---

## Conclusion

The multi-tenancy field mismatch is a critical blocker but has a simple fix: globally rename `facility_id` → `org_id` in 17 backend files. This will align the entire codebase on the standard used by Clerk authentication, the database schema, and the frontend.

**Estimated Time**: 1-2 hours
**Complexity**: Low (find/replace operation)
**Impact**: High (unblocks authentication and database integration)
