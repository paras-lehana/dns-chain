# NeuraDNS Deployment Package

## 🎯 Quick Start

This folder contains everything you need to deploy NeuraDNS to your server.

### Files Included:
- `production-api.ts` - Backend API
- `index.html` - Frontend UI
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `wallet.json` - Solana wallet (KEEP SECURE!)
- `.env.example` - Environment template
- `ecosystem.config.js` - PM2 configuration
- `nginx.conf` - Web server config
- `setup-server.sh` - Automated setup script
- `DEPLOYMENT_GUIDE.md` - Full instructions

### Deployment Methods:

#### Method 1: Automated Setup (Recommended)
```bash
# On your server:
sudo bash setup-server.sh
# Then follow the on-screen instructions
```

#### Method 2: Manual Setup
Read `DEPLOYMENT_GUIDE.md` for step-by-step instructions.

---

## 📦 Package This Folder

```bash
# Create deployment archive
tar -czf neuradns-deploy.tar.gz *

# Upload to server
scp neuradns-deploy.tar.gz user@your-server:/home/user/
```

---

## 🔑 Important Notes:

1. **Wallet Security**: `wallet.json` contains your Solana private key. Keep it secure!
   ```bash
   chmod 600 wallet.json
   ```

2. **n8n Setup**: Import the workflow manually via n8n UI after installation

3. **Domain/IP**: Update `nginx.conf` with your actual domain name

4. **Environment**: Copy `.env.example` to `.env` and configure

---

## 🌐 Access After Deployment:

- **Frontend**: `http://your-server-ip/`
- **API Health**: `http://your-server-ip/api/health`
- **n8n Admin**: `http://your-server-ip:5678`

---

## ⚡ Quick Commands:

```bash
# Check status
pm2 status
systemctl status n8n
systemctl status nginx

# View logs
pm2 logs
journalctl -u n8n -f

# Restart services
pm2 restart all
systemctl restart n8n
systemctl restart nginx
```

---

## 📚 Full Documentation:

See `DEPLOYMENT_GUIDE.md` for complete instructions!
