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

## 🛠️ Quick Start

### Backend Setup
1. `cd backend`
2. `python -m venv .venv`
3. `source .venv/bin/activate` (or `.venv\Scripts\activate` on Windows)
4. `pip install -r requirements.txt`
5. Configure `.env` (refer to `.env.example` if available)
6. `uvicorn main:app --reload`

### Frontend Setup
1. `cd frontend`
2. `pnpm install`
3. `pnpm dev`

---

## 🌐 Deployment

Designed for deployment on local Ubuntu home servers using:
- **Caddy**: As a reverse proxy for `pennys.home`.
- **Systemd**: For backend service persistence.
- **PWA**: Installable on mobile devices for kitchen/counter staff.

*Refer to [deployment_guide.md](deployment_guide.md) for full Ubuntu server instructions.*
