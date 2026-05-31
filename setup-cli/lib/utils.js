const os = require('os');

// Pinned default version of the rearm CLI installed when the caller
// does not override `version` (+ `digest`). Kept in code rather than as
// an action.yaml input default so the override rule can distinguish
// "not set" from "set to the default" — see setup() in ../index.js.
const DEFAULT_VERSION = '26.05.20';

// sha256 of each published install zip for DEFAULT_VERSION, keyed by the
// zip filename. Source: the sha256sums.txt published alongside the
// release. The download is verified against this in setup() before the
// CLI is extracted onto the runner. When a caller overrides `version`
// they must also pass the matching `digest` (both or neither — enforced
// in setup()), so this map only needs to cover the pinned default.
const DIGESTS = {
  'rearm-26.05.20-darwin-amd64.zip':  '7bcb9af4a1a57ffeeeecc36fec808ad50ad8ea05cd59b56f95e2bddf1bf03b0e',
  'rearm-26.05.20-darwin-arm64.zip':  '611600bb589448ab786e2706eb634dc74a67448e4c5a9eb34fc3ad53d23ac754',
  'rearm-26.05.20-freebsd-386.zip':   '43a32aa8762ed1c92b12a3d91ac0431d692fa089b5a134e1fe4d805a6a6d3a93',
  'rearm-26.05.20-freebsd-amd64.zip': '8e207e38bdda46c68c7d46346265c86f70b0060118a3c65e61e1a072cc659bd8',
  'rearm-26.05.20-freebsd-arm.zip':   '1b15b284303ea3d1e052e9c05d022c662eba8b3b6b5b49fb191e8917b1cb707d',
  'rearm-26.05.20-linux-386.zip':     '1d436d8b87686087aea68145bea5886f4f8cb03b9d73dbcc03317c0f5c69ec93',
  'rearm-26.05.20-linux-amd64.zip':   '779659953b95ee8271f64cfdec451a830f9d1116715a3df4b3151ca18846b3f2',
  'rearm-26.05.20-linux-arm.zip':     '37fdccf6ea5e2075e842283573f4db6977c856b59ec89380fbcac47ea0064614',
  'rearm-26.05.20-linux-arm64.zip':   'bac3c1ec8677013f6f8790111d1825ac56e3ebc2664e4f4d8ce7bf4e804723e5',
  'rearm-26.05.20-openbsd-386.zip':   '219164a1d28c9d934b5f8d7ebde8aadea9a6619ac0d24895dca24f413903e352',
  'rearm-26.05.20-openbsd-amd64.zip': '942e7ec22ff051e64f0d3a5476dca0e8c3fa12a886a4744da9d8ce5ad24cefa6',
  'rearm-26.05.20-solaris-amd64.zip': '685c0cdb00cd732b7745eb19f8c1aacbc52395f03e7be4d961841085b8b77d33',
  'rearm-26.05.20-windows-386.zip':   '7ed10d6bf7962b8f02ccab512cc426d5eabd9b92b602609c0321990efe67e66e',
  'rearm-26.05.20-windows-amd64.zip': '840b504781ed5f627b34ada958a912f82b307e7b45d46af42b65928bd8bdb700',
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
  const url = `https://d7ge14utcyki8.cloudfront.net/rearm-download/${ version }/${ assetName }`;
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
