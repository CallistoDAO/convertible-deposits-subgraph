# GitHub Actions Workflows

## Docker Build and Push

The `docker-build-push.yml` workflow automatically builds and pushes the Docker image to GitHub Container Registry (ghcr.io).

### Triggers

The workflow runs on:
- **Push to `master` or `main` branch** - Builds and pushes with `latest` tag
- **Push tags matching `v*`** - Builds and pushes with semantic version tags
- **Pull requests** - Builds only (no push) for testing
- **Manual trigger** - Can be run manually from GitHub Actions UI

### Image Tags

The workflow creates multiple tags for each build:

- `latest` - Latest build from default branch
- `v1.2.3` - Full semantic version (on tag `v1.2.3`)
- `v1.2` - Major.minor version
- `v1` - Major version
- `master-<sha>` - Branch name with commit SHA
- `pr-123` - Pull request number (for PRs)

### Registry Location

Images are pushed to:
```
ghcr.io/<your-username>/convertible-deposits-subgraph
```

For example:
```
ghcr.io/olympusdao/convertible-deposits-subgraph:latest
ghcr.io/olympusdao/convertible-deposits-subgraph:v1.0.0
ghcr.io/olympusdao/convertible-deposits-subgraph:master-abc123
```

### Pulling the Image

**Public repository (default):**
```bash
docker pull ghcr.io/<owner>/convertible-deposits-subgraph:latest
```

**Private repository:**
```bash
# Login with GitHub Personal Access Token
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin

# Pull the image
docker pull ghcr.io/<owner>/convertible-deposits-subgraph:latest
```

### Using in Docker Compose

Update your `docker-compose.indexer.yaml` to use the pre-built image:

```yaml
services:
  envio-indexer:
    image: ghcr.io/<owner>/convertible-deposits-subgraph:latest
    # Remove the build section
    # build:
    #   context: .
    #   dockerfile: Dockerfile
    depends_on:
      # ... rest of config
```

Then pull and start:
```bash
docker-compose -f docker-compose.indexer.yaml pull
docker-compose -f docker-compose.indexer.yaml up -d
```

### Making the Image Public

By default, GitHub Container Registry images are private. To make it public:

1. Go to https://github.com/users/`<username>`/packages/container/convertible-deposits-subgraph/settings
2. Scroll to "Danger Zone"
3. Click "Change visibility"
4. Select "Public"

### Build Cache

The workflow uses GitHub Actions cache to speed up builds:
- First build: ~3-5 minutes
- Subsequent builds: ~1-2 minutes (with cache)

### Manual Trigger

To manually trigger a build:

1. Go to: `https://github.com/<owner>/convertible-deposits-subgraph/actions`
2. Select "Build and Push Docker Image"
3. Click "Run workflow"
4. Select branch and click "Run workflow"

### Secrets Required

The workflow uses `GITHUB_TOKEN` which is automatically provided by GitHub Actions. No additional secrets needed!

### Monitoring Builds

View build logs:
1. Go to repository → Actions tab
2. Click on the workflow run
3. Expand "Build and push Docker image" step

### Troubleshooting

**Build fails with "submodule not found":**
- Ensure submodules are properly committed: `git submodule update --init --recursive`
- Push changes: `git push --recurse-submodules=on-demand`

**Push fails with "unauthorized":**
- Check repository settings → Actions → General → Workflow permissions
- Ensure "Read and write permissions" is enabled

**Image not appearing in packages:**
- Wait 1-2 minutes after first push
- Check https://github.com/`<owner>`?tab=packages

**Using specific version in production:**
```bash
# Use semantic version (recommended for production)
docker pull ghcr.io/<owner>/convertible-deposits-subgraph:v1.0.0

# Use commit SHA (for testing specific commits)
docker pull ghcr.io/<owner>/convertible-deposits-subgraph:master-abc1234

# Use latest (for development)
docker pull ghcr.io/<owner>/convertible-deposits-subgraph:latest
```

## Creating a Release

To create a new versioned release:

```bash
# Tag the release
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push the tag
git push origin v1.0.0
```

This triggers the workflow and creates images tagged:
- `ghcr.io/<owner>/convertible-deposits-subgraph:v1.0.0`
- `ghcr.io/<owner>/convertible-deposits-subgraph:v1.0`
- `ghcr.io/<owner>/convertible-deposits-subgraph:v1`
- `ghcr.io/<owner>/convertible-deposits-subgraph:latest` (if on default branch)
