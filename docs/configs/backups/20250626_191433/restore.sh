#!/bin/bash

# Restore Working Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Restoring working configurations from backup..."

# Frontend configs
cp "$SCRIPT_DIR/next.config.js" "/opt/crm-gtd-smart/packages/frontend/next.config.js"
cp "$SCRIPT_DIR/postcss.config.js" "/opt/crm-gtd-smart/packages/frontend/postcss.config.js"
cp "$SCRIPT_DIR/tailwind.config.js" "/opt/crm-gtd-smart/packages/frontend/tailwind.config.js"

# Docker configs
cp "$SCRIPT_DIR/docker-compose.v1.yml" "/opt/crm-gtd-smart/docker-compose.v1.yml"

# Nginx config
cp "$SCRIPT_DIR/nginx-all-apps.conf" "/etc/nginx/sites-available/all-apps"

# Backend config
cp "$SCRIPT_DIR/app.ts" "/opt/crm-gtd-smart/packages/backend/src/app.ts"

# Package.json files
cp "$SCRIPT_DIR/frontend-package.json" "/opt/crm-gtd-smart/packages/frontend/package.json"
cp "$SCRIPT_DIR/backend-package.json" "/opt/crm-gtd-smart/packages/backend/package.json"

echo "Configuration restored!"
echo "Now run: docker restart crm-frontend-v1 crm-backend-v1 && systemctl reload nginx"
