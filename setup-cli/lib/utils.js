const os = require('os');

// Pinned default version of the rearm CLI installed when the caller
// does not override `version` (+ `digest`). Kept in code rather than as
// an action.yaml input default so the override rule can distinguish
// "not set" from "set to the default" — see setup() in ../index.js.
const DEFAULT_VERSION = '26.09.7';

// sha256 of each published install zip for DEFAULT_VERSION, keyed by the
// zip filename. Source: the sha256sums.txt published alongside the
// release. The download is verified against this in setup() before the
// CLI is extracted onto the runner. When a caller overrides `version`
// they must also pass the matching `digest` (both or neither — enforced
// in setup()), so this map only needs to cover the pinned default.
const DIGESTS = {
  'rearm-26.09.7-darwin-amd64.zip':  '58c881743a80e1c4e44ecb7d4cecab88819355582fdcc353d5a6a7faf07f2704',
  'rearm-26.09.7-darwin-arm64.zip':  'f4245f3bb39a0c70748d25fec1f28ef30613964eba4831810f008a5a653c3da7',
  'rearm-26.09.7-freebsd-386.zip':   'aac2b605ba7d6b3d3992c0f8210ae265734456b61d5c82466f7fd8b55a31a8ab',
  'rearm-26.09.7-freebsd-amd64.zip': 'ba5dc4f4eded510d65dc471a30938c1eb4674e14fba291a40282f08f9b92b06e',
  'rearm-26.09.7-freebsd-arm.zip':   'de853869a6905002f67a59c76625802219b0045bc168fa8ac304bf9e03ff936d',
  'rearm-26.09.7-linux-386.zip':     '0c8455f3f37429bfa2783c1100b82e275562fa02cbbd919ddbdffcd0e271f12c',
  'rearm-26.09.7-linux-amd64.zip':   'b4d54e7a02d10b1db645f34f234624d611078e463a8848e2bc9064073043d981',
  'rearm-26.09.7-linux-arm.zip':     '45eb89ee8b32695512c4574a34f7cd66074f51ac497babb89c3d85d80acaaeea',
  'rearm-26.09.7-linux-arm64.zip':   'd9bf293ed4e2941b52d442d2409667d6b3d4693d3ac234115a4aceac9412fd6c',
  'rearm-26.09.7-openbsd-386.zip':   'e07a81770e795ba2992c33cb9b08ae19fde4897f393cbd9737b7f26c12cab503',
  'rearm-26.09.7-openbsd-amd64.zip': 'd0407b30da5bb9bb11a759fb3938366fb05b5bceee60a98cc57acaa49364c54b',
  'rearm-26.09.7-solaris-amd64.zip': 'f81f75a3a906b46ecbb422a50fe0f65a5497516f9b34863af6db49288ae4a5cb',
  'rearm-26.09.7-windows-386.zip':   '3576e784713559f6852ec8f68b09b47ea0e1cfc6483a8e416d863e569d75b996',
  'rearm-26.09.7-windows-amd64.zip': '19676def106d83c32b8161cec8442c1120e70f6fd94cdf2ff694770b118c780b',
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
