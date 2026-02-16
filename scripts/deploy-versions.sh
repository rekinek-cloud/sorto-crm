#!/bin/bash

# CRM-GTD Smart Multi-Version Deployment Script
# Usage: ./scripts/deploy-versions.sh [v1|v2|both|stop|status]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

function show_help() {
    echo "CRM-GTD Multi-Version Deployment"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  v1        Deploy V1 (Production/Testing) only"
    echo "  v2        Deploy V2 (Development) only" 
    echo "  both      Deploy both V1 and V2"
    echo "  stop      Stop all services"
    echo "  status    Show status of all services"
    echo "  nginx     Update Nginx configuration"
    echo "  logs-v1   Show V1 logs"
    echo "  logs-v2   Show V2 logs"
    echo ""
    echo "Examples:"
    echo "  $0 v1      # Deploy only V1"
    echo "  $0 both    # Deploy both versions"
    echo "  $0 nginx   # Update Nginx config"
}

function deploy_v1() {
    echo "🚀 Deploying V1 (Production/Testing)..."
    
    # Copy V1 environment
    cp .env.v1 packages/backend/.env
    cp .env.v1 packages/frontend/.env.local
    
    # Update API URL in frontend env
    echo "NEXT_PUBLIC_API_URL=/crm" >> packages/frontend/.env.local
    
    # Stop existing V1 services
    docker-compose -f docker-compose.v1.yml down 2>/dev/null || true
    
    # Build and start V1
    docker-compose -f docker-compose.v1.yml up --build -d
    
    echo "✅ V1 deployed successfully!"
    echo "🌐 Access at: https://crm.dev.sorto.ai/crm/"
    echo "📊 Health check: https://crm.dev.sorto.ai/health"
}

function deploy_v2() {
    echo "🚀 Deploying V2 (Development)..."
    
    # Copy V2 environment
    cp .env.v2 packages/backend/.env
    cp .env.v2 packages/frontend/.env.local
    
    # Update API URL in frontend env
    echo "NEXT_PUBLIC_API_URL=/crm2" >> packages/frontend/.env.local
    
    # Stop existing V2 services
    docker-compose -f docker-compose.v2.yml down 2>/dev/null || true
    
    # Build and start V2
    docker-compose -f docker-compose.v2.yml up --build -d
    
    echo "✅ V2 deployed successfully!"
    echo "🌐 Access at: https://crm.dev.sorto.ai/crm2/"
    echo "📊 Health check: https://crm.dev.sorto.ai/health2"
}

function deploy_both() {
    echo "🚀 Deploying both V1 and V2..."
    deploy_v1
    echo ""
    deploy_v2
    echo ""
    echo "🎉 Both versions deployed!"
    echo "📋 V1 (Production): https://crm.dev.sorto.ai/crm/"
    echo "📋 V2 (Development): https://crm.dev.sorto.ai/crm2/"
}

function stop_all() {
    echo "🛑 Stopping all services..."
    docker-compose -f docker-compose.v1.yml down 2>/dev/null || true
    docker-compose -f docker-compose.v2.yml down 2>/dev/null || true
    echo "✅ All services stopped"
}

function show_status() {
    echo "=== V1 Services Status ==="
    docker-compose -f docker-compose.v1.yml ps 2>/dev/null || echo "V1 not running"
    echo ""
    echo "=== V2 Services Status ==="
    docker-compose -f docker-compose.v2.yml ps 2>/dev/null || echo "V2 not running"
    echo ""
    echo "=== Port Usage ==="
    echo "V1 Frontend: 9025"
    echo "V1 Backend:  3001"
    echo "V1 DB:       5432"
    echo "V1 Redis:    6379"
    echo ""
    echo "V2 Frontend: 9026"
    echo "V2 Backend:  3002"
    echo "V2 DB:       5433"
    echo "V2 Redis:    6380"
    echo ""
    echo "=== URLs ==="
    echo "V1: https://crm.dev.sorto.ai/crm/"
    echo "V2: https://crm.dev.sorto.ai/crm2/"
}

function update_nginx() {
    echo "🔧 Updating Nginx configuration..."
    
    # Backup current config
    sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
    
    # Copy new multi-version config
    sudo cp /etc/nginx/sites-available/crm-multi-version /etc/nginx/sites-available/default
    
    # Test and reload
    sudo nginx -t
    sudo systemctl reload nginx
    
    echo "✅ Nginx configuration updated!"
    echo "🌐 Main redirect: https://crm.dev.sorto.ai/ → /crm/"
}

function show_logs_v1() {
    echo "📋 V1 Logs (Press Ctrl+C to exit):"
    docker-compose -f docker-compose.v1.yml logs -f
}

function show_logs_v2() {
    echo "📋 V2 Logs (Press Ctrl+C to exit):"
    docker-compose -f docker-compose.v2.yml logs -f
}

# Main command processing
case "${1:-help}" in
    "v1")
        deploy_v1
        ;;
    "v2")
        deploy_v2
        ;;
    "both")
        deploy_both
        ;;
    "stop")
        stop_all
        ;;
    "status")
        show_status
        ;;
    "nginx")
        update_nginx
        ;;
    "logs-v1")
        show_logs_v1
        ;;
    "logs-v2")
        show_logs_v2
        ;;
    "help"|*)
        show_help
        ;;
esac