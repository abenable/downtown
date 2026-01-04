# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for building
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* bun.lockb* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 medusa && \
    adduser --system --uid 1001 medusa

# Copy built application
COPY --from=builder --chown=medusa:medusa /app/.medusa ./.medusa
COPY --from=builder --chown=medusa:medusa /app/node_modules ./node_modules
COPY --from=builder --chown=medusa:medusa /app/package.json ./package.json
COPY --from=builder --chown=medusa:medusa /app/medusa-config.ts ./medusa-config.ts
COPY --from=builder --chown=medusa:medusa /app/tsconfig.json ./tsconfig.json

# Copy source files needed at runtime
COPY --from=builder --chown=medusa:medusa /app/src ./src
COPY --from=builder --chown=medusa:medusa /app/static ./static

USER medusa

EXPOSE 9000

CMD ["sh", "-c", "npx medusa db:migrate && npm run start"]
