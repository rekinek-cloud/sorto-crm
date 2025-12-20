# CRM-GTD Smart Google Assistant Integration Dockerfile
FROM node:18-alpine

# Metadane obrazu
LABEL maintainer="CRM-GTD Smart Team"
LABEL description="Google Assistant integration for CRM-GTD Smart"
LABEL version="1.0.0"

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie plików package.json
COPY package*.json ./

# Instalacja zależności produkcyjnych
RUN npm ci --only=production && npm cache clean --force

# Kopiowanie kodu źródłowego
COPY . .

# Budowanie aplikacji TypeScript
RUN npm run build

# Utworzenie użytkownika non-root dla bezpieczeństwa
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Utworzenie katalogów dla logów i cache
RUN mkdir -p /app/logs /app/cache && \
    chown -R nodejs:nodejs /app

# Przełączenie na użytkownika non-root
USER nodejs

# Wystawienie portu
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node healthcheck.js

# Uruchomienie aplikacji
CMD ["node", "dist/index.js"]