
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