#!/bin/bash
# Frontend deployment script - builds and copies static files

cd /opt/crm-gtd-smart/packages/frontend

echo "Building frontend..."
npm run build

echo "Copying static files to standalone..."
if [ -d ".next/standalone" ]; then
    cp -r .next/static .next/standalone/.next/
    cp -r .next/static .next/standalone/packages/frontend/.next/ 2>/dev/null || true
    echo "Static files copied to standalone"
fi

echo "Restarting frontend..."
pm2 restart crm-frontend-prod

echo "Done!"
