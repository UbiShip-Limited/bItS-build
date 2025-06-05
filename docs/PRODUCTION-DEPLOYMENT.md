# Production Deployment Guide
*Bowen Island Tattoo Shop Backend*

## 🚦 Production Readiness Status

### ✅ **PRODUCTION READY**
- **✅ Testing**: Comprehensive integration tests with real business logic
- **✅ Security**: Authentication, authorization, input validation, audit logging
- **✅ Architecture**: Clean service layers, proper error handling, type safety
- **✅ Payment Integration**: Square API integration with proper error handling
- **✅ Database**: Prisma ORM with PostgreSQL, proper connection management
- **✅ Caching**: Rate limiting and caching implementation

### ⚠️ **DEPLOYMENT ENHANCEMENTS ADDED**
- **✅ Health Checks**: `/health` and `/health/detailed` endpoints
- **✅ Docker Configuration**: Multi-stage Dockerfile with health checks
- **✅ Environment Templates**: Production environment configuration
- **✅ Container Orchestration**: Docker Compose for production

---

## 🚀 Quick Production Deployment

### Prerequisites
- Docker & Docker Compose installed
- Production database (PostgreSQL)
- Square production API credentials
- Cloudinary account (optional but recommended)
- SSL certificates for HTTPS

### Step 1: Environment Configuration
```bash
# Copy production environment template
cp env.production.example .env.production

# Edit with your production values
nano .env.production
```

### Step 2: Deploy with Docker
```bash
# Build and start production stack
docker-compose -f docker-compose.production.yml up -d

# Check health status
curl http://localhost:3001/health
```

### Step 3: Database Setup
```bash
# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# (Optional) Seed production data
docker-compose exec backend npx prisma db seed
```

---

## 📋 Pre-Deployment Checklist

### 🔐 Security & Configuration
- [ ] All environment variables set in production
- [ ] SSL certificates configured and valid
- [ ] Database connections use SSL (`sslmode=require`)
- [ ] Square environment set to `production`
- [ ] Strong JWT and session secrets generated
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting configured appropriately

### 🗄️ Database & Storage
- [ ] Production database provisioned (PostgreSQL)
- [ ] Database backups configured
- [ ] Prisma migrations applied (`prisma migrate deploy`)
- [ ] Database connection pooling configured
- [ ] Cloudinary production account configured

### 🔌 External Services
- [ ] Square production API credentials configured
- [ ] Square webhook endpoints updated to production URLs
- [ ] Supabase production project configured
- [ ] Email service configured (if applicable)

### 📊 Monitoring & Observability
- [ ] Health check endpoints responding (`/health`, `/health/detailed`)
- [ ] Logging configured (structured logging recommended)
- [ ] Error monitoring setup (Sentry, LogRocket, etc.)
- [ ] Performance monitoring configured
- [ ] Backup and disaster recovery plan documented

### 🧪 Testing
- [ ] All integration tests passing
- [ ] End-to-end tests completed in staging
- [ ] Payment flow tested with real Square sandbox
- [ ] Load testing completed (if high traffic expected)

---

## 🛠️ Infrastructure Options

### Option 1: Cloud Platforms (Recommended)
**Frontend (Next.js)**: Deploy to Vercel or Netlify
**Backend (Fastify)**: Deploy to Railway, Render, or Fly.io
**Database**: Supabase, PlanetScale, or Neon

### Option 2: Traditional VPS
**Server**: DigitalOcean, Linode, or AWS EC2
**Setup**: Use Docker Compose configuration provided
**Database**: Managed PostgreSQL or self-hosted

### Option 3: Full Container Orchestration
**Platform**: AWS ECS, Google Cloud Run, or Kubernetes
**Configuration**: Adapt Docker configurations provided

---

## 🔍 Health Monitoring

### Health Check Endpoints
```bash
# Basic health check
GET /health
# Returns: { status: "healthy", timestamp: "...", uptime: 123.45 }

# Detailed health check
GET /health/detailed  
# Returns: { status: "healthy", checks: { database: {...}, square: {...} } }
```

### Key Metrics to Monitor
- **Response Time**: API endpoint response times
- **Error Rate**: 4xx/5xx error percentages
- **Database Performance**: Query times and connection pool usage
- **Payment Success Rate**: Square payment processing success
- **Memory Usage**: Application memory consumption
- **Uptime**: Service availability

---

## 🚨 Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check database connectivity
docker-compose exec backend npx prisma db pull

# Verify environment variables
docker-compose exec backend env | grep DATABASE_URL
```

**Square Payment Issues**
```bash
# Verify Square configuration
curl http://localhost:3001/health/detailed

# Check Square webhook logs
docker-compose logs backend | grep webhook
```

**Performance Issues**
```bash
# Check resource usage
docker stats

# Review application logs
docker-compose logs backend --tail=100
```

---

## 🔄 Maintenance & Updates

### Regular Tasks
- **Daily**: Monitor health checks and error rates
- **Weekly**: Review application logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and test backup/disaster recovery procedures

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and deploy
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build

# Run any new migrations
docker-compose exec backend npx prisma migrate deploy
```

---

## 🆘 Support & Escalation

### Emergency Contacts
- **Developer**: [Your contact information]
- **Database**: [Database provider support]
- **Payment Issues**: Square Developer Support

### Critical Issue Response
1. **Check health endpoints** first
2. **Review recent logs** for error patterns
3. **Verify external service status** (Square, Supabase, Cloudinary)
4. **Escalate to appropriate support** channels

---

## 📚 Additional Resources
- [Square Developer Documentation](https://developer.squareup.com/docs)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)
- [Fastify Deployment Guide](https://www.fastify.io/docs/latest/Guides/Deployment/)
- [Testing Migration Plan](./lib/services/__tests__/TESTING_MIGRATION_PLAN.md) 