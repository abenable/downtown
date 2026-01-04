# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install bun and dependencies for building native modules
RUN apk add --no-cache python3 make g++ && npm install -g bun

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies with bun
RUN bun install

# Copy source code
COPY . .

# Build the application with npm
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install bun for package installation
RUN npm install -g bun

# Create non-root user
RUN addgroup --system --gid 1001 medusa && \
    adduser --system --uid 1001 medusa

# Copy built application (Medusa outputs to .medusa/server)
COPY --from=builder --chown=medusa:medusa /app/.medusa/server ./.medusa/server
COPY --from=builder --chown=medusa:medusa /app/package.json ./package.json

USER medusa

EXPOSE 9000

# Follow Medusa deployment guide: cd to .medusa/server, install deps with bun, run migrations and start with npm
CMD ["sh", "-c", "cd .medusa/server && bun install && npm run predeploy && npm run start"]
