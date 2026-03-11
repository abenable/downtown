# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies required for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with npm
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 medusa && \
    adduser --system --uid 1001 medusa

# Copy package manifests for the built Medusa server and install production deps
COPY --from=builder /app/.medusa/server/package.json ./.medusa/server/package.json
COPY --from=builder /app/.medusa/server/package-lock.json ./.medusa/server/package-lock.json
RUN npm ci --omit=dev --prefix ./.medusa/server

# Copy built application (Medusa outputs to .medusa/server)
COPY --from=builder --chown=medusa:medusa /app/.medusa/server ./.medusa/server
RUN chown -R medusa:medusa /app/.medusa/server

USER medusa

EXPOSE 9000

# Run migrations and start the Medusa server
CMD ["sh", "-c", "cd .medusa/server && npm run predeploy && npm run start"]
