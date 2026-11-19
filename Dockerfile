
# Use Node.js Alpine image
FROM node:20-alpine

# Enable pnpm through Corepack
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application source
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build Next.js application
RUN pnpm build

# Copy entrypoint
COPY ./docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

# Expose Next.js port
EXPOSE 3000

# Set entrypoint (Entrypoint accepts arguments so it can be used to run different commands later)
ENTRYPOINT ["./docker-entrypoint.sh"]
