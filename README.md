# Penny's Bakery Management System (Traegger)

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
![Status](https://img.shields.io/badge/status-Phase_18_Complete-success.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A professional, full-stack ERP and management solution tailored for artisanal bakeries. Designed for high reliability, local-first performance with cloud redundancy, and streamlined production workflows.

---

## 🚀 Key Features

### 🥧 Production & Kitchen (Phase 16-18)
- **Intelligent Production Decomposition**: Automatically "explodes" complex combo items (like Gift Boxes) into their individual baking components for precise prep tracking.
- **Pure Docker Deployment**: Zero-config setup for home servers using Docker Compose.
- **Tailscale & Remote Access**: Optimized for access via **Tailscale** or local LAN IPs, bypassing the need for complex DNS configurations.
- **Kitchen Tracker**: Real-time batch progression tracking (Queued -> Prepping -> Baking -> Cooling -> Ready).

### 🛠️ Administrative & Security
- **Advanced User Management**: Role-based access control, session versioning, and secure password resets.
- **System Audit Trail**: Field-level change history for all primary entities.
- **Redundancy & Backups**: One-click JSON database exports and Firebase Cloud Mirroring.

---

## 💻 Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: SQLite (Local) with SQLAlchemy (Asynchronous)
- **Cloud Interface**: Firebase Admin SDK

### Frontend
- **Framework**: React 19 (Vite 6)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand

---

## 🛠️ Project Setup & Run Instructions

### 🐳 Option 1: Docker (Recommended for Deployment)
The easiest way to run the whole stack is using Docker Compose. This is optimized for **Tailscale** and **LAN IP** access.

```bash
# Clone the repository and navigate into it
cd traegger

# Build and start all containers
docker compose up -d --build

# App will be accessible at http://<your-server-ip>/
```

### 🐍 Option 2: Manual Development
*Refer to the [Walkthrough](walkthrough.md) for detailed manual development steps.*

---

## 🌐 Deployment & Remote Access

Designed for private access via **Tailscale**:
- **Tailscale**: Access your bakery dashboard from anywhere securely using your Tailscale IP.
- **Local IP**: Access on your home Wi-Fi via your server's local IP address.
- **Pure Docker**: Managed entirely via `docker-compose`, removing the need for host-level web servers (Caddy/Nginx) or manual process managers (Systemd).

*Refer to [deployment_guide.md](deployment_guide.md) for full server migration instructions.*
