#!/bin/bash
# Script to switch back to development mode

set -e

echo "🔧 Switching back to DEVELOPMENT mode..."

# Stop production containers
echo "⏹️  Stopping production containers..."
docker-compose -f docker-compose.v1-production.yml down

# Start development containers
echo "🚀 Starting development containers..."
docker-compose -f docker-compose.v1.yml up -d

echo ""
echo "✅ DEVELOPMENT MODE ACTIVATED!"
echo "🌐 Application URL: http://91.99.50.80/crm/"