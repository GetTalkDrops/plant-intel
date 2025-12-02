# Plant Intel Setup Guide

Complete setup instructions for the Plant Intel manufacturing analytics platform.

## Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.11+ (for local backend development)
- Supabase account
- Clerk account
- OpenAI or Anthropic API key
- Stripe account

---

## Quick Start (Docker)

### 1. Clone and Navigate to Project

```bash
cd ~/plantintel
```

### 2. Set Up Environment Variables

#### Backend Environment

```bash
# Copy the example file
cp backend/.env.example backend/.env

# Edit backend/.env with your actual values
```

Required environment variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key
- `CLERK_SECRET_KEY` - Your Clerk secret key
- `JWT_SECRET_KEY` - Generate a random 32+ character string
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` - AI service API key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `ENCRYPTION_KEY` - Generate a random 32-character string for AES-256

#### Frontend Environment

```bash
# Copy the example file
cp frontend/.env.local.example frontend/.env.local

# Edit frontend/.env.local with your actual values
```

Required environment variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- `CLERK_SECRET_KEY` - Your Clerk secret key
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

### 3. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the schema from `scripts/init-db.sql`
4. Enable Row Level Security (RLS) on all tables
5. Create RLS policies as documented in the SQL file

### 4. Configure Clerk

1. Go to your Clerk dashboard
2. Add custom JWT claims for `org_id` and `role`:
   - Go to Sessions → Customize session token
   - Add claims:
     ```json
     {
       "org_id": "{{user.public_metadata.org_id}}",
       "role": "{{user.public_metadata.role}}"
     }
     ```
3. Update allowed origins to include:
   - `http://localhost:3000`
   - `http://localhost:3001`

### 5. Start Services with Docker

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d
```

Services will be available at:
- Frontend: http://localhost:3001
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5433
- Redis: localhost:6379

### 6. Verify Setup

Check health endpoints:

```bash
# Frontend
curl http://localhost:3001

