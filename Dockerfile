# Multi-stage production Dockerfile for LUMA
# Builds static Vite client assets and runs Express backend as non-root user

# --- Build Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies needed for compilation
COPY package*.json ./
RUN npm ci

# Copy application source and build client bundle
COPY . .
RUN npm run build

# Prune devDependencies to keep production layer lean
RUN npm prune --production

# --- Production Runtime Stage ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user for principle of least privilege
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production artifacts from builder
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/src/server ./src/server
COPY --from=builder --chown=nodejs:nodejs /app/src/content ./src/content
COPY --from=builder --chown=nodejs:nodejs /app/server.ts ./
COPY --from=builder --chown=nodejs:nodejs /app/tsconfig.json ./

# Switch to unprivileged non-root user
USER nodejs

# Expose server port
EXPOSE 3000

# Container liveness check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/healthz || exit 1

# Start the full-stack server
CMD ["node", "--loader", "tsx", "server.ts"]
