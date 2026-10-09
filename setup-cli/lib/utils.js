const os = require('os');

// Pinned default version of the rearm CLI installed when the caller
// does not override `version` (+ `digest`). Kept in code rather than as
// an action.yaml input default so the override rule can distinguish
// "not set" from "set to the default" — see setup() in ../index.js.
const DEFAULT_VERSION = '26.10.2';

// sha256 of each published install zip for DEFAULT_VERSION, keyed by the
// zip filename. Source: the sha256sums.txt published alongside the
// release. The download is verified against this in setup() before the
// CLI is extracted onto the runner. When a caller overrides `version`
// they must also pass the matching `digest` (both or neither — enforced
// in setup()), so this map only needs to cover the pinned default.
const DIGESTS = {
  'rearm-26.10.2-darwin-amd64.zip':  '88963d5b2bbf3334dce8785f318868c42efeaee38f1d257b506c13614fb505a7',
  'rearm-26.10.2-darwin-arm64.zip':  'd09cbe6efe0176097f468cdb1809c6aaaae30c25fc22b666f697b16a18a0fb3f',
  'rearm-26.10.2-freebsd-386.zip':   '60d398ebef5aabe9ee10526ce531d4d74285b80fc399b54a284a1a1719699e60',
  'rearm-26.10.2-freebsd-amd64.zip': 'c5b93a3b86eae55af6273d6fdca803041a3a22a48b59c0a84c37639aa6a6b7d0',
  'rearm-26.10.2-freebsd-arm.zip':   'cfaaa043ccb10054458cf867c73670ce0e42a45ccbe68e711e18dcc2bb1e47db',
  'rearm-26.10.2-linux-386.zip':     '188ef7160e317980c0ea323d73e6bf48ebeab4a661a396e5758ec749ee7ced72',
  'rearm-26.10.2-linux-amd64.zip':   'd405c3f6f748925ea1a965cfa4e757c4a35186e4e1134ad86ad38d02d889a16f',
  'rearm-26.10.2-linux-arm.zip':     '4c0e895be8520aca7f967d7371483f787b03c759fc363639f9056196bf634be2',
  'rearm-26.10.2-linux-arm64.zip':   '1bb1e03c91fabf0acf3a11420b5ab529127e6085086c677dee90845e62347717',
  'rearm-26.10.2-openbsd-386.zip':   '943d1a694a7c52443d6e0b0af9874d13e2d6151efa84073c2129ecca0615c3c2',
  'rearm-26.10.2-openbsd-amd64.zip': '8cdf49b47a754d6259a974fe4654c7caacc2119ec83300c2fa7b0c73819779da',
  'rearm-26.10.2-solaris-amd64.zip': '8a28ec72436dac4a7329a1ef62bf4586fdc114696644b8ac020ba4912ef6f79e',
  'rearm-26.10.2-windows-386.zip':   '49f5c9bf899dde60805ac445662e188763cd9ed2abef16a4faf94f6b4dd7b317',
  'rearm-26.10.2-windows-amd64.zip': '0ecc1f47fb53b0498541d08aeaea9fb310c8a5e26419133f66737ccff3ebad99',
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
