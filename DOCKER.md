# Docker Deployment Guide

This guide explains how to build and run the Envio indexer as a Docker container.

## Files Overview

- **Dockerfile** - Multi-stage build for the indexer
- **.dockerignore** - Excludes unnecessary files from build context
- **docker-compose.indexer.yaml** - Full stack with Postgres, Hasura, and custom indexer image

## Prerequisites

1. Docker and Docker Compose installed
2. Git submodules initialized: `pnpm init` or `git submodule update --init`
3. Environment variables configured (see below)

## Environment Variables

Create a `.env` file or export these variables:

```bash
# Required
ENVIO_API_TOKEN="your_envio_api_token"

# Optional (with defaults)
ENVIO_PG_PORT=5433
ENVIO_PG_USER=postgres
ENVIO_PG_PASSWORD=testing
ENVIO_PG_DATABASE=envio-dev

HASURA_EXTERNAL_PORT=8080
HASURA_GRAPHQL_ADMIN_SECRET=testing
HASURA_GRAPHQL_ENABLE_CONSOLE=true

# Optional
ETHERSCAN_API_KEY="your_etherscan_api_key"
```

## Quick Start

### Option 1: Use Pre-Built Image from GitHub Container Registry (Fastest)

Pull and run the pre-built image without building locally:

```bash
# Copy environment template
cp .env.ghcr.example .env

# Edit .env and set:
# - GITHUB_REPOSITORY (e.g., olympusdao/convertible-deposits-subgraph)
# - IMAGE_TAG (e.g., latest, v1.0.0)
# - ENVIO_API_TOKEN

# Pull the latest image
pnpm ghcr:pull

# Start all services
pnpm ghcr:up

# View logs
pnpm ghcr:logs
```

**Benefits:**
- ✅ No local build required (saves 3-5 minutes)
- ✅ Consistent images across team
- ✅ Automatic updates via GitHub Actions
- ✅ Production-ready images

### Option 2: Build and Run Full Stack

Build and start all services (Postgres + Hasura + Indexer):

```bash
# Initialize submodules (required for deployment files)
pnpm init

# Build and start
docker-compose -f docker-compose.indexer.yaml up --build -d

# View logs
docker-compose -f docker-compose.indexer.yaml logs -f envio-indexer

# Stop services
docker-compose -f docker-compose.indexer.yaml down
```

### Option 2: Build Indexer Image Only

Build just the indexer image for use with existing infrastructure:

```bash
# Build image
docker build -t convertible-deposits-indexer:latest .

# Run with existing Postgres + Hasura
docker run -d \
  --name envio-indexer \
  --network local_test_network \
  -e ENVIO_PG_HOST=envio-postgres \
  -e ENVIO_PG_PORT=5432 \
  -e ENVIO_PG_USER=postgres \
  -e ENVIO_PG_PASSWORD=testing \
  -e ENVIO_PG_DATABASE=envio-dev \
  -e HASURA_URL=http://graphql-engine:8080 \
  -e HASURA_GRAPHQL_ADMIN_SECRET=testing \
  -e ENVIO_API_TOKEN="${ENVIO_API_TOKEN}" \
  convertible-deposits-indexer:latest
```

### Option 3: Development with Generated Docker Compose

Use the generated docker-compose for local development (without custom image):

```bash
docker-compose -f generated/docker-compose.yaml up -d
pnpm dev  # Run indexer locally, connects to containerized Postgres + Hasura
```

## Services

After starting with docker-compose:

- **Postgres**: `localhost:5433` (user: `postgres`, password: `testing`)
- **Hasura Console**: http://localhost:8080 (admin secret: `testing`)
- **GraphQL API**: http://localhost:8080/v1/graphql
- **Indexer**: Runs in container, connects to other services
- **Hasura Setup**: Helper container that automatically tracks all tables on startup (runs once, then exits)

## Configuration

### Using Different Configs

To use a different config file (e.g., multi-network):

1. **Build time**: Update `config.yaml` before building
   ```bash
   node generate-config.js config.multi.json config.yaml
   docker build -t convertible-deposits-indexer:latest .
   ```

2. **Runtime**: Mount config as volume
   ```yaml
   # In docker-compose.indexer.yaml
   volumes:
     - ./config.yaml:/envio-indexer/config.yaml:ro
   ```

### Generating Config at Build Time

The Dockerfile includes the config generation script. To regenerate config during build:

```dockerfile
# Add this before codegen in Dockerfile
COPY ./config.json ./config.json
RUN node generate-config.js
```

## Automatic Table Tracking

The `hasura-setup` service automatically tracks all entity tables in Hasura when the stack starts:

**Tracked Tables:**
- All main entities: Asset, Depositor, ConvertibleDepositPosition, Redemption, etc.
- Snapshot tables: AuctioneerSnapshot, DepositFacilitySnapshot, etc.
- Configuration tables: DepositRedemptionVaultAssetConfiguration, etc.

**Automatic Relationships Created:**
- `ConvertibleDepositPosition.depositor` → Links to Depositor
- `ConvertibleDepositPosition.facility` → Links to DepositFacility
- `ConvertibleDepositPosition.depositAssetPeriod` → Links to DepositAssetPeriod
- `Depositor.positions` → Array of ConvertibleDepositPositions

