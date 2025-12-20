#!/bin/bash
# Performance monitoring script for CRM-GTD Smart

set -e

echo "📊 CRM-GTD Smart Performance Monitor"
echo "===================================="
echo ""

# Function to format bytes
format_bytes() {
    local bytes=$1
    if [ $bytes -ge 1073741824 ]; then
        echo "$(( bytes / 1073741824 ))GB"
    elif [ $bytes -ge 1048576 ]; then
        echo "$(( bytes / 1048576 ))MB"
    elif [ $bytes -ge 1024 ]; then
        echo "$(( bytes / 1024 ))KB"
    else
        echo "${bytes}B"
    fi
}

# Check if containers are running
echo "🐳 Container Status:"
docker-compose -f docker-compose.v1-production.yml ps 2>/dev/null || docker-compose -f docker-compose.v1.yml ps

echo ""
echo "📈 Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"

echo ""
echo "🖥️  System Resources:"
echo "CPU Cores: $(nproc)"
echo "Memory: $(free -h | awk '/^Mem:/ {print $2 " total, " $3 " used, " $7 " available"}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $2 " total, " $3 " used, " $4 " available (" $5 " used)"}')"

echo ""
echo "🔍 Health Checks:"

# Check frontend health
if curl -s -f http://localhost:9025/ > /dev/null 2>&1; then
    echo "✅ Frontend: Healthy"
else
    echo "❌ Frontend: Down"
fi

# Check backend health
if curl -s -f http://localhost:3003/health > /dev/null 2>&1; then
    echo "✅ Backend: Healthy"
else
    echo "❌ Backend: Down"
fi

# Check database
if docker exec crm-postgres-v1-prod pg_isready -U user -d crm_gtd_v1 > /dev/null 2>&1; then
    echo "✅ Database: Healthy"
elif docker exec crm-postgres-v1 pg_isready -U user -d crm_gtd_v1 > /dev/null 2>&1; then
    echo "✅ Database: Healthy (dev mode)"
else
    echo "❌ Database: Down"
fi

# Check Redis
if docker exec crm-redis-v1-prod redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: Healthy"
elif docker exec crm-redis-v1 redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: Healthy (dev mode)"
else
    echo "❌ Redis: Down"
fi

# Check TTS service
if curl -s -f http://localhost:5002/health > /dev/null 2>&1; then
    echo "✅ TTS Service: Healthy"
else
    echo "❌ TTS Service: Down"
fi

echo ""
echo "📊 Database Performance:"
if docker exec crm-postgres-v1-prod psql -U user -d crm_gtd_v1 -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null; then
    echo "Database connections checked (production)"
elif docker exec crm-postgres-v1 psql -U user -d crm_gtd_v1 -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null; then
    echo "Database connections checked (development)"
fi

echo ""
echo "🌐 Application URLs:"
echo "Frontend: http://91.99.50.80/crm/"
echo "Backend API: http://91.99.50.80/crm/api/v1/"
echo "Health: http://91.99.50.80/health"

echo ""
echo "📋 Quick Commands:"
echo "🚀 Switch to production: ./switch-to-production.sh"
echo "🔧 Switch to development: ./switch-to-development.sh"
echo "📊 Monitor continuously: watch -n 5 ./monitor-performance.sh"
echo "🐳 View logs: docker-compose logs -f [service-name]"

echo ""