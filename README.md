# Penny's Bakery Management System (Traegger)

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![Status](https://img.shields.io/badge/status-Phase_17_Complete-success.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A professional, full-stack ERP and management solution tailored for artisanal bakeries. Designed for high reliability, local-first performance with cloud redundancy, and streamlined production workflows.

---

## 🚀 Key Features

### 🛠️ Administrative & Security (Phase 14)
- **Advanced User Management**: Role-based access control (Admin, Editor, Staff), session versioning (force logout), and secure password resets.
- **System Audit Trail**: Detailed, field-level change history for all primary entities (Orders, Customers, Menu).
- **Redundancy & Backups**: One-click JSON database exports and restoration tools.
- **Recovery Bin**: Soft-delete protection with the ability to restore accidentally deleted orders.

### 🥧 Production & Kitchen (Phase 16 & 17)
- **Intelligent Production Decomposition**: Automatically "explodes" complex combo items (like Gift Boxes) into their individual baking components (e.g., 2 marzipan eggs, 1 chocolate bunny) for precise prep tracking.
- **Aggregated Production Views**: Automated batching of menu items across all active orders for efficient morning prep.
- **Kitchen Tracker**: Real-time batch progression tracking (Queued -> Prepping -> Baking -> Cooling -> Ready).
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
- **Framework**: FastAPI (Python 3.11+)
- **Database**: SQLite (Local) with SQLAlchemy (Asynchronous)
- **Migrations**: Alembic
- **Cloud Interface**: Firebase Admin SDK
- **Security**: JWT Authentication + Password Hashing (bcrypt)

### Frontend
- **Framework**: React 19 (Vite 6)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Charting**: Recharts
- **Communication**: Axios with secure interceptors

---

## 📂 Project Structure

```text
traegger/
├── backend/            # Python FastAPI Service
├── frontend/           # React Frontend Application
├── docker-compose.yml  # Container Orchestration
├── SPEC.md             # Core Project Specification
└── walkthrough.md      # Detailed Phase-by-Phase Progress
```

---

## 🛠️ Project Setup & Run Instructions

### 🐳 Option 1: Docker (Recommended)
The easiest way to run the whole stack is using Docker Compose.

```bash
# Clone the repository and navigate into it
cd traegger

# Build and start all containers
docker compose up -d --build

# Backend will be at http://localhost:8000
# Frontend will be at http://localhost:80
```

### 🐍 Option 2: Manual Development

#### 1. Backend Server
```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Apply the latest database schemas
alembic upgrade head

# Start the API on http://localhost:8000
uvicorn main:app --reload
```

#### 2. Frontend Application
```bash
cd frontend
pnpm install

# Start the Vite development server
pnpm dev
# App will be accessible at http://localhost:5173
```

---

## 🌐 Deployment

Designed for deployment on local Ubuntu home servers using Docker or natively:
- **Nginx/Caddy**: As a reverse proxy.
- **Systemd**: For process persistence.
- **PWA**: Installable on mobile devices for kitchen/counter staff.

*Refer to [deployment_guide.md](deployment_guide.md) for full server instructions.*
