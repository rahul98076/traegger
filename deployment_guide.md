# Deployment Guide: Traegger (Pure Docker + Tailscale)

This guide outlines the modern "Pure Docker" deployment path for Penny's Bakery. This setup is optimized for reliability and easy access via either your Local Network (LAN) or **Tailscale**.

---

## 🚀 1. Prerequisites (On Ubuntu)

Ensure your server is ready:
1.  **Tailscale Installed**: If not already, run `curl -fsSL https://tailscale.com/install.sh | sh`.
2.  **Docker & Docker Compose**: 
    - Install Docker: `sudo apt update && sudo apt install docker.io -y`
    - Install Compose: `sudo apt install docker-compose-v2 -y` (or `docker-compose`)
    - Add your user to the docker group: `sudo usermod -aG docker $USER` (Then log out and back in).

---

## 🧹 2. Cleanup (Stop Old Services)

If you were previously running the app manually, stop the old processes to free up ports **80** and **8000**:

```bash
# Stop the old backend service
sudo systemctl stop pennys-backend
sudo systemctl disable pennys-backend

# Stop the old Caddy server
sudo systemctl stop caddy
sudo systemctl disable caddy
```

---

## 🛠️ 3. Deployment Steps

### Step A: Pull the Latest Code
```bash
cd ~/traegger
git pull
```

### Step B: Launch with Docker Compose
```bash
# Start everything in the background
docker compose up -d --build
```
*Note: This will automatically build your frontend, start the backend, and set up a persistent volume for your database.*

---

## 🌐 4. How to Access

Since `pennys.home` is not used in this setup, use your IPs:

### Via Tailscale (Remote/Mobile)
1. Find your server's Tailscale IP: `tailscale ip -4`
2. Open in browser: `http://<tailscale-ip>/`

### Via Local Network (At Home)
1. Find your server's LAN IP: `hostname -I | awk '{print $1}'`
2. Open in browser: `http://<lan-ip>/`

---

## 📦 5. Maintenance & Logs

- **Check logs**: `docker compose logs -f`
- **Restart everything**: `docker compose restart`
- **Stop everything**: `docker compose down`
- **Update the app**: `git pull && docker compose up -d --build`

---

## ☁️ 6. Data Recovery

If you need to restore your database from Firebase:
1. Access the dashboard via your IP.
2. Go to **Admin Settings > Backup & Restore**.
3. Use the **"Restore from Cloud"** button.