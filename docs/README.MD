# Financial Management System

A comprehensive, enterprise-grade financial management platform featuring a FastAPI backend, a Next.js frontend, and a React Native mobile application. The system provides robust tools for budgeting, forecasting, revenue/expense tracking, and advanced financial analytics with role-based access control (RBAC).

## 📂 Repository Layout

- `backend/` — FastAPI application (REST API, RBAC, FP&A services, AI/ML models)
- `frontend/` — Next.js 16 + React 19 web interface
- `mobile/` — Expo (React Native) cross-platform mobile application
- `docs/` — System architecture, Quality Assessment, and feature documentation
- `DEPLOYMENT.md` — Detailed production deployment notes
- `RENDER_QUICKSTART.md`, `render.yaml` — Render.com deployment scaffolding

## 🛠 Prerequisites

- **Node.js**: 20+ and npm
- **Python**: 3.11+
- **PostgreSQL**: 15+ (required for backend data persistence)
- **Redis**: 7+ (required for caching and background tasks)
- **Docker & Docker Compose**: (optional, for containerized development)

## 🚀 Quick Start (Local Development)

To get the full system running locally, follow these steps in separate terminals:

### 1. Backend (FastAPI)
```bash
cd backend
cp .env.example .env  # Configure your DATABASE_URL and SECRET_KEY
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head      # Initialize database schema
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
# Ensure .env.local points to http://localhost:8000/api/v1
npm run dev
```

### 3. Mobile (Expo)
```bash
cd mobile
npm install
npx expo start
```

---

## 🧠 AI/ML Forecasting
The system features advanced predictive analytics powered by industry-standard machine learning libraries:
- **Prophet**: Used for business forecasting with strong seasonality and holiday effects.
- **XGBoost & LightGBM**: Handles complex non-linear patterns and multi-feature relationships.
- **ARIMA/SARIMA**: Traditional statistical models for time-series trend analysis.
- **Ensemble Methods**: Combines multiple models to provide the most robust financial outlook.

> For a deep dive into our AI implementation, see [ML Forecasting Guide](backend/docs/ML_FORECASTING.md).

## 📱 Mobile App (React Native / Expo)
The mobile application provides "on-the-go" financial management:
- **Biometric Auth**: Secure access with FaceID/TouchID.
- **Receipt Capture**: Integrated camera support for quick expense entry (OCR-ready).
- **Mobile Approvals**: Managers can review and approve entries directly from their phones.
- **Offline Mode**: View critical financial data even without an active connection.

## 🔐 Security & RBAC
The system implements a multi-layered security architecture:
- **JWT Authentication**: Secure, stateless token-based authentication.
- **Two-Factor Auth (2FA)**: TOTP-based security for sensitive roles.
- **Role Hierarchy**: 
  - `Super Admin` -> Full system control & audit access
  - `Admin` -> User management & departmental oversight
  - `Finance Manager` -> Team approvals & budget planning
  - `Accountant` -> Data entry, sales tracking & reporting
  - `Employee` -> Personal expense & revenue submission

---

## � Future Enhancements
- **Real-time Notifications**: WebSocket/SSE integration for instant dashboard updates.
- **Bank Integration**: Direct synchronization with real-world banking providers (Plaid/Yodlee).
- **Multi-Currency Support**: Automated FX conversion for global financial tracking.
- **Enhanced Anomaly Detection**: AI-driven fraud and error detection in expense reports.

## �🐳 Docker Compose
From the root or `backend/` directory:
- **Start Services**: `docker-compose up -d`
- **Apply Migrations**: `docker-compose exec backend alembic upgrade head`
- **Monitor Logs**: `docker-compose logs -f backend`

## 🔗 Useful Links
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)
- **Architecture Presentation**: [docs/PRESENTATION_DECK.html](docs/PRESENTATION_DECK.html)
- **Quality Assessment**: [docs/report.md](docs/report.md)
- **Backend README**: [backend/README.md](backend/README.md)
- **Frontend README**: [frontend/README.md](frontend/README.md)
- **Mobile README**: [mobile/README.md](mobile/README.md)
- **Architecture Docs**: [docs/system.md](docs/system.md)
- **FastAPI Docs**: [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)
- **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)
