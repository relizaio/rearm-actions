# Rearm Finalize Action

GitHub Action to submit release metadata and finalize a release on Rearm. This action accepts artifact JSON from the sbom-sign-scan action and SCE data from the initialize action.

## Features

- Submits release metadata to ReARM using `rearm addrelease`
- Optionally finalizes the release using `rearm releasefinalizer`
- Accepts SBOM artifacts from sbom-sign-scan action
- Accepts SCE (Source Code Entry) data from initialize action
- Supports both CONTAINER and FILE deliverable types
- Handles empty artifact JSON gracefully

## Prerequisites

- ReARM CLI must be pre-installed and available as `rearm` command
- `jq` must be available for JSON parsing

## Inputs

### Required

| Input | Description |
|-------|-------------|
| `rearm_api_id` | ReARM API ID |
| `rearm_api_key` | ReARM API KEY |
| `image_full_name` | Full name of the Docker image with registry prefix |
| `rearm_build_start` | Build start time (from initialize action) |
| `rearm_short_version` | Docker and filesystem safe version from ReARM |
| `rearm_full_version` | Version obtained from ReARM for this release |
| `rearm_build_lifecycle` | Build lifecycle - `DRAFT`, `ASSEMBLED` or `REJECTED` |

### Optional

| Input | Default | Description |
|-------|---------|-------------|
| `rearm_api_url` | `https://demo.rearmhq.com` | ReARM API URL |
| `image_digest` | | SHA 256 digest of the image artifact |
| `deliverable_type` | `CONTAINER` | Type of artifact [CONTAINER, FILE] |
| `commit_list` | | Base64 encoded list of commits (from initialize action) |
| `sce_commit` | | SCE commit hash (from initialize action) |
| `sce_commit_message` | | SCE commit message (from initialize action) |
| `sce_commit_date` | | SCE commit date (from initialize action) |
| `sce_vcs_uri` | | SCE VCS URI (defaults to github.com/${{github.repository}}) |
| `component` | | Component UUID (optional) |
| `finalize_release` | `true` | Finalize the release after adding it |
| `repo_path` | `.` | Repository path relative to workspace root |
| `send_sce_data` | `true` | Sends Source Code entry data along with the release |
| `scearts` | | Source Code Entry artifacts JSON (from sbom-sign-scan) |
| `odelartsjson` | | Output Deliverable artifacts JSON (from sbom-sign-scan) |
| `purl` | | Package URL for the deliverable (from sbom-sign-scan) |

## Usage

### Basic Usage with Initialize and SBOM Actions

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
          fetch-depth: 0

      - name: Setup ReARM CLI
        # Add your ReARM CLI installation step here

      - name: Initialize ReARM Release
        id: init
        uses: relizaio/rearm-actions/initialize@main
        with:
          rearm_api_key: ${{ secrets.REARM_API_KEY }}
          rearm_api_id: ${{ secrets.REARM_API_ID }}

      - name: Build and Push Docker Image
        if: steps.init.outputs.do_build == 'true'
        id: build
        run: |
          docker build -t myimage:${{ steps.init.outputs.short_version }} .
          docker push myimage:${{ steps.init.outputs.short_version }}
          echo "IMAGE_DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' myimage:${{ steps.init.outputs.short_version }} | cut -d'@' -f2)" >> $GITHUB_OUTPUT

      - name: Generate SBOMs
        if: steps.init.outputs.do_build == 'true'
        id: sbom
        uses: relizaio/rearm-actions/sbom-sign-scan@main
        with:
          image_full_name: myimage
          image_digest: ${{ steps.build.outputs.IMAGE_DIGEST }}
          rearm_short_version: ${{ steps.init.outputs.short_version }}
          rearm_full_version: ${{ steps.init.outputs.full_version }}
          enable_sbom: 'true'
          source_code_sbom_type: 'npm'
          registry_username: ${{ secrets.DOCKER_USERNAME }}
          registry_password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Finalize Release
        if: steps.init.outputs.do_build == 'true'
        uses: relizaio/rearm-actions/finalize@main
        with:
          rearm_api_id: ${{ secrets.REARM_API_ID }}
          rearm_api_key: ${{ secrets.REARM_API_KEY }}
          image_full_name: myimage
          image_digest: ${{ steps.build.outputs.IMAGE_DIGEST }}
          rearm_build_start: ${{ steps.init.outputs.build_start }}
          rearm_short_version: ${{ steps.init.outputs.short_version }}
          rearm_full_version: ${{ steps.init.outputs.full_version }}
          rearm_build_lifecycle: 'ASSEMBLED'
          commit_list: ${{ steps.init.outputs.commit_list }}
          sce_commit: ${{ steps.init.outputs.sce_commit }}
          sce_commit_message: ${{ steps.init.outputs.sce_commit_message }}
          sce_commit_date: ${{ steps.init.outputs.sce_commit_date }}
          sce_vcs_uri: ${{ steps.init.outputs.sce_vcs_uri }}
          scearts: ${{ steps.sbom.outputs.scearts }}
          odelartsjson: ${{ steps.sbom.outputs.odelartsjson }}
          purl: ${{ steps.sbom.outputs.purl }}
