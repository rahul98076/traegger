# Traegger Deployment & Maintenance Guide

This guide covers the deployment, access, and maintenance of the Traegger system on your local or remote server.

---

## 1. Prerequisites
- **Docker & Docker Compose** installed on the host.
- **Tailscale** (optional, recommended for secure remote access).

---

## 2. Deployment Steps

### Step A: Pull the Latest Code
```bash
cd ~/traegger
git pull
```

### Step B: Launch with Docker Compose
```bash
docker compose up -d --build
```
*This will build the frontend, start the backend, and initialize the persistent SQLite database volume.*

---

## 3. How to Access

Access the system using the server's IP address:

### Via Tailscale (Remote/Mobile)
1. Find your server's Tailscale IP: `tailscale ip -4`
2. Open in browser: `http://<tailscale-ip>/`

### Via Local Network (At Home)
1. Find your server's LAN IP: `hostname -I | awk '{print $1}'`
2. Open in browser: `http://<lan-ip>/`

---

## 4. Maintenance & Logs

- **Check logs**: `docker compose logs -f`
- **Restart services**: `docker compose restart`
- **Stop services**: `docker compose down`
- **Update the app**: `git pull && docker compose up -d --build`

---

## 5. Data Recovery

If you need to restore your database from the cloud:
1. Access the dashboard via your IP.
2. Navigate to **Admin Settings > Data**.
3. Use the **"Restore from Cloud"** feature.