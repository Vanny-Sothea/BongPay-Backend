# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm@10.15.0

# Copy package files + tsconfig + Prisma schema
COPY package*.json pnpm-lock.yaml tsconfig*.json prisma/ ./

# Install all dependencies (including dev for TS compilation)
RUN pnpm install

# Copy source code
COPY . .

# Generate Prisma client before TypeScript compilation
RUN pnpm exec prisma generate

# Compile TypeScript
RUN pnpm exec tsc


# Stage 2: Production
FROM node:18-alpine

WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm@10.15.0

# Copy only production dependencies
COPY package*.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod

# Copy compiled JS from build stage
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3002

# Start the application
CMD ["node", "dist/server.js"]
