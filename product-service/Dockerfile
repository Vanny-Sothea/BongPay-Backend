# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm@10.15.0

# Copy package files + tsconfig + Prisma schema

COPY package*.json pnpm-lock.yaml tsconfig*.json prisma/ ./

# Install all dependencies (including dev for TS compilation)
RUN pnpm install

#  Copy source code
COPY . .

# Generate Prisma client before TypeScript compilation
RUN pnpm exec prisma generate

# Debug: list generated files to verify Prisma client
RUN ls -R /usr/src/app/src/generated

# Compile TypeScript
RUN pnpm exec tsc


# Stage 2: Production
FROM node:18-alpine

WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm@10.15.0

# Copy all node_modules from build stage (includes Prisma client)
COPY --from=build /usr/src/app/node_modules ./node_modules

# Copy compiled JS
COPY --from=build /usr/src/app/dist ./dist

# Copy Prisma schema (optional, for migrations)
COPY prisma ./prisma

EXPOSE 3002
CMD ["node", "dist/server.js"]
