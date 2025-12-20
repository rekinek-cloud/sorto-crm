#!/bin/bash

# Transfer script for CRM-GTD to VPS
# Usage: ./transfer-to-vps.sh VPS_IP

VPS_IP=$1
VPS_USER=${2:-root}

if [ -z "$VPS_IP" ]; then
    echo "Usage: ./transfer-to-vps.sh VPS_IP [username]"
    echo "Example: ./transfer-to-vps.sh 123.456.789.0"
    exit 1
fi

echo "🚀 Transferring CRM-GTD to VPS: $VPS_USER@$VPS_IP"

# Create archive excluding unnecessary files
echo "📦 Creating archive..."
tar -czf /tmp/crm-gtd-deploy.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=dist \
    --exclude=.next \
    --exclude=*.log \
    --exclude=postgres_data \
    --exclude=redis_data \
    --exclude=clickhouse_data \
    .

echo "📤 Uploading to VPS..."
scp /tmp/crm-gtd-deploy.tar.gz $VPS_USER@$VPS_IP:/tmp/

echo "🔧 Extracting on VPS..."
ssh $VPS_USER@$VPS_IP << 'ENDSSH'
    # Create directory
    mkdir -p /opt/crm-gtd-smart
    cd /opt/crm-gtd-smart
    
    # Extract files
    tar -xzf /tmp/crm-gtd-deploy.tar.gz
    rm /tmp/crm-gtd-deploy.tar.gz
    
    # Set permissions
    chmod +x *.sh
    
    echo "✅ Files transferred successfully!"
    ls -la
ENDSSH

echo "🎉 Transfer complete!"
echo ""
echo "Next steps:"
echo "1. SSH to your VPS: ssh $VPS_USER@$VPS_IP"
echo "2. cd /opt/crm-gtd-smart"
echo "3. ./quick-start.sh  # Install Docker and dependencies"
echo "4. cp .env.production.example .env.production"
echo "5. nano .env.production  # Configure settings"
echo "6. ./deploy.sh production"