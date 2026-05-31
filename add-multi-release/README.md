# ReARM Add Multi-Release

Submits several ReARM releases in **one all-or-nothing batch** via
`rearm addreleases`. Unlike calling the single-release flow once per
component, the backend fires product auto-integration only **once per
affected feature set** for the whole batch (deduped) — use this when a CI
run builds several component releases at once and you want a single product
auto-integrate.

Assumes the `rearm` CLI is already on `PATH` — run
[`setup-cli`](../setup-cli) first.

Unlike `initialize` / `sbom-sign-scan` / `finalize`, this is a **standalone
action**: it derives nothing from the GitHub context and builds no metadata
for you — you hand it the complete batch JSON. You can still run `initialize`
and/or `sbom-sign-scan` for individual components to produce their versions,
SBOMs and artifact JSON, then assemble those pieces into the batch array
yourself; the array itself is always caller-built.

Provide the batch as inline `releases` JSON **or** point `infile` at a file
on disk (if both are set, `infile` wins). Each element of the array is shaped
exactly like the single-release `addrelease` input (`ReleaseInputProg`) —
`component` (or `vcsUri` + `repoPath`), `branch`, `version`, `lifecycle`,
optional `sourceCodeEntry`, `outboundDeliverables`, `artifacts`, plus
per-release flags such as `rebuildRelease` and `createComponentIfMissing`.
Artifacts reference local files via their `filePath` field (resolved relative
to `working_directory`); the CLI reads and uploads each file — you do not
embed file bytes in the JSON.

Two distinct "paths" are in play, do not conflate them: `working_directory`
is the **action input** — the process directory the CLI runs from, where
`filePath`s resolve — whereas `repoPath` is a **per-release JSON field** that
identifies each component inside a monorepo (paired with `vcsUri`). One batch
can span many components, each with its own `repoPath`.

For exact JSON shape, refer to ReARM CLI documentation [here](https://github.com/relizaio/rearm-cli/tree/b2c1bf76865622080feca0266ab29d9bcf5da9a4#20-use-case-send-batched-release-metadata-to-rearm).

## Examples

### Inline JSON

A monorepo batch passed inline — two components identified by `vcsUri` +
`repoPath`, each allowed to rebuild on a CI rerun (`rebuildRelease`) and
carrying a CycloneDX SBOM read from the checked-out workspace:

```yaml
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: relizaio/rearm-actions/setup-cli@main

      - name: Submit release batch
        uses: relizaio/rearm-actions/add-multi-release@main
        with:
          rearm_api_id: ${{ secrets.REARM_API_ID }}
          rearm_api_key: ${{ secrets.REARM_API_KEY }}
          rearm_api_url: ${{ secrets.REARM_API_URL }}
          releases: |
            [
              {
                "vcsUri": "github.com/acme/monorepo",
                "repoPath": "services/widget",
                "branch": "main",
                "version": "1.4.0",
                "lifecycle": "ASSEMBLED",
                "rebuildRelease": true,
                "sourceCodeEntry": { "commit": "9f1c2ab", "uri": "github.com/acme/monorepo", "type": "git" },
                "artifacts": [
                  { "displayIdentifier": "widget-sbom", "type": "BOM", "bomFormat": "CYCLONEDX", "filePath": "./services/widget/sbom.cdx.json" }
                ]
              },
              {
                "vcsUri": "github.com/acme/monorepo",
                "repoPath": "services/gadget",
                "branch": "main",
                "version": "2.1.0",
                "lifecycle": "ASSEMBLED",
                "rebuildRelease": true,
                "sourceCodeEntry": { "commit": "9f1c2ab", "uri": "github.com/acme/monorepo", "type": "git" },
                "artifacts": [
                  { "displayIdentifier": "gadget-sbom", "type": "BOM", "bomFormat": "CYCLONEDX", "filePath": "./services/gadget/sbom.cdx.json" }
                ]
              }
            ]
```

### From a file (`infile`)

Larger batches are easier to assemble on disk. This one mixes an existing
component (by UUID, rebuilt on rerun) with a new one auto-created from its
`vcsUri` + `repoPath` (`createComponentIfMissing`), and attaches a container
deliverable plus its SBOM. `filePath`s resolve against `working_directory`
(the checked-out workspace):

```yaml
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: relizaio/rearm-actions/setup-cli@main

      - name: Write release batch
        run: |
          mkdir -p reliza
          cat > reliza/batch.json <<'EOF'
          [
            {
              "component": "5a813e39-c453-444e-85cd-b618b7de6108",
              "branch": "main",
              "version": "1.4.0",
              "lifecycle": "ASSEMBLED",
              "rebuildRelease": true,
              "artifacts": [
                { "displayIdentifier": "widget-sbom", "type": "BOM", "bomFormat": "CYCLONEDX", "filePath": "./services/widget/sbom.cdx.json" }
              ]
            },
            {
              "vcsUri": "github.com/acme/monorepo",
              "repoPath": "services/gizmo",
              "branch": "main",
              "version": "0.1.0",
              "lifecycle": "ASSEMBLED",
              "createComponentIfMissing": true,
              "createComponentName": "gizmo",
              "createComponentVersionSchema": "semver",
              "outboundDeliverables": [
                {
                  "displayIdentifier": "registry.acme.com/gizmo:0.1.0",
                  "type": "CONTAINER",
                  "softwareMetadata": { "packageType": "OCI", "digests": ["sha256:abc123"] },
                  "artifacts": [
                    { "displayIdentifier": "gizmo-image-sbom", "type": "BOM", "bomFormat": "CYCLONEDX", "filePath": "./services/gizmo/image-sbom.cdx.json" }
                  ]
                }
              ]
            }
          ]
          EOF

      - name: Submit release batch
        uses: relizaio/rearm-actions/add-multi-release@main
        with:
          rearm_api_id: ${{ secrets.REARM_API_ID }}
          rearm_api_key: ${{ secrets.REARM_API_KEY }}
          rearm_api_url: ${{ secrets.REARM_API_URL }}
          infile: reliza/batch.json
```

## Inputs

- `rearm_api_id` (required) — ReARM API Key ID.
- `rearm_api_key` (required) — ReARM API Key.
- `rearm_api_url` (required) — ReARM API URL.
- `releases` — JSON array of release objects. Provide this **or** `infile`.
- `infile` — path (relative to `working_directory`) to a JSON file with the
  array; takes precedence over `releases`.
- `stripbom` — set to `false` to disable BOM stripping for digest matching;
  applied to every artifact in the batch. Default `true`.
- `working_directory` — process directory the CLI runs from; the base every
  artifact `filePath` (and a relative `infile`) resolves against. **Not** a
  per-release repo path — that's the `repoPath` field inside each JSON element
  (paired with `vcsUri`) for monorepo components. Default: the workspace
  root (`.`).
