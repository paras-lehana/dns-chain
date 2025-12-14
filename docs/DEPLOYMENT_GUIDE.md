# NeuraDNS - Complete Server Deployment Guide

## 📦 Package Contents
- `production-api.ts` - Backend API server
- `index.html` - Frontend UI
- `package.json` - Node.js dependencies
- `tsconfig.json` - TypeScript configuration
- `wallet.json` - Solana wallet (keep secure!)
- `.env.example` - Environment variables template
- `ecosystem.config.js` - PM2 configuration
- `nginx.conf` - Nginx configuration example
- `n8n-workflow.json` - n8n workflow export

## 🚀 Server Requirements

### Minimum Specs:
- Ubuntu 20.04+ or similar Linux
- 2GB RAM
- 20GB storage
- Node.js 18+ 
- npm or yarn

### Ports Needed:
- `3007` - API Server
- `5678` - n8n
- `80` - HTTP (Nginx)
- `443` - HTTPS (Nginx with SSL)

---

## 📋 Step-by-Step Deployment

### 1️⃣ Upload Files to Server

```bash
# On your local machine, create deployment package
cd deployment
tar -czf neuradns-deploy.tar.gz *

# Upload to server (replace with your server details)
scp neuradns-deploy.tar.gz user@your-server-ip:/home/user/

# SSH into server
ssh user@your-server-ip

# Extract files
mkdir -p /opt/neuradns
cd /opt/neuradns
tar -xzf ~/neuradns-deploy.tar.gz
```

---

### 2️⃣ Install Node.js (if not installed)

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be 18+
npm --version
```

---

### 3️⃣ Install Project Dependencies

```bash
cd /opt/neuradns

# Install dependencies
npm install

# Install PM2 globally (process manager)
sudo npm install -g pm2

# Install ts-node globally
sudo npm install -g ts-node typescript
```

---

### 4️⃣ Configure Environment

```bash
# Create .env file
cp .env.example .env
nano .env
```

**Edit .env with your settings:**
```env
PORT=3007
N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/validate_domain
NODE_ENV=production
```

---

### 5️⃣ Setup n8n Workflow

#### Install n8n:
```bash
sudo npm install -g n8n

# Create n8n directory
mkdir -p ~/.n8n
```

#### Import Workflow:
```bash
# Start n8n temporarily
n8n start

# Open browser: http://your-server-ip:5678
# Login/Create account
# Go to Workflows > Import from File
# Upload: n8n-workflow.json
# Click on workflow > Activate (toggle switch on top right)
```

#### Configure n8n as Service:
```bash
# Create systemd service
sudo nano /etc/systemd/system/n8n.service
```

**Paste this:**
```ini
[Unit]
Description=n8n workflow automation
After=network.target

[Service]
Type=simple
User=root
Environment="N8N_PORT=5678"
Environment="N8N_PROTOCOL=http"
Environment="N8N_HOST=0.0.0.0"
ExecStart=/usr/bin/n8n start
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start n8n
sudo systemctl daemon-reload
sudo systemctl enable n8n
sudo systemctl start n8n

# Check status
sudo systemctl status n8n
```

---

### 6️⃣ Start API Server with PM2

```bash
cd /opt/neuradns

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Check status
pm2 status
pm2 logs neuradns-api
```

---

### 7️⃣ Setup Nginx (Web Server)

#### Install Nginx:
```bash
sudo apt update
sudo apt install -y nginx
```

#### Configure Nginx:
```bash
sudo nano /etc/nginx/sites-available/neuradns
```

**Paste this configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    # Frontend
    location / {
        root /opt/neuradns;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3007/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # n8n Admin (optional - remove in production)
    location /n8n/ {
        proxy_pass http://localhost:5678/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/neuradns /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

### 8️⃣ Update Frontend API URL

```bash
nano /opt/neuradns/index.html
```

**Find and replace:**
```javascript
const API_BASE = 'http://localhost:3007';
```

**With:**
```javascript
const API_BASE = '/api';  // Uses Nginx proxy
// OR for direct access:
// const API_BASE = 'http://your-server-ip:3007';
```

---

### 9️⃣ Firewall Configuration

```bash
# Allow necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3007/tcp  # Only if accessing API directly
sudo ufw allow 5678/tcp  # Only if accessing n8n directly

# Enable firewall
sudo ufw enable
sudo ufw status
```

---

### 🔟 Setup SSL (HTTPS) - Optional but Recommended

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

---

## ✅ Verify Deployment

### Check All Services:
```bash
# Check n8n
sudo systemctl status n8n
curl http://localhost:5678

# Check API
pm2 status
curl http://localhost:3007/health

# Check Nginx
sudo systemctl status nginx
curl http://localhost
```

### Access Your Application:
- Frontend: `http://your-server-ip` or `http://your-domain.com`
- API Health: `http://your-server-ip/api/health`
- n8n Admin: `http://your-server-ip:5678` (secure this in production!)

---

## 🔧 Maintenance Commands

### View Logs:
```bash
# API logs
pm2 logs neuradns-api

# n8n logs
sudo journalctl -u n8n -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services:
```bash
# Restart API
pm2 restart neuradns-api

# Restart n8n
sudo systemctl restart n8n

# Restart Nginx
sudo systemctl restart nginx
```

### Update Code:
```bash
cd /opt/neuradns

# Pull new files (if using git)
# OR upload new files via SCP

# Restart API
pm2 restart neuradns-api

# Reload Nginx (if frontend changed)
sudo systemctl reload nginx
```

---

## 🔒 Security Checklist

- [ ] Change default ports in production
- [ ] Setup firewall (UFW)
- [ ] Enable HTTPS with SSL certificate
- [ ] Secure n8n with password/disable public access
- [ ] Keep `wallet.json` secure (600 permissions)
- [ ] Use environment variables for secrets
- [ ] Setup fail2ban for SSH protection
- [ ] Regular backups of wallet and data
- [ ] Monitor logs for suspicious activity

```bash
# Secure wallet file
chmod 600 /opt/neuradns/wallet.json
```

---

## 🐛 Troubleshooting

### API Not Starting:
```bash
pm2 logs neuradns-api --err
# Check port 3007 not in use
sudo lsof -i :3007
```

### n8n Not Working:
```bash
sudo journalctl -u n8n -n 50
# Ensure port 5678 is open
curl http://localhost:5678
```

### Nginx Error:
```bash
sudo nginx -t  # Test configuration
sudo tail -f /var/log/nginx/error.log
```

### Frontend Can't Connect:
- Check API_BASE URL in index.html
- Verify Nginx proxy configuration
- Check browser console for CORS errors

---

## 📞 Support

For issues:
1. Check logs first
2. Verify all services are running
3. Test each component individually
4. Check firewall rules

## 🎉 Done!

Your NeuraDNS is now live! Test the complete flow:
1. Visit your domain
2. Check a domain
3. Register a valid domain
4. Verify on Solana Explorer
