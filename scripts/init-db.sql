-- ============================================================================
-- Plant Intel Database Schema
-- Multi-tenant manufacturing analytics platform
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Audit Logs Table (Immutable)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action TEXT NOT NULL,
    user_id TEXT NOT NULL,
    org_id TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    trace_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_trace_id ON audit_logs(trace_id);

-- ============================================================================
-- Mapping Profiles Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS mapping_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    erp_system TEXT,
    mappings JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Indexes for mapping profiles
CREATE INDEX IF NOT EXISTS idx_mapping_profiles_org_id ON mapping_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_mapping_profiles_user_id ON mapping_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_mapping_profiles_name ON mapping_profiles(name);

-- ============================================================================
-- Analyses Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    batch_id TEXT NOT NULL,
    data_tier TEXT NOT NULL,
    analyzers_run TEXT[] NOT NULL,
    insights JSONB NOT NULL,
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for analyses
CREATE INDEX IF NOT EXISTS idx_analyses_org_id ON analyses(org_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_batch_id ON analyses(batch_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);

-- ============================================================================
-- Chat Messages Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for chat messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_org_id ON chat_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_analysis_id ON chat_messages(analysis_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- ============================================================================
-- Customers Table (Admin)
-- ============================================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    address TEXT,
    plan TEXT NOT NULL DEFAULT 'pilot',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'trial')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_org_id ON customers(org_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- ============================================================================
-- Analyzer Configs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS analyzer_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    preset TEXT CHECK (preset IN ('conservative', 'balanced', 'aggressive')),
    config JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for analyzer configs
CREATE INDEX IF NOT EXISTS idx_analyzer_configs_org_id ON analyzer_configs(org_id);

-- ============================================================================
-- Subscriptions Table (Stripe Integration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    plan TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- ============================================================================
-- Usage Events Table (Metering)
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for usage events
CREATE INDEX IF NOT EXISTS idx_usage_events_org_id ON usage_events(org_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at DESC);

-- ============================================================================
-- Work Orders Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    batch_id TEXT NOT NULL,
    work_order_number TEXT NOT NULL,
    product_name TEXT,
    product_code TEXT,
    quantity_planned DECIMAL,
    quantity_produced DECIMAL,
    quantity_scrapped DECIMAL DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT,
    machine_id TEXT,
    operator_id TEXT,
    labor_hours DECIMAL,
    material_cost DECIMAL,
    labor_cost DECIMAL,
    overhead_cost DECIMAL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for work orders
CREATE INDEX IF NOT EXISTS idx_work_orders_org_id ON work_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_batch_id ON work_orders(batch_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_work_order_number ON work_orders(work_order_number);
CREATE INDEX IF NOT EXISTS idx_work_orders_product_code ON work_orders(product_code);
CREATE INDEX IF NOT EXISTS idx_work_orders_machine_id ON work_orders(machine_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_start_date ON work_orders(start_date DESC);

-- ============================================================================
-- CSV Mappings Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS csv_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    profile_id UUID REFERENCES mapping_profiles(id) ON DELETE CASCADE,
    batch_id TEXT NOT NULL,
    source_column TEXT NOT NULL,
    target_variable TEXT NOT NULL,
    transformation TEXT,
    confidence DECIMAL,
    validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for csv mappings
CREATE INDEX IF NOT EXISTS idx_csv_mappings_org_id ON csv_mappings(org_id);
CREATE INDEX IF NOT EXISTS idx_csv_mappings_profile_id ON csv_mappings(profile_id);
CREATE INDEX IF NOT EXISTS idx_csv_mappings_batch_id ON csv_mappings(batch_id);
CREATE INDEX IF NOT EXISTS idx_csv_mappings_target_variable ON csv_mappings(target_variable);

-- ============================================================================
-- Facility Baselines Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS facility_baselines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_category TEXT NOT NULL CHECK (metric_category IN ('cost', 'quality', 'efficiency', 'equipment')),
    baseline_value DECIMAL NOT NULL,
    unit TEXT,
    sample_size INTEGER,
    confidence_level DECIMAL,
    calculation_method TEXT,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, metric_name, metric_category)
);

-- Indexes for facility baselines
CREATE INDEX IF NOT EXISTS idx_facility_baselines_org_id ON facility_baselines(org_id);
CREATE INDEX IF NOT EXISTS idx_facility_baselines_metric_category ON facility_baselines(metric_category);
CREATE INDEX IF NOT EXISTS idx_facility_baselines_metric_name ON facility_baselines(metric_name);
CREATE INDEX IF NOT EXISTS idx_facility_baselines_valid_from ON facility_baselines(valid_from DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- NOTE: These will be applied in Supabase, not in local Postgres
-- ============================================================================

-- IMPORTANT: In Supabase, enable RLS on all tables and create policies:
--
-- ALTER TABLE mapping_profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own org profiles" ON mapping_profiles
--   FOR SELECT USING (org_id = current_setting('app.current_org_id', true));
--
-- Repeat for: analyses, chat_messages, customers, analyzer_configs,
--            subscriptions, usage_events, work_orders, csv_mappings,
--            facility_baselines
--
-- audit_logs is read-only for admins only
--
-- Example RLS policies for new tables:
--
-- ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can access own org work orders" ON work_orders
--   FOR ALL USING (org_id = current_setting('app.current_org_id', true));
--
-- ALTER TABLE csv_mappings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can access own org csv mappings" ON csv_mappings
--   FOR ALL USING (org_id = current_setting('app.current_org_id', true));
--
-- ALTER TABLE facility_baselines ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can access own org facility baselines" ON facility_baselines
--   FOR ALL USING (org_id = current_setting('app.current_org_id', true));

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at
CREATE TRIGGER update_mapping_profiles_updated_at BEFORE UPDATE ON mapping_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyzer_configs_updated_at BEFORE UPDATE ON analyzer_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facility_baselines_updated_at BEFORE UPDATE ON facility_baselines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
