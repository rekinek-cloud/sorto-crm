FROM node:18-alpine

WORKDIR /app

# Only copy what we need
COPY package*.json ./
COPY simple-backend.js ./

# Install only production dependencies we actually use
RUN npm install express cors bcryptjs jsonwebtoken

EXPOSE 9029

CMD ["node", "simple-backend.js"]
