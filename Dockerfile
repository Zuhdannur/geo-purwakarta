# syntax=docker/dockerfile:1.4

# Use the official Node.js 18 image as the base image for linux/amd64
FROM --platform=linux/amd64 node:18-alpine AS base

# Install dependencies only when needed
FROM --platform=linux/amd64 base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine 
# to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM --platform=linux/amd64 base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client before building
RUN npx prisma generate --schema=./prisma/schema.prisma

# Compile the seed script to JavaScript
RUN npx tsc prisma/seed.ts --outDir prisma --target es2022 --module commonjs --moduleResolution node --esModuleInterop --resolveJsonModule --skipLibCheck

RUN npm run build

# Production image, copy all the files and run next
FROM --platform=linux/amd64 base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create uploads directory with proper permissions
RUN mkdir -p ./public/uploads/commercial-houses
RUN chown -R nextjs:nodejs ./public

# Set the correct permission for prerender cache
RUN chown nextjs:nodejs .next

# Copy Prisma schema, migrations, seed, and client for runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy only necessary node_modules for Prisma and bcryptjs
RUN mkdir -p node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by Next.js standalone build output
CMD ["node", "server.js"]