**How It Works:**
1. Waits for Hasura to be healthy
2. Waits 10 seconds for indexer to create initial tables
3. Tracks all entity tables via Hasura metadata API
4. Sets up GraphQL relationships
5. Exits (doesn't restart)

**Manual Tracking:**
If you need to track additional tables (like event tables or history tables), you can:
1. Use Hasura Console: http://localhost:8080 → Data tab → Track tables
2. Run the setup script again: `docker-compose -f docker-compose.indexer.yaml up hasura-setup`
3. Add more tables to the `hasura-setup` service in `docker-compose.indexer.yaml`

## Troubleshooting

### Hasura Shows No Data

If Hasura shows no tables after startup:
1. Check if hasura-setup completed successfully:
   ```bash
   docker-compose -f docker-compose.indexer.yaml logs hasura-setup
   ```
2. Manually trigger the setup:
   ```bash
   docker-compose -f docker-compose.indexer.yaml up hasura-setup
   ```
3. Verify tables exist in Postgres:
   ```bash
   docker-compose -f docker-compose.indexer.yaml exec envio-postgres \
     psql -U postgres -d envio-dev -c "\dt public.*"
   ```

### Submodule Not Initialized

```bash
Error: COPY failed: file not found in build context
```

**Solution**: Initialize submodules before building
```bash
git submodule update --init --recursive
```

### Indexer Can't Connect to Postgres

```bash
Error: connect ECONNREFUSED
```

**Solution**: Ensure services are on the same Docker network and Postgres is healthy
```bash
docker network ls  # Check network exists
docker-compose -f docker-compose.indexer.yaml ps  # Check service status
```

### Missing ENVIO_API_TOKEN

```bash
Error: ENVIO_API_TOKEN is required
```

**Solution**: Set the token in `.env` file or export as environment variable
```bash
export ENVIO_API_TOKEN="your_token"
```

## Building for Production

### Optimized Build

```bash
# Build with specific version tag
docker build -t convertible-deposits-indexer:v1.0.0 .

# Tag for registry
docker tag convertible-deposits-indexer:v1.0.0 your-registry.com/convertible-deposits-indexer:v1.0.0

# Push to registry
docker push your-registry.com/convertible-deposits-indexer:v1.0.0
```

### Multi-Platform Build

```bash
# Build for multiple architectures
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t convertible-deposits-indexer:latest \
  --push .
```

## Health Checks

Check indexer status:

```bash
# View logs
docker-compose -f docker-compose.indexer.yaml logs -f envio-indexer

# Check indexer container health
docker ps | grep envio-indexer

# Execute commands in running container
docker exec -it $(docker ps -qf "name=envio-indexer") sh

# Check indexer database
docker exec -it $(docker ps -qf "name=envio-postgres") \
  psql -U postgres -d envio-dev -c "\dt public_*.*"
```

## Resource Limits

Add resource limits to docker-compose.indexer.yaml:

```yaml
envio-indexer:
  # ...
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 4G
      reservations:
        cpus: '1'
        memory: 2G
```

## Persistent Data

Volumes for data persistence:

- **db_data**: PostgreSQL database
- **indexer_cache**: Envio effects cache (optional)

To reset data:
```bash
docker-compose -f docker-compose.indexer.yaml down -v  # Remove volumes
```

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Build Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: recursive

      - name: Build image
        run: docker build -t convertible-deposits-indexer:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push convertible-deposits-indexer:${{ github.sha }}
```

## GitHub Container Registry Deployment

### Pulling Pre-Built Images

The project includes GitHub Actions workflow that automatically builds and pushes images to GitHub Container Registry.

**Available Scripts:**
```bash
pnpm ghcr:pull      # Pull latest image
pnpm ghcr:up        # Start services with pre-built image
pnpm ghcr:down      # Stop services
pnpm ghcr:logs      # View indexer logs
pnpm ghcr:restart   # Pull latest and restart
pnpm ghcr:clean     # Stop and remove all data
```

### Using Specific Versions

Edit `.env` to use specific versions:

```bash
# Use latest (auto-updated on every push to main)
IMAGE_TAG=latest

# Use specific semantic version (recommended for production)
IMAGE_TAG=v1.0.0

# Use specific commit (for testing)
IMAGE_TAG=master-abc1234
```

### Making Images Public

By default, images are private. To make public:

1. Go to: https://github.com/users/YOUR_USERNAME/packages/container/convertible-deposits-subgraph/settings
2. Scroll to "Danger Zone"
3. Click "Change visibility" → "Public"

### Private Image Access

For private images, authenticate Docker:

```bash
# Create GitHub Personal Access Token with read:packages scope
# https://github.com/settings/tokens/new

# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Now pull will work
pnpm ghcr:pull
```

### Continuous Deployment

The GitHub Actions workflow automatically:
- ✅ Builds on every push to `master`/`main`
- ✅ Creates version tags on git tags (`v*`)
- ✅ Uses build cache for faster builds
- ✅ Publishes to `ghcr.io/YOUR_ORG/convertible-deposits-subgraph`

**To deploy a new version:**

```bash
# Tag the release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# GitHub Actions builds and pushes automatically
# Wait ~3-5 minutes for build

# Update production
IMAGE_TAG=v1.0.0 pnpm ghcr:restart
```

## Additional Resources

- [Envio Docker Example](https://github.com/enviodev/local-docker-example)
- [Envio Documentation](https://docs.envio.dev)
- [Hasura Docker Guide](https://hasura.io/docs/latest/deployment/deployment-guides/docker/)
- [GitHub Container Registry Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
