const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const { getDownloadObject, getExpectedDigest, DEFAULT_VERSION } = require('./lib/utils');

// Compute the sha256 of a file as a lowercase hex string.
function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

// Normalize a user-supplied or pinned digest for comparison: lowercase,
// strip an optional "sha256:" prefix and surrounding whitespace.
function normalizeDigest(d) {
  return (d || '').trim().toLowerCase().replace(/^sha256:/, '');
}

async function setup() {
  try {
    // Create /tmp/reliza directory
    const relizaDir = '/tmp/reliza';
    if (!fs.existsSync(relizaDir)) {
      fs.mkdirSync(relizaDir, { recursive: true });
      core.info(`Created directory: ${relizaDir}`);
    }

    const versionInput = (core.getInput('version') || '').trim();
    const digestInput = (core.getInput('digest') || '').trim();

    // Override rule: `version` and `digest` are all-or-nothing. We won't
    // install an unverified custom build (version without digest), and a
    // digest with no version has nothing to pin. Set both or neither.
    if (versionInput && !digestInput) {
      throw new Error(
        "'version' override requires a matching 'digest' input — the sha256 of " +
        "rearm-<version>-<os>-<arch>.zip for this runner's platform. Refusing to " +
        'install an unverified rearm CLI build.'
      );
    }
    if (digestInput && !versionInput) {
      throw new Error(
        "'digest' override requires a matching 'version' input. Set both 'version' " +
        "and 'digest' together, or neither (to use the pinned default)."
      );
    }

    // Resolve the version to install and the sha256 to verify against.
    // No override → pinned DEFAULT_VERSION + its hardcoded per-platform
    // digest. Override → the caller's version + their supplied digest.
    let version;
    let expectedDigest;
    if (versionInput) {
      version = versionInput;
      expectedDigest = normalizeDigest(digestInput);
    } else {
      version = DEFAULT_VERSION;
    }

    // Download the specific version of the tool, as a zipball
    const download = getDownloadObject(version);

    if (!versionInput) {
      expectedDigest = normalizeDigest(getExpectedDigest(download.assetName));
      if (!expectedDigest) {
        throw new Error(
          `No pinned sha256 for ${download.assetName} (default version ${version}). ` +
          "This runner's OS/arch is not covered by the pinned digest set — pin a " +
          "'version' and matching 'digest' explicitly to install on this platform."
        );
      }
    }

    const pathToTarball = await tc.downloadTool(download.url);

    // Verify the download against the expected sha256 BEFORE extracting.
    const actualDigest = sha256File(pathToTarball);
    if (actualDigest !== expectedDigest) {
      throw new Error(
        `Digest mismatch for ${download.url}: expected sha256 ${expectedDigest}, ` +
        `got ${actualDigest}. Refusing to use the download.`
      );
    }
    core.info(`Verified rearm CLI ${version} (${download.assetName}) against sha256 ${actualDigest}`);

    // Extract the tarball/zipball onto host runner
    const extract = tc.extractZip;
    const pathToCLI = await extract(pathToTarball);

    // Expose the tool by adding it to the PATH
    core.addPath(pathToCLI);
  } catch (e) {
    core.setFailed(e);
  }
}

module.exports = setup

if (require.main === module) {
  setup();
}
