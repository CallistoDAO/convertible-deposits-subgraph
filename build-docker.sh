#!/bin/bash
set -e

echo "🐳 Building Convertible Deposits Indexer Docker Image"
echo "=================================================="

# Check if submodules are initialized
if [ ! -f "olympus-v3/deployments/.sepolia-1757576616.json" ]; then
    echo "⚠️  Submodule not initialized. Running 'pnpm init'..."
    pnpm init
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your ENVIO_API_TOKEN before running the indexer!"
fi

# Generate config.yaml
echo "📝 Generating config.yaml..."
node generate-config.js

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t convertible-deposits-indexer:latest .

echo ""
echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "  1. Update .env with your ENVIO_API_TOKEN"
echo "  2. Start the stack: pnpm docker:up"
echo "  3. View logs: pnpm docker:logs"
echo "  4. Access Hasura: http://localhost:8080 (password: testing)"
echo ""
