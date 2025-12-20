#!/bin/bash

# Backup Current Working Configurations
# Run this script to save current working configs

BACKUP_DIR="/opt/crm-gtd-smart/docs/configs/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Creating backup of working configurations in: $BACKUP_DIR"

# Frontend configs
cp "/opt/crm-gtd-smart/packages/frontend/next.config.js" "$BACKUP_DIR/next.config.js"
cp "/opt/crm-gtd-smart/packages/frontend/postcss.config.js" "$BACKUP_DIR/postcss.config.js"
cp "/opt/crm-gtd-smart/packages/frontend/tailwind.config.js" "$BACKUP_DIR/tailwind.config.js"

# Docker configs
cp "/opt/crm-gtd-smart/docker-compose.v1.yml" "$BACKUP_DIR/docker-compose.v1.yml"

# Nginx config
cp "/etc/nginx/sites-available/all-apps" "$BACKUP_DIR/nginx-all-apps.conf"

# Backend app.ts (with AI routes commented)
cp "/opt/crm-gtd-smart/packages/backend/src/app.ts" "$BACKUP_DIR/app.ts"

# Package.json files
cp "/opt/crm-gtd-smart/packages/frontend/package.json" "$BACKUP_DIR/frontend-package.json"
cp "/opt/crm-gtd-smart/packages/backend/package.json" "$BACKUP_DIR/backend-package.json"

echo "Backup completed successfully!"
echo "Files saved in: $BACKUP_DIR"

# Create restore script
cat > "$BACKUP_DIR/restore.sh" << 'EOF'
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
EOF

chmod +x "$BACKUP_DIR/restore.sh"

echo "Restore script created: $BACKUP_DIR/restore.sh"