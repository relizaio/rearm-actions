const os = require('os');

// Pinned default version of the rearm CLI installed when the caller
// does not override `version` (+ `digest`). Kept in code rather than as
// an action.yaml input default so the override rule can distinguish
// "not set" from "set to the default" — see setup() in ../index.js.
const DEFAULT_VERSION = '26.09.1';

// sha256 of each published install zip for DEFAULT_VERSION, keyed by the
// zip filename. Source: the sha256sums.txt published alongside the
// release. The download is verified against this in setup() before the
// CLI is extracted onto the runner. When a caller overrides `version`
// they must also pass the matching `digest` (both or neither — enforced
// in setup()), so this map only needs to cover the pinned default.
const DIGESTS = {
  'rearm-26.09.1-darwin-amd64.zip':  '6bc307fcf01bdccf900a6cc90716f29d004b83250ac8c70b3b1386d9ab46353b',
  'rearm-26.09.1-darwin-arm64.zip':  '296c41599d739ccba6d5ea595f5a6c7a3e91a6f3b93f0c5519673c87bc1712fa',
  'rearm-26.09.1-freebsd-386.zip':   '3b9b1a77533c1a8260950d353a4b4d923156f0b9f250acb10da2659d2a1f6132',
  'rearm-26.09.1-freebsd-amd64.zip': '46b06ef8035658f7d123fc0eb5ba4d5cf14e5f0f86deba130b0623a3d4d171b6',
  'rearm-26.09.1-freebsd-arm.zip':   '23b8e1f971ea362643f8508c6f1aefaca36f92ab80125684bfd0b860e4cd38b7',
  'rearm-26.09.1-linux-386.zip':     '445b084eeb3c704624a085026fd3eb9965546cae23adba67d97fbddb94c200ac',
  'rearm-26.09.1-linux-amd64.zip':   '9b44da897b80f9546bb005a2c1ca6a31bfda641c2b6cc86c21b129015df0446a',
  'rearm-26.09.1-linux-arm.zip':     '6624650d6c0fe5fae04b6fe4cc943071b3c1577c2e6ee9a0c056337230b422d1',
  'rearm-26.09.1-linux-arm64.zip':   '98dfbae123247634efcf9a62ec9f98c258c87d01e777094dfc013190a138cde1',
  'rearm-26.09.1-openbsd-386.zip':   'ed3387b8e00334143cc2b23451d92d7101cbcc05b10a9d2f04385ad2b9f90912',
  'rearm-26.09.1-openbsd-amd64.zip': '88ec3e19074bf8cfb84fe194f2345a3cb21c60f8c0050154733768cc06bf4f16',
  'rearm-26.09.1-solaris-amd64.zip': 'b3870c2143718aa3f295d75fa23a0df6a581bf0b4371ad6742b04fa1fd10bba6',
  'rearm-26.09.1-windows-386.zip':   '258b153f59a3f1fd2f266ea21beeaa88f8cd60a9c19a60249b153266a63502aa',
  'rearm-26.09.1-windows-amd64.zip': 'f78f03bacec640f9349beca7acf0c3dd7699daa91f23ba7b0c4d661e69eeebf8',
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
