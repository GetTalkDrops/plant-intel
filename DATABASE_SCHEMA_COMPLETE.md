# Database Schema Complete ✅

**Status**: All 11 tables defined | **Date**: 2025-12-03

---

## Summary

Successfully added 3 missing tables to the database schema that are required by the backend analyzers and services.

---

## Tables Added (3 New)

### 1. ✅ work_orders
**Purpose**: Store production work order data from CSV uploads

**Referenced by**:
- [backend/app/analyzers/equipment_predictor.py](backend/app/analyzers/equipment_predictor.py)
- [backend/app/analyzers/quality_analyzer.py](backend/app/analyzers/quality_analyzer.py)

**Key Fields**:
- `org_id` - Multi-tenant isolation
- `batch_id` - Links to CSV upload batch
- `work_order_number` - Unique identifier
- `product_name`, `product_code` - Product info
- `quantity_planned`, `quantity_produced`, `quantity_scrapped` - Production metrics
- `machine_id`, `operator_id` - Resource tracking
- `labor_hours`, `material_cost`, `labor_cost` - Cost tracking

**Indexes**: org_id, batch_id, work_order_number, product_code, machine_id, start_date

---

### 2. ✅ csv_mappings
**Purpose**: Store user-defined CSV column to variable mappings

**Referenced by**:
- [backend/app/services/csv_upload_service.py](backend/app/services/csv_upload_service.py)

**Key Fields**:
- `org_id` - Multi-tenant isolation
- `profile_id` - References mapping_profiles (CASCADE delete)
- `batch_id` - Links to CSV upload batch
- `source_column` - Original CSV column name
- `target_variable` - Mapped to standard variable (e.g., "work_order", "product_name")
- `transformation` - Optional transformation logic
- `confidence` - Mapping confidence score
- `validated` - User confirmed mapping

**Indexes**: org_id, profile_id, batch_id, target_variable

---

### 3. ✅ facility_baselines
**Purpose**: Store baseline metrics for comparison and anomaly detection

**Referenced by**:
- [backend/app/analyzers/cost_analyzer.py](backend/app/analyzers/cost_analyzer.py)

**Key Fields**:
- `org_id` - Multi-tenant isolation
- `metric_name` - Metric identifier (e.g., "avg_labor_cost_per_unit")
- `metric_category` - Category: cost, quality, efficiency, equipment
- `baseline_value` - The baseline value
- `unit` - Unit of measurement
- `sample_size` - Number of records used for calculation
- `confidence_level` - Statistical confidence
- `valid_from`, `valid_until` - Time validity range

**Indexes**: org_id, metric_category, metric_name, valid_from

**Unique Constraint**: (org_id, metric_name, metric_category)

---

## Complete Table List (11 Total)

### Existing Tables (8):
1. ✅ `audit_logs` - Immutable audit trail
2. ✅ `mapping_profiles` - User-saved mapping profiles
3. ✅ `analyses` - Analysis results from orchestrator
4. ✅ `chat_messages` - AI chat history
5. ✅ `customers` - Organization/customer records
6. ✅ `analyzer_configs` - Custom analyzer configurations
7. ✅ `subscriptions` - Stripe subscription tracking
8. ✅ `usage_events` - Metered billing events

### New Tables (3):
9. ✅ `work_orders` - Production data
10. ✅ `csv_mappings` - Field mapping records
11. ✅ `facility_baselines` - Baseline metrics

---

## Row Level Security (RLS)

All tables include `org_id` for multi-tenant isolation.

**RLS Policies to Enable in Supabase**:
```sql
-- Work Orders
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own org work orders" ON work_orders
  FOR ALL USING (org_id = current_setting('app.current_org_id', true));

-- CSV Mappings
ALTER TABLE csv_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own org csv mappings" ON csv_mappings
  FOR ALL USING (org_id = current_setting('app.current_org_id', true));

-- Facility Baselines
ALTER TABLE facility_baselines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own org facility baselines" ON facility_baselines
  FOR ALL USING (org_id = current_setting('app.current_org_id', true));
```

---

## Triggers

**Updated `updated_at` triggers added for**:
- `work_orders`
- `facility_baselines`

Both tables now automatically update their `updated_at` timestamp on any UPDATE operation.

---

## Next Steps

### ✅ Completed:
- Database schema complete with all 11 tables
- Proper indexes for query performance
- RLS policies documented for Supabase
- Triggers for automatic timestamp updates

### ⏭️ Next:
1. **Deploy to Supabase** - Run migration script
2. **Enable RLS policies** - Apply security policies in Supabase dashboard
3. **Seed test data** - Add sample records for development
4. **Test backend queries** - Verify analyzers can query new tables

---

## Testing the Schema

### Local PostgreSQL (Docker):
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run migration
docker exec -i plantintel-postgres psql -U postgres -d plantintel < scripts/init-db.sql

# Verify tables
docker exec -it plantintel-postgres psql -U postgres -d plantintel -c "\dt"

# Check table count (should be 11)
docker exec -it plantintel-postgres psql -U postgres -d plantintel -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

### Supabase (Production):
1. Go to Supabase Dashboard → SQL Editor
2. Paste contents of [scripts/init-db.sql](scripts/init-db.sql)
3. Run query
4. Navigate to Table Editor to verify 11 tables exist
5. Enable RLS policies on each table

---

## Impact

**Before**:
- Backend analyzers would crash when querying `work_orders`
- CSV upload service couldn't store mappings
- Cost analyzer couldn't fetch baseline metrics
- **Blocker Status**: 🚨 Critical - Application non-functional

**After**:
- Backend has complete schema to query
- CSV uploads can store mapping records
- Analyzers can fetch baseline metrics for comparison
- **Blocker Status**: ✅ Resolved - Ready for API integration

---

## Files Modified

- [scripts/init-db.sql](scripts/init-db.sql) - Added 3 tables, indexes, triggers, RLS policy documentation

---

**Schema Status**: ✅ Complete and ready for deployment
