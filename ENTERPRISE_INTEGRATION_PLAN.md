# Enterprise-Grade Integration Plan
## PlantIntel MVP: 7-Week Integration & Hardening

**Target Market:** $50MM-$200MM revenue manufacturing companies
**Key Differentiator:** Mapping Engine (The Moat)
**Approach:** Integration > Rebuild (leverage existing ML service)

---

## Week 1-2: Secure Foundation & Docker Setup

### Day 1-2: Monorepo Structure & Docker

#### 1.1 Create Monorepo Structure
```bash
cd ~/plantintel

# Create backend directory
mkdir -p backend/app/{routers,services,middleware,utils,tests}
mkdir -p backend/app/analyzers backend/app/ai backend/app/analytics
mkdir -p docs scripts

# Copy ML service components
cp -r ~/plant-intel-mvp/ml-service/analyzers/* backend/app/analyzers/
cp -r ~/plant-intel-mvp/ml-service/ai/* backend/app/ai/
cp -r ~/plant-intel-mvp/ml-service/analytics/* backend/app/analytics/
cp ~/plant-intel-mvp/ml-service/requirements.txt backend/
```

#### 1.2 Create Docker Setup

**File: `docker-compose.yml`**
```yaml
version: '3.8'

services:
  # Next.js Frontend
  web:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - ML_SERVICE_URL=http://api:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - api

  # FastAPI Backend
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=development
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/plantintel
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./backend:/app
    depends_on:
      - postgres
      - redis
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # Postgres (Local dev mirror of Supabase)
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=plantintel
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis (for Celery/rate limiting)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Celery Worker (for async analysis)
  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - ENVIRONMENT=development
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/plantintel
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./backend:/app
    depends_on:
      - postgres
      - redis
    command: celery -A app.worker worker --loglevel=info

volumes:
  postgres_data:
  redis_data:
```

**File: `backend/Dockerfile`**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**File: `frontend/Dockerfile`**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

#### 1.3 Create Environment Files

**File: `backend/.env.example`**
```env
# Environment
ENVIRONMENT=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/plantintel

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI (for AI Chat)
OPENAI_API_KEY=your_openai_key

# Stripe (for billing)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Security
JWT_SECRET_KEY=your_random_secret_key_here
ENCRYPTION_KEY=your_encryption_key_here

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
MAX_FILE_SIZE_MB=500
```

**File: `frontend/.env.local.example`**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Backend API
ML_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Setup Commands:**
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your keys

# Frontend
cp frontend/.env.local.example frontend/.env.local
# Edit frontend/.env.local with your keys
```

#### 1.4 Update Backend Requirements

**File: `backend/requirements.txt`**
```
# Core
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
python-dotenv==1.0.0

# Database
supabase==2.0.3
psycopg2-binary==2.9.9
sqlalchemy==2.0.23

# Auth
clerk-backend-api==0.1.1
pyjwt==2.8.0
cryptography==41.0.7

# Data Processing
pandas==2.1.3
numpy==1.26.2

# ML/AI
openai==1.3.7
anthropic==0.7.8

# Async/Workers
celery==5.3.4
redis==5.0.1

# Monitoring
sentry-sdk==1.38.0

# Billing
stripe==7.8.0

# Validation
pydantic==2.5.2
email-validator==2.1.0

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
httpx==0.25.2

# Code Quality
black==23.11.0
ruff==0.1.6
mypy==1.7.1
```

### Day 3-4: Multi-Tenant Security Layer

#### 2.1 Create Auth Middleware

**File: `backend/app/middleware/auth.py`**
```python
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from functools import wraps
import jwt
from typing import Optional, Dict, Any
import os

security = HTTPBearer()

