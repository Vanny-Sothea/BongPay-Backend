# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm@10.15.0

# Copy package files + tsconfig
COPY package*.json pnpm-lock.yaml tsconfig*.json ./

# Install all dependencies (including dev for TS compilation)
RUN pnpm install

#  Copy source code
COPY . .

# Compile TypeScript
RUN pnpm exec tsc

# Stage 2: Production
FROM node:18-alpine

WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm@10.15.0

# Copy only production dependencies
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --prod

# Copy compiled JS from build stage
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3001

# Start the application
CMD ["node", "dist/main.js"]