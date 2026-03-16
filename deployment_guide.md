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
We will use Caddy as the entrance to the app. I will provide the `Caddyfile` in the next step.