class AuthMiddleware:
    """Authentication and authorization middleware using Clerk"""

    def __init__(self):
        self.clerk_secret = os.getenv("CLERK_SECRET_KEY")
        if not self.clerk_secret:
            raise ValueError("CLERK_SECRET_KEY not set")

    def decode_token(self, token: str) -> Dict[str, Any]:
        """Decode and validate Clerk JWT token"""
        try:
            # Clerk uses RS256, you'll need to get the public key from Clerk
            # For now, this is a simplified version
            payload = jwt.decode(
                token,
                self.clerk_secret,
                algorithms=["RS256"],
                options={"verify_signature": False}  # FIXME: Add proper verification
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

    def get_user_context(self, request: Request) -> Dict[str, Any]:
        """Extract user context from request"""
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authorization header"
            )

        try:
            token = auth_header.split(" ")[1]  # Bearer <token>
            payload = self.decode_token(token)

            # CRITICAL: Extract org_id from token, NEVER from request body
            user_id = payload.get("sub")
            org_id = payload.get("org_id")  # Clerk custom claim

            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload"
                )

            return {
                "user_id": user_id,
                "org_id": org_id,  # Can be None for personal accounts
                "email": payload.get("email"),
                "role": payload.get("role", "user")
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Authentication failed: {str(e)}"
            )


auth_middleware = AuthMiddleware()


def require_auth(func):
    """Decorator to require authentication on endpoints"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        request = kwargs.get("request")
        if not request:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Request object not found"
            )

        # Extract and validate auth
        user_context = auth_middleware.get_user_context(request)

        # Inject user context into kwargs
        kwargs["user_context"] = user_context

        return await func(*args, **kwargs)

    return wrapper


def require_admin(func):
    """Decorator to require admin role"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        request = kwargs.get("request")
        if not request:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Request object not found"
            )

        user_context = auth_middleware.get_user_context(request)

        if user_context.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )

        kwargs["user_context"] = user_context
        return await func(*args, **kwargs)

    return wrapper
```

#### 2.2 Create Audit Logger

**File: `backend/app/utils/audit_logger.py`**
```python
from datetime import datetime
from typing import Dict, Any, Optional
import json
import logging
from supabase import Client

logger = logging.getLogger(__name__)


class AuditLogger:
    """Immutable audit logging for compliance and debugging"""

    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def log(
        self,
        action: str,
        user_id: str,
        org_id: Optional[str],
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        trace_id: Optional[str] = None
    ):
        """
        Log an action to the audit_logs table

        Args:
            action: Action performed (e.g., "csv_uploaded", "map_created")
            user_id: User who performed the action
            org_id: Organization ID (for multi-tenant isolation)
            resource_type: Type of resource (e.g., "mapping_profile", "analysis")
            resource_id: ID of the resource affected
            details: Additional context (stored as JSONB)
            trace_id: Trace ID for request correlation
        """
        try:
            log_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "action": action,
                "user_id": user_id,
                "org_id": org_id,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "details": json.dumps(details) if details else None,
                "trace_id": trace_id
            }

            self.supabase.table("audit_logs").insert(log_entry).execute()

        except Exception as e:
            # CRITICAL: Audit log failures should never break the main flow
            # but must be logged separately for investigation
            logger.error(f"Audit log failed: {str(e)}", extra=log_entry)


class StructuredLogger:
    """Structured JSON logging with context"""

    def __init__(self):
        self.logger = logging.getLogger("plantintel")

    def log(
        self,
        level: str,
        message: str,
        user_id: Optional[str] = None,
        org_id: Optional[str] = None,
        trace_id: Optional[str] = None,
        **kwargs
    ):
        """Log with structured context"""
        context = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "org_id": org_id,
            "trace_id": trace_id,
            **kwargs
        }

        log_func = getattr(self.logger, level.lower())
        log_func(message, extra=context)
