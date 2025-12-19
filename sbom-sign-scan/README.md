# ReARM SBOM Generator Action

GitHub Action that generates SBOMs, performs signing, and runs CodeQL analysis. Outputs artifact JSON for use with the ReARM finalize action.

This action performs SBOM generation and signing, and runs CodeQL analysis. It outputs the generated artifact JSON and PURL for use with the [finalize](../finalize) action.

## Outputs

| Output | Description |
|--------|-------------|
| `scearts` | Source Code Entry artifacts JSON array |
| `odelartsjson` | Output Deliverable artifacts JSON array |
| `purl` | Package URL for the deliverable (only for CONTAINER type) |

## Inputs

### Required

| Input | Description |
|-------|-------------|
| `image_full_name` | Full name of the Docker image with registry prefix |
| `image_digest` | SHA 256 digest of the image artifact |
| `rearm_short_version` | Docker and filesystem safe version from ReARM for this release |
| `rearm_full_version` | Version obtained from ReARM for this release |

### Optional

| Input | Default | Description |
|-------|---------|-------------|
| `deliverable_type` | `CONTAINER` | Type of artifact created by this release [CONTAINER, FILE] |
| `enable_sbom` | `false` | Generates SBOM and stores it along with the artifact |
| `source_code_sbom_type` | `none` | Source code SBOM type: npm, helm, custom, other, none |
| `registry_username` | | Username for image registry |
| `registry_password` | | Password for image registry |
| `registry_host` | | Host for image registry (null for DockerHub) |
| `repo_path` | `.` | Repository path relative to workspace root |
| `enable_public_cosign_sigstore` | `false` | Sign deliverables and SBOMs using public sigstore via cosign |
| `enable_codeql` | `false` | Enable CodeQL analysis |
| `codeql_language` | `none` | Language to analyze with CodeQL, use 'custom' for Dockerfile.sarif |
| `enable_securesbom` | `false` | Enable SecureSBOM signing by ShiftLeftCyber |
| `securesbom_pub_key_id` | | Public key id for SecureSBOM |
| `securesbom_host` | | SecureSBOM host |
| `securesbom_api_key` | | SecureSBOM API key |

## Usage

```yaml
- name: Generate SBOMs
  id: sbom
  uses: relizaio/rearm-actions/sbom-sign-scan@main
  with:
    image_full_name: ${{ env.IMAGE_FULL_NAME }}
    image_digest: ${{ env.IMAGE_DIGEST }}
    rearm_short_version: ${{ steps.init.outputs.short_version }}
    rearm_full_version: ${{ steps.init.outputs.full_version }}
    enable_sbom: 'true'
    source_code_sbom_type: 'npm'
    registry_username: ${{ secrets.DOCKER_USERNAME }}
    registry_password: ${{ secrets.DOCKER_PASSWORD }}
    enable_public_cosign_sigstore: 'true'
    enable_codeql: 'true'
    codeql_language: 'javascript'

- name: Finalize Release
  uses: relizaio/rearm-actions/finalize@main
  with:
    rearm_api_id: ${{ secrets.REARM_API_ID }}
    rearm_api_key: ${{ secrets.REARM_API_KEY }}
    image_full_name: ${{ env.IMAGE_FULL_NAME }}
    image_digest: ${{ env.IMAGE_DIGEST }}
    rearm_build_start: ${{ steps.init.outputs.build_start }}
    rearm_short_version: ${{ steps.init.outputs.short_version }}
    rearm_full_version: ${{ steps.init.outputs.full_version }}
    rearm_build_lifecycle: 'ASSEMBLED'
    scearts: ${{ steps.sbom.outputs.scearts }}
    odelartsjson: ${{ steps.sbom.outputs.odelartsjson }}
    purl: ${{ steps.sbom.outputs.purl }}
```

## Source Code SBOM Types

- `npm` - Uses cyclonedx-npm for Node.js projects
- `helm` - Uses cdxgen for Helm charts
- `other` - Uses cdxgen with auto-detection
- `custom` - Builds Dockerfile.sbom, expects output in /sbom/sbom.json
- `none` - Skip source code SBOM generation

## CodeQL Languages

Supports standard CodeQL languages (javascript, python, java, etc.) or use `custom` to build Dockerfile.sarif with expected output in /sarif/results.sarif.

## PURL Generation

For `CONTAINER` deliverable type, this action generates a Package URL (PURL) using the `url2purl-cli` tool. The PURL is output for use with the finalize action to set deliverable identifiers.
