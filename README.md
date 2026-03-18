# Penny's Bakery Management System (Traegger)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-Phase_14_Complete-success.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A professional, full-stack ERP and management solution tailored for artisanal bakeries. Designed for high reliability, local-first performance with cloud redundancy, and streamlined production workflows.

---

## 🚀 Key Features

### 🛠️ Administrative & Security (Phase 14)
- **Advanced User Management**: Role-based access control (Admin, Editor, Staff), session versioning (force logout), and secure password resets.
- **System Audit Trail**: Detailed, field-level change history for all primary entities (Orders, Customers, Menu).
- **Redundancy & Backups**: One-click JSON database exports and restoration tools.
- **Recovery Bin**: Soft-delete protection with the ability to restore accidentally deleted orders.

### 🥧 Production & Kitchen (Phase 9 & 10)
- **Aggregated Production Views**: Automated batching of menu items across all active orders for efficient prep.
- **Kitchen Tracker**: Real-time batch progression tracking (Prep -> Oven -> Packaging).
- **Resource Assignment**: Link specific kitchen batches to customer orders for full traceability.



### ☁️ Data Integrity (Phase 13)
- **Local-First Architecture**: Operates on a fast, local SQLite database for zero-latency operations during peak hours.
- **Real-time Cloud Mirror**: Background synchronization to **Firebase Cloud Firestore** for remote monitoring and off-site data safety.
- **Disaster Recovery**: One-click cloud-to-local database reconstruction from Firestore if the local service is corrupted or migrated.
- **Health Monitoring**: Real-time sync status indicators and manual override controls.
### 📊 Business Intelligence
- **Sales Analytics**: Dynamic charts for revenue trends, order status distribution, and bestselling product analysis.
- **Daily Operations Dashboard**: High-level metrics for daily revenue, pending collections, and pickup status.

---

## 💻 Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: SQLite (Local) with SQLAlchemy (Asynchronous)
- **Migrations**: Alembic
- **Cloud Interface**: Firebase Admin SDK
- **Security**: JWT Authentication + Password Hashing (bcrypt)

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI)
- **State Management**: Zustand
- **Charting**: Recharts
- **Communication**: Axios with secure interceptors

---

## 📂 Project Structure

```text
traegger/
├── backend/            # Python FastAPI Service
│   ├── models/         # SQLAlchemy Database Models
│   ├── routers/        # API Endpoint Definitions
│   ├── services/       # Business Logic (Sync, Auth, Audit)
│   └── migrations/     # Alembic DB Version Control
├── frontend/           # React Frontend Application
│   ├── src/api/        # Axios API Client Functions
│   ├── src/components/ # Reusable UI Components
│   └── src/pages/      # Feature-specific Page Containers
└── SPEC.md             # Core Project Specification & Phased Plan
```

---

## 🛠️ Project Setup & Run Instructions

### 1. Backend Server
The backend is a FastAPI application running on an asynchronous SQLite database.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Apply the latest database schemas
alembic upgrade head

# Seed default data (e.g. admin account) - Run only once!
python seed_data.py

# Start the API on http://localhost:8000
uvicorn main:app --reload
```

### 2. Frontend Application
The frontend is a Vite + React project.

```bash
cd frontend
pnpm install

# Start the Vite development server
pnpm dev
# App will be accessible at http://localhost:5173
```

---

## 🌐 Deployment

Designed for deployment on local Ubuntu home servers using:
- **Caddy**: As a reverse proxy for `pennys.home`.
- **Systemd**: For backend service persistence.
- **PWA**: Installable on mobile devices for kitchen/counter staff.

*Refer to [deployment_guide.md](deployment_guide.md) for full Ubuntu server instructions.*
