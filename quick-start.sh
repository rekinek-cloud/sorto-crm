#!/bin/bash

# CRM-GTD SaaS Quick Start Script for Hetzner VPS
# This script automates the initial setup on a fresh Ubuntu VPS

set -e

echo "🚀 CRM-GTD SaaS Quick Start Setup"
echo "================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script as root (or with sudo)"
    exit 1
fi

echo "📦 Installing system dependencies..."

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    htop \
    ufw \
    certbot \
    python3-certbot-nginx

echo "🐳 Installing Docker..."

# Remove old Docker versions
apt remove -y docker docker-engine docker.io containerd runc || true

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

echo "🐙 Installing Docker Compose..."

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

echo "🔒 Configuring firewall..."

# Configure UFW firewall
ufw --force enable
ufw allow ssh
ufw allow 80
ufw allow 443

echo "📁 Creating directories..."

# Create application directory
mkdir -p /opt/crm-gtd-smart
mkdir -p /backups

echo "🎉 Basic setup completed!"
echo ""
echo "Next steps:"
echo "1. Clone your repository to /opt/crm-gtd-smart"
echo "2. Configure .env.production file"
echo "3. Run ./deploy.sh production"
echo ""
echo "Example commands:"
echo "  cd /opt"
echo "  git clone https://github.com/your-username/crm-gtd-smart.git"
echo "  cd crm-gtd-smart"
echo "  cp .env.production.example .env.production"
echo "  nano .env.production  # Configure your settings"
echo "  ./deploy.sh production"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md"