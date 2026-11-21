# --- Stage 1: Build Frontend (React + Vite) ---
FROM node:20-alpine AS build-client
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# --- Stage 2: Production Server (Node.js + Express) ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

# Copy server code
WORKDIR /app
COPY server/ ./server/

# Copy built frontend assets from stage 1 into client/dist
COPY --from=build-client /app/client/dist ./client/dist

# Expose port (Google Cloud Run uses 8080)
EXPOSE 8080

CMD ["node", "server/src/index.js"]
