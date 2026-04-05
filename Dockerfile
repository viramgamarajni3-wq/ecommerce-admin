# Base stage for dependencies
FROM node:20.20.2-alpine AS base
WORKDIR /app

# Builder stage
FROM base AS builder

# Copy package management files
COPY package*.json ./
COPY apps/admin/package.json ./apps/admin/
# Also copy other workspace package.json since they might be referenced in dependencies
COPY apps/storefront/package.json ./apps/storefront/
COPY apps/vendor-dashboard/package.json ./apps/vendor-dashboard/
COPY backend/medusa-server/package.json ./backend/medusa-server/

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY . .

# Pass environment variables during build time for Next.js baking
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXTAUTH_URL

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}

# Build only the admin portal
RUN npm run build --workspace=admin

# Ensure public directory exists
RUN mkdir -p apps/admin/public

# Runner stage
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3001

# Copy build output from builder
COPY --from=builder /app/apps/admin/.next /app/apps/admin/.next
COPY --from=builder /app/apps/admin/public /app/apps/admin/public

# Copy production-essential metadata
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json
COPY --from=builder /app/apps/admin/package.json /app/apps/admin/package.json
COPY --from=builder /app/apps/admin/next.config.js /app/apps/admin/next.config.js

# Copy build output and public folder
COPY --from=builder /app/apps/admin/.next /app/apps/admin/.next
COPY --from=builder /app/apps/admin/public /app/apps/admin/public

# Copy other portal package.json (essential for workspace resolution)
COPY --from=builder /app/apps/storefront/package.json /app/apps/storefront/package.json
COPY --from=builder /app/apps/vendor-dashboard/package.json /app/apps/vendor-dashboard/package.json
COPY --from=builder /app/backend/medusa-server/package.json /app/backend/medusa-server/package.json

# Install only production dependencies
RUN npm ci --only=production --workspace=admin --prefer-offline --no-audit

EXPOSE 3001

# Start command
CMD ["npm", "run", "start", "--workspace=admin"]
