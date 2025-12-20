#!/bin/bash

# CRM-GTD SaaS Deployment Script for Hetzner VPS
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="crm-gtd"

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if environment file exists
if [ ! -f ".env.$ENVIRONMENT" ]; then
    echo "❌ Environment file .env.$ENVIRONMENT not found!"
    echo "Please copy .env.production.example to .env.$ENVIRONMENT and configure it."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Load environment variables
export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)

echo "📦 Building Docker images..."

# Build images
docker-compose -f docker-compose.production.yml build --no-cache

echo "🔄 Stopping existing containers..."

# Stop and remove existing containers
docker-compose -f docker-compose.production.yml down

echo "🗄️ Setting up database..."

# Start database services first
docker-compose -f docker-compose.production.yml up -d postgres redis clickhouse

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 30

# Run database migrations
echo "🔄 Running database migrations..."
docker-compose -f docker-compose.production.yml run --rm backend npm run db:generate
docker-compose -f docker-compose.production.yml run --rm backend npm run db:push

# Check if we should seed the database
read -p "Do you want to seed the database with demo data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    docker-compose -f docker-compose.production.yml run --rm backend npm run db:seed
fi

echo "🚀 Starting all services..."

# Start all services
docker-compose -f docker-compose.production.yml up -d

echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check backend health
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose -f docker-compose.production.yml logs backend
fi

# Check frontend
if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
    docker-compose -f docker-compose.production.yml logs frontend
fi

echo "📊 Deployment summary:"
echo "- Environment: $ENVIRONMENT"
echo "- Project: $PROJECT_NAME"
echo "- URL: ${NEXT_PUBLIC_APP_URL:-http://localhost}"

echo "📋 Useful commands:"
echo "  View logs: docker-compose -f docker-compose.production.yml logs -f [service]"
echo "  Stop all: docker-compose -f docker-compose.production.yml down"
echo "  Restart: docker-compose -f docker-compose.production.yml restart [service]"
echo "  Update: git pull && ./deploy.sh $ENVIRONMENT"

echo "🎉 Deployment completed!"

# Show running containers
echo "📦 Running containers:"
docker-compose -f docker-compose.production.yml ps