# Deployment Guide for Render.com

This guide provides comprehensive instructions for deploying both the backend and frontend services on Render.com.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Quick Start (Blueprint)](#quick-start-blueprint)
4. [Manual Deployment](#manual-deployment)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Connecting Frontend to Backend](#connecting-frontend-to-backend)
8. [Database Migrations](#database-migrations)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)
11. [Cost Estimation](#cost-estimation)

---

## Prerequisites

1. **GitHub Account** with your repository pushed
2. **Render.com Account** (sign up at https://render.com)
3. Repository connected to Render
4. Basic understanding of environment variables

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         RENDER.COM                              │
│                                                                 │
│  ┌──────────────────┐          ┌──────────────────────────┐    │
│  │   Frontend       │  HTTPS   │      Backend             │    │
│  │   (Next.js)      │ ───────► │      (FastAPI)           │    │
│  │                  │          │                          │    │
│  │ project1-e00p.   │          │ finance-backend-l2g4.    │    │
│  │ onrender.com     │          │ onrender.com             │    │
│  └──────────────────┘          └─────────────┬────────────┘    │
│                                              │                  │
│                                              ▼                  │
│                                ┌──────────────────────────┐    │
│                                │    PostgreSQL Database   │    │
│                                │    (Managed by Render)   │    │
│                                └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start (Blueprint)

### Using render.yaml (Recommended)

1. **Push your code to GitHub** (ensure `render.yaml` is in the root directory)

2. **Go to Render Dashboard** → New → Blueprint

3. **Connect your repository** - Render will automatically detect the `render.yaml` file

4. **Configure Environment Variables** in the Render dashboard (see [Environment Variables Reference](#environment-variables-reference))

5. **Deploy** - Render will automatically create all services

---

## Manual Deployment

### Step 1: Create PostgreSQL Database

1. Go to **Render Dashboard** → **New** → **PostgreSQL**
2. Configure:
   - **Name**: `finance-db`
   - **Database**: `finance_db`
   - **User**: `finance_user`
   - **Plan**: Starter (or your preferred plan)
3. Note the **Internal Database URL** (you'll need this)

### Step 2: Create Redis Instance (Optional)

1. Go to **Render Dashboard** → **New** → **Redis**
2. Configure:
   - **Name**: `finance-redis`
   - **Plan**: Starter
3. Note the **Internal Redis URL**

### Step 3: Deploy Backend Service

1. Go to **Render Dashboard** → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `finance-backend` |
| **Root Directory** | `backend` |
| **Environment** | `Docker` |
| **Dockerfile Path** | `Dockerfile` |
| **Docker Context** | `backend` |
| **Plan** | Starter (or preferred) |

4. Add **Environment Variables** (see [Backend Environment Variables](#backend-environment-variables))

5. **Health Check Path**: `/health`

6. Click **Create Web Service**

### Step 4: Deploy Frontend Service

1. Go to **Render Dashboard** → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `finance-frontend` |
| **Root Directory** | `frontend` |
| **Environment** | `Docker` |
| **Dockerfile Path** | `Dockerfile` |
| **Docker Context** | `frontend` |
| **Plan** | Starter (or preferred) |

4. Add **Environment Variables** (see [Frontend Environment Variables](#frontend-environment-variables))

5. Click **Create Web Service**

---

## Environment Variables Reference

### Backend Environment Variables

| Variable | Required | Example Value | Description |
|----------|----------|---------------|-------------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host/db` | PostgreSQL connection string |
| `SECRET_KEY` | ✅ | `your-super-secret-key-here` | JWT signing key (use `openssl rand -hex 32`) |
| `ALGORITHM` | ✅ | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ | `30` | Token expiration time |
| `ALLOWED_ORIGINS` | ✅ | `https://project1-e00p.onrender.com` | Frontend URL(s), comma-separated |
| `ALLOWED_HOSTS` | ✅ | `finance-backend-l2g4.onrender.com,localhost` | Allowed host headers |
| `DEBUG` | ❌ | `false` | Debug mode (set to `false` in production) |
| `LOG_LEVEL` | ❌ | `INFO` | Logging level |
| `REDIS_URL` | ❌ | `redis://host:6379` | Redis connection string |
| `SMTP_HOST` | ❌ | `smtp.gmail.com` | SMTP server for emails |
| `SMTP_PORT` | ❌ | `587` | SMTP port |
| `SMTP_USER` | ❌ | `your-email@gmail.com` | SMTP username |
| `SMTP_PASSWORD` | ❌ | `your-app-password` | SMTP password |
| `AWS_ACCESS_KEY_ID` | ❌ | `AKIAIOSFODNN7EXAMPLE` | AWS access key (for S3 backups) |
| `AWS_SECRET_ACCESS_KEY` | ❌ | `wJalrXUtnFEMI/K7MDENG` | AWS secret key |
| `AWS_BUCKET_NAME` | ❌ | `my-backup-bucket` | S3 bucket name |
| `AWS_REGION` | ❌ | `us-east-1` | AWS region |

### Frontend Environment Variables

| Variable | Required | Example Value | Description |
|----------|----------|---------------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | `https://finance-backend-l2g4.onrender.com/api/v1` | Backend API URL |
| `NODE_ENV` | ❌ | `production` | Node environment |

---

## Connecting Frontend to Backend

> [!IMPORTANT]
> This is the most critical step. If not configured correctly, login and all API calls will fail.

### Step 1: Get Your Service URLs

After deploying both services, note down:
- **Frontend URL**: e.g., `https://project1-e00p.onrender.com`
- **Backend URL**: e.g., `https://finance-backend-l2g4.onrender.com`

### Step 2: Configure Backend (CORS & Hosts)

Go to **Backend Service** → **Environment** → Add/Update:

```
ALLOWED_ORIGINS=https://project1-e00p.onrender.com,http://localhost:3000,http://localhost:3001
ALLOWED_HOSTS=finance-backend-l2g4.onrender.com,localhost,127.0.0.1
```

> [!WARNING]
> Do NOT include `https://` in `ALLOWED_HOSTS`. Only the domain name is needed.

### Step 3: Configure Frontend (API URL)

Go to **Frontend Service** → **Environment** → Add:

```
NEXT_PUBLIC_API_URL=https://finance-backend-l2g4.onrender.com/api/v1
```

> [!CAUTION]
> Make sure to include `/api/v1` at the end of the URL.

### Step 4: Redeploy Both Services

After updating environment variables:
1. Go to each service → **Manual Deploy** → **Deploy latest commit**
2. Wait for both services to finish deploying
3. Test the connection by logging in

---

## Database Migrations

### Automatic Migrations

The backend includes **self-healing migrations** that automatically add missing columns on startup. This ensures new columns (like `profile_image_url`) are created even if Alembic migrations weren't run.

### Manual Migrations (If Needed)

1. Go to your backend service in Render
2. Open the **Shell/Console**
3. Run:

```bash
cd /app
alembic upgrade head
```

---

## Post-Deployment Configuration

### 1. Verify Deployment

| Endpoint | Expected Result |
|----------|-----------------|
| `https://[backend-url]/docs` | Swagger API documentation |
| `https://[backend-url]/health` | Health check response |
| `https://[frontend-url]` | Login page |

### 2. Default Admin Credentials

The system creates a default admin on first startup:
- **Email**: `admin@expense.com`
- **Password**: Check your backend logs or set via `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars

### 3. Custom Domains

To add a custom domain:
1. Go to your service settings
2. Click **Custom Domains**
3. Add your domain and follow DNS configuration instructions
4. Update `ALLOWED_ORIGINS` and `ALLOWED_HOSTS` to include the new domain

---

## Troubleshooting

### Common Issues

#### 1. "CORS policy: Permission was denied" Error

**Cause**: Frontend trying to reach `localhost:8000` instead of the deployed backend.

**Solution**: Ensure `NEXT_PUBLIC_API_URL` is set correctly on the frontend service and redeploy.

#### 2. "400 Bad Request" on Backend

**Cause**: `ALLOWED_HOSTS` doesn't include the backend domain.

**Solution**: Add your backend domain to `ALLOWED_HOSTS`:
```
ALLOWED_HOSTS=finance-backend-l2g4.onrender.com,localhost,127.0.0.1
```

#### 3. "UndefinedColumn" Database Error

**Cause**: Database schema is out of sync with the code.

**Solution**: The self-healing migration should handle this automatically. If not, run:
```bash
# In Render Shell
alembic upgrade head
```

#### 4. Login Returns 403 Forbidden

**Cause**: IP restrictions blocking access.

**Solution**: 
1. Check IP Management settings in the admin panel
2. Ensure no global IP blocks are active
3. Verify `ALLOWED_ORIGINS` includes your frontend URL

#### 5. Slow First Request (Cold Start)

**Cause**: Render free tier spins down services after 15 minutes of inactivity.

**Solution**: Upgrade to a paid plan or use a service like UptimeRobot to ping your services periodically.

### Checking Logs

1. Go to **Render Dashboard** → Your Service → **Logs**
2. Look for error messages
3. Common log patterns:
   - `Self-healing: Adding...` = Database migration in progress
   - `Default admin already exists` = Startup successful
   - `CORS: Allowing origins: [...]` = Check if your frontend URL is listed

---

## Security Best Practices

1. **Generate Strong SECRET_KEY**:
   ```bash
   openssl rand -hex 32
   ```

2. **Set DEBUG=false** in production

3. **Use Environment Variables** for all secrets (never commit `.env` files)

4. **Enable HTTPS** - Render provides free SSL certificates

5. **Regular Updates** - Keep dependencies updated

6. **IP Restrictions** - Use the IP Management feature for additional security

---

## Cost Estimation

### Free Tier Limitations

- Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- PostgreSQL free tier expires after 90 days

### Paid Plans

| Service | Free | Starter | Standard |
|---------|------|---------|----------|
| Web Service | $0/mo (spins down) | $7/mo | $25/mo |
| PostgreSQL | 90 days free | $7/mo | $20/mo |
| Redis | Limited | $10/mo | $30/mo |

**Recommended for Production**: Starter plan ($14-21/month total)

---

## Support

- **Render Documentation**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Render Status**: https://status.render.com

---

## Quick Reference

### Your Current Deployment

| Service | URL |
|---------|-----|
| Frontend | `https://project1-e00p.onrender.com` |
| Backend | `https://finance-backend-l2g4.onrender.com` |
| API Docs | `https://finance-backend-l2g4.onrender.com/docs` |

### Required Environment Variables Checklist

**Backend**:
- [ ] `DATABASE_URL`
- [ ] `SECRET_KEY`
- [ ] `ALGORITHM=HS256`
- [ ] `ALLOWED_ORIGINS=https://project1-e00p.onrender.com`
- [ ] `ALLOWED_HOSTS=finance-backend-l2g4.onrender.com,localhost,127.0.0.1`

**Frontend**:
- [ ] `NEXT_PUBLIC_API_URL=https://finance-backend-l2g4.onrender.com/api/v1`
