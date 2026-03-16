# Deployment Guide: Traegger Bakery on Ubuntu Server

This guide outlines the steps to move your bakery management system from your Windows development machine to your Ubuntu home server.

## 1. Ubuntu Prerequisites
Ensure your server has the following installed:
- **SSH Access**: For remote management.
- **Python 3.10+**: `sudo apt update && sudo apt install python3 python3-pip python3-venv`
- **Node.js & pnpm**: Required for building/serving the frontend.
  - `curl -fsSL https://get.pnpm.io/install.sh | sh -`
- **Caddy**: Our modern web server and reverse proxy.
  - `sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https`
  - [Follow official Caddy installation steps](https://caddyserver.com/docs/install#debian-ubuntu-raspbian)

## 2. Project Transfer
1. **Compress & Copy**:
   - On Windows, zip the `traegger` folder (exclude `node_modules` and `.venv`).
   - Copy to Ubuntu using SCP or SFTP: `scp traegger.zip user@server-ip:/home/user/`
2. **Unzip on Server**:
   - `unzip traegger.zip -d ~/traegger`

## 3. Backend Setup
1. **Create Virtual Environment**:
   - `cd ~/traegger/backend`
   - `python3 -m venv .venv`
   - `source .venv/bin/activate`
2. **Install Dependencies**:
   - `pip install -r requirements.txt`
3. **Configure Environment**:
   - Update `.env` with the server's specific details if needed (especially `CORS_ORIGINS`).

## 4. Frontend Setup
1. **Install Dependencies**:
   - `cd ~/traegger/frontend`
   - `pnpm install`
2. **Build for Production**:
   - `pnpm build`
   - *Note: We will serve the static `dist` folder.*

## 5. Systemd Service (Backend)
Create a service to keep the backend running:
`sudo nano /etc/systemd/system/pennys-backend.service`

```ini
[Unit]
Description=Penny's Bakery Backend
After=network.target

[Service]
User=your_username
WorkingDirectory=/home/your_username/traegger/backend
ExecStart=/home/your_username/traegger/backend/.venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
`sudo systemctl enable pennys-backend && sudo systemctl start pennys-backend`

## 6. Local Domain (pennys.home)
To access the app via `pennys.home`:
1. **Router DNS**: If your router supports it, map `pennys.home` to the server's local Static IP.
2. **Hosts File**: Alternatively, add `192.168.x.x pennys.home` to the `hosts` file on every computer that needs access.

## 7. Caddy Configuration
Edit the Caddyfile located at `/etc/caddy/Caddyfile`:
`sudo nano /etc/caddy/Caddyfile`

```caddy
pennys.home:80 {
    # Serve built frontend files
    root * /home/your_username/traegger/frontend/dist
    file_server

    # Handle React Router (SPA fallback)
    try_files {path} /index.html

    # Proxy API requests to backend
    reverse_proxy /api/* 127.0.0.1:8000
    
    # Optional: Force HTTPS internally if dealing with sensitive internal certs
}
```

Restart Caddy:
`sudo systemctl reload caddy`

Enable Caddy on boot:
`sudo systemctl enable caddy`


## 8. Data Safety & Cloud Recovery
Penny's Bakery relies on a robust Firebase Cloud Firestore mirroring system.

### Local-to-Cloud Mirroring
Whenever an Order, Customer, or Menu Item is created or modified locally, the backend securely pushes the data (including granular line-items inside Orders) to the cloud Firebase instance.

### System Boots & Systemd
The backend should always be set up to start on boot: `sudo systemctl enable pennys-backend`. 

### Cloud Restorations (Corrupted Local Database)
If your `bakery.db` file becomes corrupted, or if you migrate a fresh Linux server and want to pull your historical data down:
1. Ensure the new backend has the `traegger-c0901-firebase-adminsdk...json` key file configured.
2. In the live Admin Dashboard, navigate to **Settings / Backup & Recovery**.
3. Use the **Cloud to Local: Restore** action.
4. The system will safely truncate your local empty/corrupted database tables and reconstruct all Orders, Menu Items, and Customers directly from your Firestore records, seamlessly.