# Plant Intel Deployment Guide

Complete guide for deploying Plant Intel to production environments.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Production Deployment](#production-deployment)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Monitoring & Logging](#monitoring--logging)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services
- **Supabase** - Database & authentication
- **Clerk** - User authentication
- **Anthropic API** - AI chat functionality
- **Stripe** - Payment processing (optional for MVP)
- **Docker & Docker Compose** - Container orchestration

### Required Tools
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20+
- Python 3.11+
- Git

---

## Environment Setup

### 1. Create Production Environment File

Copy the template:
```bash
cp .env.production.template .env.production
```

### 2. Configure Environment Variables

Edit `.env.production` with your production values:

#### **Critical Security Keys**
```bash
# Generate these with: openssl rand -hex 32
JWT_SECRET_KEY=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here
```

#### **Supabase Configuration**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key
```

#### **Clerk Authentication**
```bash
CLERK_SECRET_KEY=sk_live_your-secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your-key
```

#### **AI Services**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key
```

#### **Stripe Payments** (Optional)
```bash
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

---

## Local Development

### Start Development Environment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Access Services
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6379

---

## Production Deployment

### Option 1: Docker Compose (Simple Deployment)

#### 1. Build Production Images
```bash
docker-compose -f docker-compose.prod.yml build
```

#### 2. Start Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### 3. Verify Health
```bash
curl http://localhost:8000/api/v1/health
curl http://localhost:3000/api/health
```

### Option 2: Container Platforms

#### **Fly.io**
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy backend
cd backend
fly launch
fly deploy

# Deploy frontend
cd frontend
fly launch
fly deploy
```

#### **Railway**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

#### **Render**
1. Connect GitHub repository
2. Create Web Service for backend (port 8000)
3. Create Web Service for frontend (port 3000)
4. Set environment variables in dashboard

#### **AWS ECS/Fargate**
```bash
# Build and push images to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker build -t plantintel-api:latest ./backend
docker tag plantintel-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/plantintel-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/plantintel-api:latest

# Create ECS task definition and service (see AWS documentation)
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

The project includes a complete CI/CD pipeline at `.github/workflows/ci-cd.yml`:

**On every push/PR:**
- ✅ Run backend tests with coverage
- ✅ Build and type-check frontend
- ✅ Lint code (Python & JavaScript)
- ✅ Build Docker images

**On main branch push:**
- ✅ Deploy to production (configure your provider)

### Required GitHub Secrets

Add these secrets in GitHub Settings > Secrets and variables > Actions:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Deployment Providers

Uncomment and configure the deployment step in `.github/workflows/ci-cd.yml` for your provider:
- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Fly.io
- Railway
- Render

---

## Monitoring & Logging

### Health Checks

The API provides comprehensive health endpoints:

```bash
# Basic health check
GET /api/v1/health

# Detailed health with dependencies
GET /api/v1/health/detailed

# Kubernetes liveness probe
GET /api/v1/health/liveness

# Kubernetes readiness probe
GET /api/v1/health/readiness
```

### Structured Logging

All logs are structured JSON for easy parsing:

```json
{
  "timestamp": "2025-12-04T12:00:00Z",
  "level": "INFO",
  "message": "Request completed",
  "duration_ms": 45.2,
  "path": "/api/v1/analysis",
  "method": "POST",
  "status_code": 200,
  "trace_id": "abc-123-def"
}
```

### Performance Monitoring

- **Request Duration**: Tracked automatically
- **Slow Queries**: Logged when > 1s
- **Rate Limiting**: Headers included in responses
- **Error Tracking**: Automatic with trace IDs

### Integration with Monitoring Tools

#### **Sentry** (Error Tracking)
```bash
export SENTRY_DSN=https://your-sentry-dsn
```

#### **Datadog** (APM)
```bash
export DATADOG_API_KEY=your-datadog-key
```

---

## Troubleshooting

### Common Issues

#### **Container Won't Start**
```bash
# Check logs
docker-compose logs api
docker-compose logs web

# Verify environment variables
docker-compose config

# Restart services
docker-compose restart
```

#### **Database Connection Errors**
```bash
# Verify Supabase credentials
curl -H "apikey: YOUR_ANON_KEY" https://your-project.supabase.co/rest/v1/

# Check network connectivity
docker-compose exec api ping your-project.supabase.co
```

#### **TypeScript Build Errors**
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run build
```

#### **Rate Limiting Issues**
```bash
# Check current rate limit
curl -I http://localhost:8000/api/v1/health

# Adjust rate limit (in .env)
RATE_LIMIT_PER_MINUTE=120
```

### Performance Tuning

#### **Backend Optimization**
```python
# Adjust worker concurrency in docker-compose.prod.yml
command: celery -A app.worker worker --concurrency=8
```

#### **Frontend Optimization**
```javascript
// Enable Next.js optimizations in next.config.js
experimental: {
  optimizePackageImports: true,
  turbo: true
}
```

#### **Redis Optimization**
```bash
# Adjust memory settings in docker-compose.prod.yml
command: redis-server --maxmemory 1gb --maxmemory-policy allkeys-lru
```

---

## Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env.production` to git
- ✅ Use strong random keys (32+ characters)
- ✅ Rotate secrets regularly
- ✅ Use secret management tools (AWS Secrets Manager, Vault)

### 2. Network Security
- ✅ Enable HTTPS in production (use Let's Encrypt)
- ✅ Configure CORS with specific origins
- ✅ Enable rate limiting
- ✅ Use firewall rules to restrict access

### 3. Authentication
- ✅ Clerk handles auth - don't roll your own
- ✅ Validate JWT tokens on every request
- ✅ Enforce multi-tenancy with org_id

### 4. Data Protection
- ✅ Supabase RLS policies enforce data isolation
- ✅ Encrypt sensitive data at rest
- ✅ Use HTTPS for all API calls
- ✅ Regular backups (Supabase handles this)

---

## Database Migrations

### Supabase Migrations

Supabase provides a web UI for schema changes. For production:

1. Test migrations in staging environment first
2. Use Supabase migration tools:
   ```bash
   supabase db diff -f new_migration
   supabase db push
   ```

3. Always create backups before migrations:
   ```bash
   # Backup is automatic with Supabase Point-in-Time Recovery
   ```

---

## Scaling Considerations

### Horizontal Scaling
```yaml
# docker-compose.prod.yml
services:
  api:
    deploy:
      replicas: 3  # Run 3 instances
```

### Load Balancing
- Use nginx or cloud provider load balancer
- Example nginx configuration provided in repository

### Caching Strategy
- Redis for session data
- API response caching (coming soon)
- CDN for static assets (Next.js automatic)

---

## Support & Resources

- **Documentation**: `/docs` directory
- **API Docs**: `http://your-domain.com/docs`
- **Health Dashboard**: `http://your-domain.com/api/v1/health`
- **GitHub Issues**: Report bugs and feature requests

---

## Deployment Checklist

Before going to production:

- [ ] Environment variables configured
- [ ] Security keys generated and stored safely
- [ ] Database backups enabled
- [ ] Monitoring and logging configured
- [ ] Health checks passing
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured
- [ ] CORS origins set correctly
- [ ] CI/CD pipeline tested
- [ ] Rollback plan documented
- [ ] Team trained on deployment process

---

**Version**: 1.0.0
**Last Updated**: December 4, 2025
**Status**: Production Ready
