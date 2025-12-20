#!/bin/bash

# CRM-GTD SaaS Update Script
# Usage: ./update.sh [service_name]

set -e

SERVICE=${1:-"all"}
ENVIRONMENT="production"

echo "🔄 Updating CRM-GTD SaaS..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Load environment variables
export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)

if [ "$SERVICE" = "all" ]; then
    echo "🔄 Updating all services..."
    
    # Rebuild and restart all services
    docker-compose -f docker-compose.production.yml build --no-cache
    docker-compose -f docker-compose.production.yml up -d
    
elif [ "$SERVICE" = "backend" ]; then
    echo "🔄 Updating backend..."
    
    # Rebuild and restart backend
    docker-compose -f docker-compose.production.yml build --no-cache backend
    docker-compose -f docker-compose.production.yml up -d backend
    
elif [ "$SERVICE" = "frontend" ]; then
    echo "🔄 Updating frontend..."
    
    # Rebuild and restart frontend
    docker-compose -f docker-compose.production.yml build --no-cache frontend
    docker-compose -f docker-compose.production.yml up -d frontend
    
else
    echo "🔄 Updating service: $SERVICE..."
    
    # Rebuild and restart specific service
    docker-compose -f docker-compose.production.yml build --no-cache $SERVICE
    docker-compose -f docker-compose.production.yml up -d $SERVICE
fi

echo "⏳ Waiting for services to start..."
sleep 15

# Check health
echo "🔍 Checking service health..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Services are healthy"
else
    echo "⚠️ Health check failed, checking logs..."
    docker-compose -f docker-compose.production.yml logs --tail=50 $SERVICE
fi

echo "🎉 Update completed!"

# Show running containers
docker-compose -f docker-compose.production.yml ps