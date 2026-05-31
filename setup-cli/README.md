# `setup-rearm`

## About
This action, sets up the Rearm CLI, [`rearm`](https://github.com/relizaio/rearm), on GitHub's hosted Actions runners.

This action can be run on `ubuntu-latest`, `windows-latest`, and `macos-latest` GitHub Actions runners, and will install and expose a specified version of the `rearm` CLI on the runner environment.

The downloaded CLI zip is verified against a sha256 before it is added to the runner `PATH`. With no inputs, the action installs a pinned default version and checks it against a hardcoded per-platform digest.

## Usage

Setup the `rearm` CLI (pinned default version, digest verified automatically):

```yaml
steps:
- uses: relizaio/rearm-actions/setup-cli@<pinned-sha>
```

A specific version can be installed, but you **must** also supply the matching `digest` — the sha256 of the `rearm-<version>-<os>-<arch>.zip` for the runner's platform (from the release's `sha256sums.txt`). Supplying `version` without `digest` (or `digest` without `version`) fails the action:

```yaml
steps:
- uses: relizaio/rearm-actions/setup-cli@<pinned-sha>
  with:
    version: 26.05.20
    digest: 779659953b95ee8271f64cfdec451a830f9d1116715a3df4b3151ca18846b3f2  # linux-amd64
```

## Inputs
The action supports the following inputs:

- `version`: The version of `rearm` to install. Optional — defaults to a pinned version that is verified against a hardcoded sha256. If set, `digest` must also be set.
- `digest`: The sha256 of the `rearm-<version>-<os>-<arch>.zip` for the runner platform, used to verify the download. Required only when overriding `version`; `version` and `digest` must be set together or not at all.

## Compile
use ncc to compile
```
ncc build index.js
```
