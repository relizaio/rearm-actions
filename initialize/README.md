# ReARM Initialize Action

GitHub Action to initialize ReARM release flow. This action checks for changes since the last release, creates a pending release if needed, and synchronizes branches with ReARM.

## Features

- Detects changes since the last release using git diff
- Creates pending releases with automatic or manual versioning
- Synchronizes branch information with ReARM
- Supports component creation on-the-fly
- Works with monorepos via `repo_path` parameter
- Outputs SCE (Source Code Entry) data for use with the finalize action

## Prerequisites

- ReARM CLI must be pre-installed and available as `rearm` command
- `jq` must be available for JSON parsing
- Repository must be checked out (preferably with `fetch-depth: 0` for full history)

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `rearm_api_key` | ReARM API Key | Yes | - |
| `rearm_api_id` | ReARM API Key ID | Yes | - |
| `rearm_api_url` | ReARM API URL | No | `https://demo.rearmhq.com` |
| `repo_path` | Repository path relative to workspace root | No | `.` |
| `branch` | Branch name (defaults to current branch) | No | `${{ github.ref }}` |
| `version` | Version to use (if not provided, obtained from ReARM) | No | - |
| `component` | Component UUID | No | - |
| `create_component` | Create component if it doesn't exist | No | `false` |
| `create_component_version_schema` | Version schema for new component | No | `semver` |
| `create_component_branch_version_schema` | Branch version schema for new component | No | `semver` |
| `allow_rebuild` | Allow rebuild of existing version | No | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `do_build` | Whether a build is needed (`true` or `false`) |
| `last_commit` | Last commit from previous release |
| `full_version` | Full version string |
| `short_version` | Docker-tag-safe version string |
| `build_start` | Build start timestamp (ISO 8601) |
| `commit_list` | Base64 encoded list of commits for SCE (for finalize action) |
| `sce_commit` | SCE commit hash (for finalize action) |
| `sce_commit_message` | SCE commit message (for finalize action) |
| `sce_commit_date` | SCE commit date (for finalize action) |
| `sce_vcs_uri` | SCE VCS URI (for finalize action) |

## Environment Variables

The action also sets the following environment variables for subsequent steps:

- `REARM_DO_BUILD` - Whether a build is needed
- `REARM_LAST_COMMIT` - Last commit from previous release
- `REARM_FULL_VERSION` - Full version string
- `REARM_SHORT_VERSION` - Docker-tag-safe version string
- `REARM_BUILD_START` - Build start timestamp
- `REARM_BUILD_LIFECYCLE` - Set to `REJECTED` initially (for failure handling)

## Usage

### Basic Usage

```yaml
name: Build and Release

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for full git history

      - name: Setup ReARM CLI
        # Add your ReARM CLI installation step here

      - name: Initialize ReARM Release
        id: init
        uses: relizaio/rearm-actions/initialize@main
        with:
          rearm_api_key: ${{ secrets.REARM_API_KEY }}
          rearm_api_id: ${{ secrets.REARM_API_ID }}

      - name: Build
        if: steps.init.outputs.do_build == 'true'
        run: |
          echo "Building version ${{ steps.init.outputs.full_version }}"
          # Your build commands here
```

### With Component UUID

```yaml
      - name: Initialize ReARM Release
        id: init
        uses: relizaio/rearm-actions/initialize@main
        with:
          rearm_api_key: ${{ secrets.REARM_API_KEY }}
          rearm_api_id: ${{ secrets.REARM_API_ID }}
          component: "your-component-uuid-here"
```

### With Manual Version

```yaml
      - name: Initialize ReARM Release
        id: init
        uses: relizaio/rearm-actions/initialize@main
        with:
          rearm_api_key: ${{ secrets.REARM_API_KEY }}
          rearm_api_id: ${{ secrets.REARM_API_ID }}
          version: "1.2.3"
```

### Auto-Create Component

```yaml
      - name: Initialize ReARM Release
        id: init
        uses: relizaio/rearm-actions/initialize@main
        with:
          rearm_api_key: ${{ secrets.REARM_API_KEY }}
          rearm_api_id: ${{ secrets.REARM_API_ID }}
          create_component: "true"
          create_component_version_schema: "semver"
```

### Monorepo Usage

```yaml
      - name: Initialize ReARM Release for Service A
        id: init-service-a
        uses: relizaio/rearm-actions/initialize@main
        with:
          rearm_api_key: ${{ secrets.REARM_API_KEY }}
          rearm_api_id: ${{ secrets.REARM_API_ID }}
          repo_path: "services/service-a"
          component: "service-a-component-uuid"
```

### Using Environment Variables

```yaml
      - name: Initialize ReARM Release
        id: init
        uses: relizaio/rearm-actions/initialize@main
        with:
          rearm_api_key: ${{ secrets.REARM_API_KEY }}
          rearm_api_id: ${{ secrets.REARM_API_ID }}

      - name: Use Version in Subsequent Steps
        if: env.REARM_DO_BUILD == 'true'
        run: |
          echo "Full version: $REARM_FULL_VERSION"
          echo "Short version: $REARM_SHORT_VERSION"
          docker build -t myimage:$REARM_SHORT_VERSION .
```

## How It Works

1. **Check for Changes**: Calls `rearm getlatestrelease` to get the last release commit, then uses `git diff` to check for changes since that commit.

2. **Create Pending Release**: If changes are detected:
   - If `version` input is provided: Uses `rearm addrelease` with the specified version
   - If no version provided: Uses `rearm getversion` to obtain a version from ReARM

3. **Sync Branches**: Calls `rearm syncbranches` to synchronize branch information with ReARM.

4. **Set Outputs**: Sets both step outputs and environment variables for use in subsequent steps, including SCE data for the finalize action.

## Notes

- Use `fetch-depth: 0` in your checkout step to ensure full git history is available
- The action sets `REARM_BUILD_LIFECYCLE=REJECTED` initially - update this to `DRAFT` or `ASSEMBLED` before calling the finalize action on success
- If no previous release exists, the action assumes a build is needed
- Pass the SCE outputs (`commit_list`, `sce_commit`, `sce_commit_message`, `sce_commit_date`, `sce_vcs_uri`) to the finalize action