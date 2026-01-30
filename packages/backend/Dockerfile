
# Backend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules and Docker CLI for infrastructure monitoring
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    docker-cli \
    && ln -sf python3 /usr/bin/python

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Create healthcheck script
RUN echo 'const http = require("http"); \
const options = { host: "localhost", port: 3001, path: "/health", timeout: 2000 }; \
const request = http.request(options, (res) => { \
  if (res.statusCode === 200) process.exit(0); else process.exit(1); \
}); \
request.on("error", () => process.exit(1)); \
request.end();' > healthcheck.js

# Start the application with ts-node
CMD ["npx", "ts-node", "--transpile-only", "src/app.ts"]
