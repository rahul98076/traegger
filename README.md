# Traegger 🥐
### A Streamlined Bakery Management & ERP System

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
![Status](https://img.shields.io/badge/Production-Ready-success.svg)
![Deployment](https://img.shields.io/badge/Deployment-Docker-blue.svg)

Traegger is a full-stack management solution designed specifically for artisanal bakeries. It focuses on the transition from **customer orders** to **kitchen production**, ensuring that nothing is missed in the early morning rush.

---

## ✨ Core Features

### 👨‍🍳 Production & Kitchen
- **Smart Decomposition**: Complex combo items (like Gift Boxes) are automatically "exploded" into their constituent components (marzipan eggs, buns, etc.) for accurate baking totals.
- **Live Progress Tracking**: Monitor batch stages in real-time: `Queued` → `Prepping` → `Baking` → `Cooling` → `Ready`.
- **High-Contrast Dashboard**: Specifically designed for kitchen screens to provide clear, actionable "Grand Totals" for the day's bake.

### 🛡️ Data & Security
- **Automated Redundancy**: Twice-daily automated backups of the SQLite database to local storage, a remote Windows PC, and Google Drive.
- **Role-Based Access**: Secure administrative controls and audit trails for all order changes.
- **Local-First Reliability**: Runs entirely on your local network (or via Tailscale) to ensure the bakery stays operational even if the internet goes down.

---

## 💻 Tech Stack

- **Backend**: FastAPI (Python 3.11+) with Asynchronous SQLite (SQLAlchemy)
- **Frontend**: React 19 (Vite 6) + Tailwind CSS & shadcn/ui
- **Infrastructure**: Pure Docker Compose deployment

---

## 🚀 Getting Started

The system is designed for zero-config deployment on a home or bakery server.

### 🐳 Quick Start (Docker)
```bash
# Clone and enter the project
git clone https://github.com/rahul98076/traegger.git
cd traegger

# Build and launch
docker compose up -d --build
```
---

## 🛠️ Documentation

- **[User Manual](USER_MANUAL.md)**: Detailed guide on managing orders and production.
- **[Deployment Guide](deployment_guide.md)**: Server setup and migration instructions.
- **[System Spec](SPEC.md)**: Technical architecture and internal logic.

---
*Built for artisanal excellence.*
