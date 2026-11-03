const os = require('os');

// Pinned default version of the rearm CLI installed when the caller
// does not override `version` (+ `digest`). Kept in code rather than as
// an action.yaml input default so the override rule can distinguish
// "not set" from "set to the default" — see setup() in ../index.js.
const DEFAULT_VERSION = '26.10.17';

// sha256 of each published install zip for DEFAULT_VERSION, keyed by the
// zip filename. Source: the sha256sums.txt published alongside the
// release. The download is verified against this in setup() before the
// CLI is extracted onto the runner. When a caller overrides `version`
// they must also pass the matching `digest` (both or neither — enforced
// in setup()), so this map only needs to cover the pinned default.
const DIGESTS = {
  'rearm-26.10.17-darwin-amd64.zip':  'eb939725fdd98ee794ff4984aecdc9767ea38be5f0aabe1d4e37e0a706bd3deb',
  'rearm-26.10.17-darwin-arm64.zip':  'b5940a73d14b31fcda4755e5e5ccdc045d6821d2af5d4ba3707865212e061036',
  'rearm-26.10.17-freebsd-386.zip':   'b29e025bae84fa5612229a0682734cdf6e18a1eb4b57012fdd356cc0356004ba',
  'rearm-26.10.17-freebsd-amd64.zip': '3542c43306b94931443e491655e3e99c4d29af6a996c1f7524ed28392d708baa',
  'rearm-26.10.17-freebsd-arm.zip':   '9803ad76485144be1b1aee88ae7ff64bbef9987fdf0c7e7618ff96ed209f6f0b',
  'rearm-26.10.17-linux-386.zip':     '76f690a909bfa6f026c78f24b42d12c0506219305acb048d03e23164599b8421',
  'rearm-26.10.17-linux-amd64.zip':   'c7990f604381dd994c6aae57022aa21d1cbcc5b25f0b09b5d51348f3af790315',
  'rearm-26.10.17-linux-arm.zip':     '0c93d4f53b10c2e731b0c2974eef1cfcbd39febb5058fcebe7b8f6e31d292562',
  'rearm-26.10.17-linux-arm64.zip':   '3d6352f166df9787230da567d8129973bb44d586a46d201013693f44b7589287',
  'rearm-26.10.17-openbsd-386.zip':   '966f0bbae303c6ed1e3e7caabef82ac7611e147bc22934db1c1f01db0aa2b50b',
  'rearm-26.10.17-openbsd-amd64.zip': '76fff57d97e0355e628694eaa3f788e928770205cb1ba224af00f458747f2db4',
  'rearm-26.10.17-solaris-amd64.zip': '46b82545afea8551a3079079b5e9dea9cb9b58e862df9660517616dd750af6b6',
  'rearm-26.10.17-windows-386.zip':   '61b2861e85aa9ee9ce1bc19c7d4eded1f3e7f45ded6c264ed7f0f5f4155abbb1',
  'rearm-26.10.17-windows-amd64.zip': '2cb722abd233ef70d9a17fe769990a95001612bc170a5dfb0c5db9a43825cf69',
};

// arch in [arm, x32, x64...] (https://nodejs.org/api/os.html#os_os_arch)
// return value in [amd64, 386, arm]
function mapArch(arch) {
  const mappings = {
    x32: '386',
    x64: 'amd64'
  };
  return mappings[arch] || arch;
}

// os in [darwin, linux, win32...] (https://nodejs.org/api/os.html#os_os_platform)
// return value in [darwin, linux, windows]
function mapOS(os) {
  const mappings = {
    win32: 'windows'
  };
  return mappings[os] || os;
}

function getDownloadObject(version) {
  const platform = os.platform();
  const filename = `rearm-${ version }-${ mapOS(platform) }-${ mapArch(os.arch()) }`;
  const extension = 'zip';
  const assetName = `${ filename }.${ extension }`;
  const binPath = filename;
  const url = `https://cdn.rearmhq.com/rearm-download/${ version }/${ assetName }`;
  return {
    url,
    binPath,
    assetName
  };
}

// Expected sha256 for one of DEFAULT_VERSION's published zips, by
// filename. Returns undefined when the runner's OS/arch isn't in the
// pinned set (setup() turns that into a clear failure).
function getExpectedDigest(assetName) {
  return DIGESTS[assetName];
}

module.exports = { getDownloadObject, getExpectedDigest, DEFAULT_VERSION };
