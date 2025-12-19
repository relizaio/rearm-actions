# ReARM Actions

A collection of GitHub Actions for integrating with [ReARM](https://rearmhq.com) - Release Automation and Release Management platform.

## Actions

This repository contains composable actions that work together to manage the complete release lifecycle:

| Action | Description |
|--------|-------------|
| [setup-cli](./setup-cli) | Install the ReARM CLI on GitHub Actions runners |
| [initialize](./initialize) | Initialize ReARM release flow - checks for changes, creates pending releases, syncs branches |
| [sbom-sign-scan](./sbom-sign-scan) | Generate SBOMs, perform signing, and run CodeQL analysis |
| [finalize](./finalize) | Submit release metadata and finalize the release on ReARM |

## Quick Start

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
        uses: relizaio/rearm-actions/setup-cli@main

      # Step 1: Initialize release
      - name: Initialize ReARM Release
        id: init
        uses: relizaio/rearm-actions/initialize@main
        with:
          rearm_api_key: ${{ secrets.REARM_API_KEY }}
          rearm_api_id: ${{ secrets.REARM_API_ID }}

      # Step 2: Build (only if changes detected)
      - name: Build and Push Docker Image
        if: steps.init.outputs.do_build == 'true'
        id: build
        run: |
          docker build -t myregistry/myimage:${{ steps.init.outputs.short_version }} .
          docker push myregistry/myimage:${{ steps.init.outputs.short_version }}
          echo "IMAGE_DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' myregistry/myimage:${{ steps.init.outputs.short_version }} | cut -d'@' -f2)" >> $GITHUB_OUTPUT

      # Step 3: Generate SBOMs (optional)
      - name: Generate SBOMs
        if: steps.init.outputs.do_build == 'true'
        id: sbom
        uses: relizaio/rearm-actions/sbom-sign-scan@main
        with:
          image_full_name: myregistry/myimage
          image_digest: ${{ steps.build.outputs.IMAGE_DIGEST }}
          rearm_short_version: ${{ steps.init.outputs.short_version }}
          rearm_full_version: ${{ steps.init.outputs.full_version }}
          enable_sbom: 'true'
          source_code_sbom_type: 'npm'
          registry_username: ${{ secrets.DOCKER_USERNAME }}
          registry_password: ${{ secrets.DOCKER_PASSWORD }}

      # Step 4: Finalize release
      - name: Finalize Release
        if: steps.init.outputs.do_build == 'true'
        uses: relizaio/rearm-actions/finalize@main
        with:
          rearm_api_id: ${{ secrets.REARM_API_ID }}
          rearm_api_key: ${{ secrets.REARM_API_KEY }}
          image_full_name: myregistry/myimage
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

## Workflow Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Initialize    │────▶│  Build & SBOM   │────▶│    Finalize     │
│                 │     │                 │     │                 │
│ • Check changes │     │ • Build image   │     │ • Add release   │
│ • Get version   │     │ • Generate SBOM │     │ • Finalize      │
│ • Sync branches │     │ • Sign & scan   │     │ • Set status    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   do_build=true          scearts, purl           Release complete
   full_version          odelartsjson
   short_version
   commit_list
   sce_* outputs
```

## Prerequisites

- **ReARM CLI**: Use the `setup-cli` action to install it, or pre-install and make available as `rearm` command
- **jq**: Required for JSON parsing
- **Git history**: Use `fetch-depth: 0` in checkout for full history (required for change detection and branch sync)

## Action Details

### [Setup CLI](./setup-cli)

Installs the ReARM CLI (`rearm`) on GitHub Actions runners.

**Key inputs:**
- `version` - Version of ReARM CLI to install (default: `25.12.7`)

### [Initialize](./initialize/README.md)

Detects changes since the last release, creates a pending release if needed, and synchronizes branches with ReARM.

**Key outputs:**
- `do_build` - Whether a build is needed
- `full_version` / `short_version` - Version strings
- `build_start` - Build start timestamp
- `commit_list`, `sce_commit`, `sce_commit_message`, `sce_commit_date`, `sce_vcs_uri` - SCE data for finalize

### [SBOM Sign Scan](./sbom-sign-scan/README.md)

Generates SBOMs, performs signing (cosign/SecureSBOM), and runs CodeQL analysis.

**Key outputs:**
- `scearts` - Source Code Entry artifacts JSON
- `odelartsjson` - Output Deliverable artifacts JSON
- `purl` - Package URL for CONTAINER type

### [Finalize](./finalize/README.md)

Submits release metadata to ReARM and optionally finalizes the release.

**Key inputs:**
- SCE data from initialize action
- Artifact JSON from sbom-sign-scan action
- Build lifecycle (`DRAFT`, `ASSEMBLED` or `REJECTED`)

## Minimal Example (Without SBOM)

```yaml
- name: Setup ReARM CLI
  uses: relizaio/rearm-actions/setup-cli@main

- name: Initialize
  id: init
  uses: relizaio/rearm-actions/initialize@main
  with:
    rearm_api_key: ${{ secrets.REARM_API_KEY }}
    rearm_api_id: ${{ secrets.REARM_API_ID }}

- name: Build
  if: steps.init.outputs.do_build == 'true'
  run: |
    docker build -t myimage:${{ steps.init.outputs.short_version }} .
    docker push myimage:${{ steps.init.outputs.short_version }}

- name: Finalize
  if: steps.init.outputs.do_build == 'true'
  uses: relizaio/rearm-actions/finalize@main
  with:
    rearm_api_id: ${{ secrets.REARM_API_ID }}
    rearm_api_key: ${{ secrets.REARM_API_KEY }}
    image_full_name: myimage
    rearm_build_start: ${{ steps.init.outputs.build_start }}
    rearm_short_version: ${{ steps.init.outputs.short_version }}
    rearm_full_version: ${{ steps.init.outputs.full_version }}
    rearm_build_lifecycle: 'ASSEMBLED'
    commit_list: ${{ steps.init.outputs.commit_list }}
    sce_commit: ${{ steps.init.outputs.sce_commit }}