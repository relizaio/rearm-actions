# `setup-rearm`

## About
This action, sets up the Rearm CLI, [`rearm`](https://github.com/relizaio/rearm), on GitHub's hosted Actions runners.

This action can be run on `ubuntu-latest`, `windows-latest`, and `macos-latest` GitHub Actions runners, and will install and expose a specified version of the `rearm` CLI on the runner environment.

## Usage

Setup the `rearm` CLI:

```yaml
steps:
- uses: relizaio/setup-rearm-cli-action@1.2.1
```

A specific version of the `rearm` CLI can be installed:

```yaml
steps:
- uses: relizaio/setup-rearm-cli-action@1.2.1
  with:
    version:
      25.12.7
```

## Inputs
The actions supports the following inputs:

- `version`: The version of `rearm` to install, defaulting to `25.12.7`

## Compile
use ncc to compile
```
ncc build index.js
```
