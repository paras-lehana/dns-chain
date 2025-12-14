# NeuraDNS — Setup & Usage Instructions

Complete guide to setting up, running, and deploying NeuraDNS.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Local Development](#local-development)
4. [Production Deployment](#production-deployment)
5. [Testing the API](#testing-the-api)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| [Node.js](https://nodejs.org/) | >= 18.x | API server runtime |
| [Python](https://python.org/) | >= 3.8 | UI server runtime |
| [npm](https://npmjs.com/) | >= 9.x | Node.js package manager |
| [pip](https://pip.pypa.io/) | >= 21.x | Python package manager |

### Optional Software

| Software | Version | Purpose |
|----------|---------|---------|
| [Solana CLI](https://docs.solana.com/cli) | >= 1.17 | Blockchain interaction |
| [PM2](https://pm2.keymetrics.io/) | >= 5.x | Production process manager |

### Verify Installation

```bash
# Check Node.js
node --version
# Expected: v18.x.x or higher

# Check Python
python --version
# Expected: Python 3.8.x or higher

# Check npm
npm --version
# Expected: 9.x.x or higher
```

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/neuradns.git
cd neuradns
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
cd blockchain_dns_register
npm install

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Start the Servers

**Terminal 1 — API Server:**
```bash
cd blockchain_dns_register
npx ts-node production-api.ts
```

**Terminal 2 — UI Server:**
```bash
cd blockchain_dns_register
python app.py
```

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:8765
```

---

## Local Development

### Directory Structure

```
blockchain_dns_register/
├── production-api.ts    # Node.js API server (port 3007)
├── app.py               # Flask UI server (port 8765)
├── index.html           # Frontend UI
├── package.json         # Node.js dependencies
├── requirements.txt     # Python dependencies
├── wallet.json          # Solana wallet (DO NOT COMMIT)
└── tsconfig.json        # TypeScript configuration
```

### Environment Variables

Create a `.env` file in `blockchain_dns_register/`:

```env
# Server Configuration
PORT=3007

# AI Validation Webhook (n8n)
N8N_WEBHOOK_URL=https://n8n.backend.lehana.in/webhook/validate_domain

# Environment
NODE_ENV=development
```

### Running in Development Mode

```bash
# API with auto-reload (requires nodemon)
npm install -g nodemon
nodemon --exec npx ts-node production-api.ts

# UI with debug mode
python app.py
# Flask runs with debug=False by default for security
```

### Testing Changes

1. Make code changes
2. API server auto-reloads (if using nodemon)
3. Refresh browser to see UI changes
4. Test endpoints using curl or the web interface

---

## Production Deployment

### Option 1: PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Navigate to project directory
cd blockchain_dns_register

# Start API server
pm2 start "npx ts-node production-api.ts" --name neuradns-api

# Start UI server
pm2 start "python app.py" --name neuradns-ui

# Save PM2 configuration
pm2 save

# Enable startup on boot
pm2 startup
```

### Option 2: Systemd Services

**API Service (`/etc/systemd/system/neuradns-api.service`):**
```ini
[Unit]
Description=NeuraDNS API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/blockchain_dns_register
ExecStart=/usr/bin/npx ts-node production-api.ts
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**UI Service (`/etc/systemd/system/neuradns-ui.service`):**
```ini
[Unit]
Description=NeuraDNS UI Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/blockchain_dns_register
ExecStart=/usr/bin/python3 app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and start services:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable neuradns-api neuradns-ui
sudo systemctl start neuradns-api neuradns-ui
```

### Firewall Configuration

```bash
# Allow UI port (public access)
sudo ufw allow 8765/tcp

# API port should remain internal only
# Do NOT expose port 3007 publicly
```

### Nginx Reverse Proxy (Optional)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8765;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Testing the API

### Health Check

```bash
# UI Server Health
curl http://localhost:8765/health

# API Server Health
curl http://localhost:8765/api/health
```

### Validate a Domain

```bash
curl -X POST http://localhost:8765/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mywebsite.blockchain",
    "ip": "8.8.8.8"
  }'
```

### Register a Domain

```bash
curl -X POST http://localhost:8765/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mywebsite.blockchain",
    "ip": "8.8.8.8"
  }'
```

### Resolve a Domain

```bash
curl "http://localhost:8765/api/resolve?domain=mywebsite.blockchain"
```

### Test AI Rejection

```bash
# Well-known domain (should reject)
curl -X POST http://localhost:8765/api/validate \
  -H "Content-Type: application/json" \
  -d '{"domain": "google.com", "ip": "8.8.8.8"}'

# Homograph attack (should reject)
curl -X POST http://localhost:8765/api/validate \
  -H "Content-Type: application/json" \
  -d '{"domain": "rnicrosoft.com", "ip": "1.2.3.4"}'

# Private IP (should reject)
curl -X POST http://localhost:8765/api/validate \
  -H "Content-Type: application/json" \
  -d '{"domain": "mysite.com", "ip": "192.168.1.1"}'
```

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" Error

```bash
# Solution: Reinstall dependencies
cd blockchain_dns_register
rm -rf node_modules
npm install
```

#### 2. "wallet.json not found"

```bash
# Solution: Create a Solana wallet
solana-keygen new --outfile wallet.json

# Or for devnet testing, use the existing wallet
# Make sure wallet.json exists in blockchain_dns_register/
```

#### 3. Port Already in Use

```bash
# Find process using port
lsof -i :8765
lsof -i :3007

# Kill the process
kill -9 <PID>
```

#### 4. AI Validation Timeout

The n8n webhook has a 10-second timeout. If AI validation fails:
- Check internet connectivity
- Verify webhook URL is correct
- The system falls back to basic validation if AI is unavailable

#### 5. Solana Transaction Failed

```bash
# Check wallet balance
solana balance --url devnet

# Airdrop devnet SOL if needed
solana airdrop 1 --url devnet
```

### Logs & Debugging

**View PM2 logs:**
```bash
pm2 logs neuradns-api
pm2 logs neuradns-ui
```

**View systemd logs:**
```bash
journalctl -u neuradns-api -f
journalctl -u neuradns-ui -f
```

### Support

- **Live Demo**: http://82.112.235.26:8765
- **Solana Explorer**: [View Program](https://explorer.solana.com/address/H7azh1pVd3uySy7z4JRmQL2HpF2D9673Y9RP4yXZWfFM?cluster=devnet)
- **GitHub Issues**: Report bugs and feature requests

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install Node.js dependencies |
| `pip install -r requirements.txt` | Install Python dependencies |
| `npx ts-node production-api.ts` | Start API server |
| `python app.py` | Start UI server |
| `pm2 start ...` | Start with PM2 |
| `pm2 logs` | View logs |
| `pm2 restart all` | Restart all services |
| `pm2 stop all` | Stop all services |

---

<div align="center">

**NeuraDNS — AI-Powered Decentralized DNS**

Built for QIE Blockchain Hackathon 2025

</div>