```

### Without SBOM Generation

```yaml
      - name: Finalize Release
        uses: relizaio/rearm-actions/finalize@main
        with:
          rearm_api_id: ${{ secrets.REARM_API_ID }}
          rearm_api_key: ${{ secrets.REARM_API_KEY }}
          image_full_name: myimage
          image_digest: ${{ steps.build.outputs.IMAGE_DIGEST }}
          rearm_build_start: ${{ steps.init.outputs.build_start }}
          rearm_short_version: ${{ steps.init.outputs.short_version }}
          rearm_full_version: ${{ steps.init.outputs.full_version }}
          rearm_build_lifecycle: 'ASSEMBLED'
          commit_list: ${{ steps.init.outputs.commit_list }}
          sce_commit: ${{ steps.init.outputs.sce_commit }}
```

### With Component UUID

```yaml
      - name: Finalize Release
        uses: relizaio/rearm-actions/finalize@main
        with:
          rearm_api_id: ${{ secrets.REARM_API_ID }}
          rearm_api_key: ${{ secrets.REARM_API_KEY }}
          component: "your-component-uuid"
          image_full_name: myimage
          rearm_build_start: ${{ steps.init.outputs.build_start }}
          rearm_short_version: ${{ steps.init.outputs.short_version }}
          rearm_full_version: ${{ steps.init.outputs.full_version }}
          rearm_build_lifecycle: 'ASSEMBLED'
```

### Skip Finalization (Add Release Only)

```yaml
      - name: Add Release Without Finalizing
        uses: relizaio/rearm-actions/finalize@main
        with:
          rearm_api_id: ${{ secrets.REARM_API_ID }}
          rearm_api_key: ${{ secrets.REARM_API_KEY }}
          image_full_name: myimage
          rearm_build_start: ${{ steps.init.outputs.build_start }}
          rearm_short_version: ${{ steps.init.outputs.short_version }}
          rearm_full_version: ${{ steps.init.outputs.full_version }}
          rearm_build_lifecycle: 'ASSEMBLED'
          finalize_release: 'false'
```

## How It Works

1. **Set SCE Data**: If `send_sce_data` is true, adds commit information to the release command using data from the initialize action.

2. **Submit Release**: Calls `rearm addrelease` with:
   - Version and build information
   - Deliverable metadata (ID, type, digest, PURL)
   - SCE artifacts (if provided from sbom-sign-scan)
   - Deliverable artifacts (if provided from sbom-sign-scan)

3. **Finalize Release**: If `finalize_release` is true and the release was created successfully, calls `rearm releasefinalizer` to finalize the release.

4. **Lifecycle Check**: Fails the build if `rearm_build_lifecycle` is `REJECTED`.

## Notes

- Empty artifact JSON arrays are handled gracefully - they won't be passed to the rearm command
- The PURL is only added to deliverable identifiers if provided (typically for CONTAINER type)
- Set `rearm_build_lifecycle` to `REJECTED` to mark a failed build
- The action cleans up temporary files in `/tmp/reliza/` after execution