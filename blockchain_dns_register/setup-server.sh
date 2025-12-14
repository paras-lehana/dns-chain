#!/bin/bash

# NeuraDNS Quick Server Setup Script
# Run this on your Ubuntu server

set -e

echo "🚀 Starting NeuraDNS Server Setup..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (use sudo)" 
   exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install build tools
apt install -y build-essential

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install ts-node and typescript
npm install -g ts-node typescript

# Install n8n
echo "📦 Installing n8n..."
npm install -g n8n

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Create project directory
echo "📁 Creating project directory..."
mkdir -p /opt/neuradns
cd /opt/neuradns

# Install UFW firewall
apt install -y ufw

# Configure firewall
echo "🔒 Configuring firewall..."
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3007/tcp
ufw allow 5678/tcp
echo "y" | ufw enable

# Create n8n systemd service
echo "⚙️ Setting up n8n service..."
cat > /etc/systemd/system/n8n.service << 'EOF'
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
EOF

# Reload systemd
systemctl daemon-reload
systemctl enable n8n
systemctl start n8n

echo ""
echo "✅ Basic setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Upload your NeuraDNS files to /opt/neuradns/"
echo "2. Run: cd /opt/neuradns && npm install"
echo "3. Copy .env.example to .env and configure"
echo "4. Import n8n workflow at http://YOUR_SERVER_IP:5678"
echo "5. Start API: pm2 start ecosystem.config.js"
echo "6. Configure Nginx with the provided nginx.conf"
echo ""
echo "🔧 Useful commands:"
echo "  pm2 status          - Check API status"
echo "  pm2 logs            - View API logs"
echo "  systemctl status n8n - Check n8n status"
echo "  nginx -t            - Test nginx config"
echo ""