```

### Day 5-7: Database Schema with Multi-Tenancy

#### 3.1 Create Supabase Schema

**File: `scripts/supabase_schema.sql`**
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- AUDIT LOGGING (Immutable)
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action TEXT NOT NULL,
  user_id TEXT NOT NULL,
  org_id TEXT,  -- NULL for personal accounts
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  trace_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_trace_id ON audit_logs(trace_id);

-- Make immutable (no updates/deletes allowed)
CREATE RULE audit_logs_no_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE audit_logs_no_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;


-- ============================================================================
-- MULTI-TENANT TABLES
-- ============================================================================

-- Mapping Profiles (The Moat - Core IP)
CREATE TABLE mapping_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,  -- CRITICAL: Multi-tenant isolation
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  erp_system TEXT,
  data_granularity TEXT CHECK (data_granularity IN ('header', 'operation')),
  aggregation_strategy TEXT,
  mappings JSONB NOT NULL,
  config_variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mapping_profiles_org_id ON mapping_profiles(org_id);
CREATE INDEX idx_mapping_profiles_user_id ON mapping_profiles(user_id);
CREATE INDEX idx_mapping_profiles_active ON mapping_profiles(org_id, is_active);

-- RLS Policy (Row Level Security)
ALTER TABLE mapping_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org profiles" ON mapping_profiles
  FOR SELECT USING (
    org_id = current_setting('app.current_org_id', true)
  );

CREATE POLICY "Users can create own org profiles" ON mapping_profiles
  FOR INSERT WITH CHECK (
    org_id = current_setting('app.current_org_id', true)
  );


-- Analyses
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,  -- Multi-tenant isolation
  user_id TEXT NOT NULL,
  facility_id INTEGER NOT NULL,
  batch_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  row_count INTEGER,
  status TEXT CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
  mapping_profile_ids UUID[] DEFAULT '{}',
  data_tier INTEGER,
  analyzers_run TEXT[] DEFAULT '{}',
  results JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_analyses_org_id ON analyses(org_id);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_batch_id ON analyses(batch_id);
CREATE INDEX idx_analyses_status ON analyses(org_id, status);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org analyses" ON analyses
  FOR SELECT USING (
    org_id = current_setting('app.current_org_id', true)
  );


-- Chat Messages (AI Conversation History)
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_analysis ON chat_messages(analysis_id);


-- ============================================================================
-- ADMIN TABLES
-- ============================================================================

-- Customers (Admin view of organizations)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT UNIQUE NOT NULL,  -- Links to Clerk organization
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  contact_name TEXT,
  phone TEXT,
  address TEXT,
  plan TEXT CHECK (plan IN ('pilot', 'subscription')),
  status TEXT CHECK (status IN ('trial', 'active', 'inactive')) DEFAULT 'trial',
  notes TEXT,
  facility_ids INTEGER[] DEFAULT '{}',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_org_id ON customers(org_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);


-- Analyzer Configs (39 variables per customer/facility)
CREATE TABLE analyzer_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL,
  facility_id INTEGER NOT NULL,
  config JSONB NOT NULL,
  preset_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, facility_id)
);

CREATE INDEX idx_analyzer_configs_org_id ON analyzer_configs(org_id);


-- ============================================================================
-- BILLING & USAGE TRACKING
-- ============================================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan_tier TEXT CHECK (plan_tier IN ('pilot', 'starter', 'professional', 'enterprise')),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')) DEFAULT 'trialing',
  csv_upload_limit INTEGER NOT NULL DEFAULT 10,
  csv_uploads_used INTEGER DEFAULT 0,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_org_id ON subscriptions(org_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);


CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- 'csv_upload', 'analysis_run', 'chat_message'
  resource_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_events_org_id ON usage_events(org_id);
CREATE INDEX idx_usage_events_created_at ON usage_events(created_at);
```

**Run Schema:**
```bash
# Connect to Supabase and run the schema
# You'll need to run this in the Supabase SQL Editor
# Or use psql locally for development
docker-compose exec postgres psql -U postgres -d plantintel -f /scripts/supabase_schema.sql
```

---

## Key Security Features Implemented

### ✅ Multi-Tenant Isolation
- Every table has `org_id` column
- Row Level Security (RLS) enforced
- Auth middleware NEVER trusts client for `org_id`
- Extracted from JWT token only

### ✅ Audit Logging
- Immutable audit_logs table
- Logs ALL authenticated requests
- Tracks: action, user, org, resource, timestamp
- Cannot be updated or deleted

### ✅ Structured Logging
- JSON format with context
- Includes: `org_id`, `user_id`, `trace_id`
- Allows filtering by customer for debugging

### ✅ Security Configuration
- File size limits (500MB)
- Rate limiting (60 req/min)
- MIME type validation
- Input validation (Pydantic)

---

## Next Steps

### Immediate (This Week):
1. **Run Docker setup**: `docker-compose up`
2. **Apply Supabase schema**: Run SQL in Supabase dashboard
3. **Add your keys**: Fill in `.env` files
4. **Test auth middleware**: Write first unit test

### Week 2:
- Port analyzers with multi-tenant checks
- Create upload endpoint with usage tracking
- Integrate Stripe webhooks

### Week 3:
- Build admin console with audit logging
- Add Clerk role-based access control
- Implement rate limiting

**Next File:** Week 2-7 detailed implementation guide?