# Backend
curl http://localhost:8000/health
```

---

## Local Development (Without Docker)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## Project Structure

```
plantintel/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── analyzers/         # ML analyzers (cost, equipment, quality, efficiency)
│   │   ├── ai/                # AI/narrative generation
│   │   ├── analytics/         # Analytics engine (baseline, trends, correlations)
│   │   ├── handlers/          # Query routing, CSV upload
│   │   ├── middleware/        # Auth, audit logging
│   │   ├── orchestrators/     # Auto-analysis orchestration
│   │   ├── routers/           # API endpoints
│   │   ├── services/          # Business logic services
│   │   ├── utils/             # Utility functions
│   │   └── main.py           # FastAPI app entry point
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                   # Next.js frontend
│   ├── app/                   # App router pages
│   ├── components/            # React components
│   ├── lib/                   # Utilities, types, API clients
│   ├── Dockerfile
│   └── .env.local.example
│
├── scripts/
│   └── init-db.sql           # Database schema
│
├── docker-compose.yml         # Docker orchestration
├── SETUP.md                   # This file
├── BACKEND_INTEGRATION_PLAN.md
└── ENTERPRISE_INTEGRATION_PLAN.md
```

---

## Database Schema

### Core Tables

1. **audit_logs** - Immutable audit trail for compliance
2. **mapping_profiles** - Reusable CSV mapping templates
3. **analyses** - Analysis results and insights
4. **chat_messages** - AI chat history
5. **customers** - Customer/organization records (admin)
6. **analyzer_configs** - 39 analyzer configuration variables
7. **subscriptions** - Stripe subscription data
8. **usage_events** - Usage metering for billing

### Multi-Tenant Security

All tables include `org_id` for tenant isolation. Row Level Security (RLS) policies enforce data access:

```sql
ALTER TABLE mapping_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org profiles" ON mapping_profiles
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true));
```

---

## API Endpoints

### Authentication

All endpoints (except `/health`) require JWT authentication via Clerk.

Include token in requests:
```bash
Authorization: Bearer <jwt_token>
```

### Core Endpoints

#### Upload
- `POST /api/v1/upload/csv` - Upload CSV with mapping
- `POST /api/v1/upload/csv/analyze` - Analyze CSV without uploading

#### Analysis
- `POST /api/v1/analyze/auto` - Run auto-analysis
- `GET /api/v1/analyze/results/{id}` - Get analysis results
- `GET /api/v1/analyze/list` - List analyses

#### Mappings
- `POST /api/v1/mappings` - Create mapping profile
- `GET /api/v1/mappings` - List mapping profiles
- `GET /api/v1/mappings/{id}` - Get mapping profile
- `PUT /api/v1/mappings/{id}` - Update mapping profile
- `DELETE /api/v1/mappings/{id}` - Delete mapping profile

#### Chat
- `POST /api/v1/chat` - Send chat message
- `GET /api/v1/chat/history/{analysis_id}` - Get chat history

---

## Analyzer Configuration

### 39 Variables (8 User-Facing, 31 Admin-Only)

#### User Variables (Exposed in UI)
1. Labor rate per hour
2. Scrap cost per unit
3. Variance threshold percentage
4. Minimum variance amount
5. Pattern minimum orders
6. Equipment failure threshold
7. Quality risk threshold
8. Efficiency baseline days

#### Admin Variables (Admin Portal Only)
- 15 cost analyzer variables
- 10 operations analyzer variables
- 8 equipment predictor variables
- 6 efficiency analyzer variables

Configuration presets:
- Conservative
- Balanced
- Aggressive

---

## Testing

### Backend Tests

```bash
cd backend
pytest tests/
```

### Frontend Tests

```bash
cd frontend
npm test
```

---

## Deployment

### Production Checklist

1. **Environment Variables**
   - Set all production keys in `.env` files
   - Use strong, random values for JWT_SECRET_KEY and ENCRYPTION_KEY
   - Enable HTTPS for all endpoints

2. **Database**
   - Apply all RLS policies in Supabase
   - Set up automated backups
   - Configure connection pooling

3. **Clerk**
   - Update allowed origins to production URLs
   - Configure custom JWT claims
   - Set up webhook endpoints for user lifecycle events

4. **Stripe**
   - Configure webhook endpoints
   - Test subscription flows
   - Set up metering and billing

5. **Monitoring**
   - Set up log aggregation (Datadog, CloudWatch, etc.)
   - Configure alerts for errors and performance
   - Enable audit log monitoring

### Deployment Platforms

#### Frontend (Next.js)
- **Vercel** (Recommended)
  - Connect GitHub repo
  - Set environment variables
  - Deploy automatically on push

#### Backend (FastAPI + Celery)
- **Railway** or **Render** (Recommended)
  - Deploy API service
  - Deploy Celery worker service
  - Connect Redis and PostgreSQL

#### Database & Cache
- **Supabase** - PostgreSQL with RLS
- **Upstash** or **Railway** - Redis

---

## Troubleshooting

### Docker Issues

**Services won't start:**
```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose up --build
```

**Port conflicts:**
```bash
# Check what's using ports
lsof -i :3001  # Frontend
lsof -i :8000  # Backend
lsof -i :5433  # PostgreSQL
lsof -i :6379  # Redis
```

### Database Issues

**Connection refused:**
- Verify `DATABASE_URL` in `.env`
- Check PostgreSQL is running: `docker-compose ps`
- Ensure schema is applied: `psql -f scripts/init-db.sql`

### Authentication Issues

**JWT validation fails:**
- Verify `CLERK_SECRET_KEY` matches Clerk dashboard
- Check JWT custom claims are configured
- Ensure `org_id` is set in user metadata

**RLS blocks queries:**
- Verify RLS policies are created in Supabase
- Check `org_id` is correctly set in JWT
- Use Supabase service key for admin operations

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review API docs: http://localhost:8000/docs
3. Check audit logs in Supabase for security issues

---

## License

Proprietary - Plant Intel
