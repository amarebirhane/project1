# Financial Management System

Full-stack financial management platform with a FastAPI backend and a Next.js (App Router) frontend. Includes budgeting/forecasting, revenue & expense tracking, approvals, analytics, and RBAC.

## Repository Layout

- `backend/` — FastAPI application (REST API, RBAC, FP&A services)
- `frontend/` — Next.js 16 + React 19 UI
- `DEPLOYMENT.md` — deployment notes
- `RENDER_QUICKSTART.md`, `render.yaml` — Render deployment scaffolding

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- PostgreSQL 15+ (required for backend)
- Redis 7+ (optional, caching)
- Docker & Docker Compose (optional)

## Quick Start (local, two terminals)

1) **Backend**
- `cd backend`
- `cp .env.example .env` and set database/secret values
- Create/upgrade DB: `alembic upgrade head` (or run the SQLAlchemy create_all snippet in the backend README)
- Install deps: `python -m venv venv && source venv/bin/activate` (Windows: `venv\Scripts\activate`) then `pip install -r requirements.txt`
- Run API: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

2) **Frontend**
- In another terminal: `cd frontend`
- Install deps: `npm install`
- Create `.env.local` (set your API URL, e.g. `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` if applicable)
- Run dev server: `npm run dev` (defaults to http://localhost:3000)

## Backend Details (FastAPI)

Key capabilities: revenue/expense CRUD with approvals, budgeting & forecasting (FP&A), analytics, role hierarchy (Super Admin → Admin → Finance Manager → Accountant → Employee), JWT auth, 2FA/IP restriction, reporting, notifications, audit logging, contact form with email support, inventory management, sales tracking, and comprehensive role-based access control (RBAC) across all endpoints.

Common commands:
- Run app: `uvicorn app.main:app --reload --port 8000`
- Migrations: `alembic revision --autogenerate -m "msg"` then `alembic upgrade head`
- Tests: `pytest` (see `backend/README.md` for more)

## Frontend Details (Next.js)

Stack: Next.js 16, React 19, TypeScript, styled-components, TanStack Query, React Hook Form, Zod, lucide-react, Sonner, Zustand, Recharts.

Key features:
- **Role-Based Access Control (RBAC)**: Strict access control across all pages and components
  - Admin/Super Admin: Full access to all data
  - Finance Admin: Access to own data + subordinates (accountants and employees only)
  - Accountant: Access to own data + employees' sales (from their Finance Admin's team)
  - Employee: Access to own data + items created by Finance Admin
- **Contact Form**: Integrated contact form with email notifications
- **Search**: Global search across users, revenue, expenses, projects, and departments with RBAC filtering
- **Notifications**: Real-time notifications with role-based filtering
- **Dashboard**: Comprehensive dashboard with role-specific data views
- **Scenarios & Budgeting**: Advanced FP&A tools for financial planning and forecasting
  - **Budget Dashboard**: Centralized view of all budgets with status tracking (Draft, Approved, Active, Archived) and real-time financial health summaries (Revenue vs. Expenses vs. Profit).
  - **Budget Creation**: Comprehensive wizard for metadata capture (name, period, department, project) and itemized planning.
  - **Granular Planning**: Dynamic itemized budgeting system allowing per-item revenue and expense tracking with categorical breakdowns.
  - **Scenario Analysis**: Comparison tools and detailed item management (add/edit/list) within specific budget scenarios.

Common commands:
- Dev: `npm run dev`
- Build: `npm run build`
- Start (prod): `npm run start`
- Lint: `npm run lint`
- Unit tests: `npm test`
- E2E (Playwright): `npm run test:e2e`

## Docker Compose

From `backend/` (contains `docker-compose.yml`):
- Start services: `docker-compose up -d`
- Apply migrations: `docker-compose exec backend alembic upgrade head`
- Tail logs: `docker-compose logs -f backend`

## Environment Variables

### Backend (.env)
Required:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - Email configuration (for contact form and notifications)
- `SMTP_FROM_EMAIL` - Support email address (optional, defaults to SMTP_USER)

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `http://localhost:8000/api/v1`)
- `NEXT_PUBLIC_CONTACT_ENDPOINT` - Contact form endpoint override (optional, default: `/contact`)

## Troubleshooting

- **CORS/auth issues:** ensure frontend `.env.local` points to the running backend and backend `ALLOWED_ORIGINS` includes the frontend URL.
- **DB errors:** confirm `DATABASE_URL` in `backend/.env` and that PostgreSQL is running.
- **Port collisions:** change ports or stop conflicting processes (API: 8000, frontend: 3000).
- **Email/Contact form not working:** verify SMTP settings in `backend/.env` are correct and SMTP server is accessible.
- **Font warnings:** The app uses system fonts by default. Google Fonts warnings can be safely ignored.

## API Endpoints

Key endpoints:
- **Authentication**: `/api/v1/auth/*` - Login, registration, password reset
- **Users**: `/api/v1/users/*` - User management with RBAC
- **Revenue/Expenses**: `/api/v1/revenue/*`, `/api/v1/expenses/*` - Financial entries with approvals
- **Budgeting**: `/api/v1/budgeting/*` - Budgets, scenarios, forecasts
- **Dashboard**: `/api/v1/dashboard/*` - Overview and recent activity
- **Notifications**: `/api/v1/notifications/*` - Real-time notifications with RBAC
- **Contact**: `/api/v1/contact` - Contact form submission (public endpoint)
- **Search**: Frontend-only search with backend API filtering

All endpoints enforce role-based access control. See `backend/app/api/v1/` for detailed endpoint documentation.

## Useful Links

- Backend docs: http://localhost:8000/docs (when API is running)
- Backend guide: `backend/README.md`
- FastAPI docs: https://fastapi.tiangolo.com/
- Next.js docs: https://nextjs.org/docs


