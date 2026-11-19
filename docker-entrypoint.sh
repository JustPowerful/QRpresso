#!/bin/sh
set -e

echo "Running Prisma Migrations..."

pnpm prisma migrate deploy

echo "Starting Next.js..."

exec pnpm start