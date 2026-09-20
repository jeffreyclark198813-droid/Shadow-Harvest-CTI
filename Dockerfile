# Multi-stage modern Cloud-Native Dockerfile
# Stage 1: Build Phase
FROM node:22-alpine AS builder

WORKDIR /app

# Enable high-speed package caching
COPY package*.json ./
RUN npm ci

COPY . .

# Compile full-stack React assets and Node/CJS bundle
RUN npm run build

# Remove development dependencies to minimize container footprint
RUN npm prune --production

# Stage 2: Minimal Distroless/Alpine Execution Phase
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy production artifacts from builder phase
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Create dedicated non-root execution user for strong sandboxed security
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
