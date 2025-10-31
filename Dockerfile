# Envio Indexer Dockerfile for TypeScript project
FROM node:24.3.0-slim

# Install PostgreSQL client tools for effects cache management
# --no-install-recommends and cleanup keep the image smaller
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    postgresql-client \
    git && \
    rm -rf /var/lib/apt/lists/*

# Setup pnpm package manager
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@9.7.1

WORKDIR /envio-indexer

# Copy package files for dependency installation
COPY ./package.json ./package.json
COPY ./pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies with frozen lockfile for reproducibility
RUN pnpm install --frozen-lockfile

# Copy configuration files needed for codegen
COPY ./config.yaml ./config.yaml
COPY ./schema.graphql ./schema.graphql
COPY ./tsconfig.json ./tsconfig.json

# Copy source code and utilities
COPY ./src ./src
COPY ./test ./test

# Copy config generation script and template (optional, for runtime config generation)
COPY ./generate-config.js ./generate-config.js
COPY ./config.yaml.handlebars ./config.yaml.handlebars

# Copy git submodule with deployment files (if needed for config generation)
# Note: Submodule must be initialized before building the image
COPY ./olympus-v3/deployments ./olympus-v3/deployments

# Run Envio codegen to generate TypeScript types and handlers
RUN pnpm envio codegen

# Build TypeScript code
RUN pnpm build

# Expose ports (if running GraphQL server on custom port)
# Default Envio indexer doesn't expose ports, but you can add if needed
# EXPOSE 8081

# Start the indexer
CMD ["pnpm", "envio", "start"]
