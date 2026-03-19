#!/bin/bash

# MediMate Development Setup Script

echo "=== MediMate Development Setup ==="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Start database
echo "Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Setup server
echo "Setting up backend..."
cd server

if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from template. Please update it with your values."
fi

npm install
npx prisma generate

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start development:"
echo "  1. Start backend:  cd server && npm run start:dev"
echo "  2. Start frontend: npm run dev"
echo ""
echo "Backend API: http://localhost:3001"
echo "Frontend:   http://localhost:3000"
echo "API Docs:   http://localhost:3001/api/docs"
