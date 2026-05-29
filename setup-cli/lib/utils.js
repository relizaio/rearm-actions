const os = require('os');

// Pinned default version of the rearm CLI installed when the caller
// does not override `version` (+ `digest`). Kept in code rather than as
// an action.yaml input default so the override rule can distinguish
// "not set" from "set to the default" — see setup() in ../index.js.
const DEFAULT_VERSION = '26.05.17';

// sha256 of each published install zip for DEFAULT_VERSION, keyed by the
// zip filename. Source: the sha256sums.txt published alongside the
// release. The download is verified against this in setup() before the
// CLI is extracted onto the runner. When a caller overrides `version`
// they must also pass the matching `digest` (both or neither — enforced
// in setup()), so this map only needs to cover the pinned default.
const DIGESTS = {
  'rearm-26.05.17-darwin-amd64.zip':  '9b64c185ac1fd6ddba3702b14c46b6494fd2422f2b343343e3cb90bfe95da68a',
  'rearm-26.05.17-darwin-arm64.zip':  'a5be0e7dbf051a231700ed2620626761a93eaec8a259285aea4315382772054f',
  'rearm-26.05.17-freebsd-386.zip':   '9647ce9a09119cdf202131f997430c6b30efa89662c76c63251003fe6d6c2db0',
  'rearm-26.05.17-freebsd-amd64.zip': '39f62f0ab4457eb5b863b0954ce5ddab47503c92b8b5ab30d640e64d3315a3a4',
  'rearm-26.05.17-freebsd-arm.zip':   '26b0c98a77aebac24d46e0cd1d22c256dcebc275c61cb2e4a056973c4be5f915',
  'rearm-26.05.17-linux-386.zip':     '71e24480b26689201195af913a696f253ee52e556f8dd5e56e31cd268c12af22',
  'rearm-26.05.17-linux-amd64.zip':   'f6b71add8984b5d943a88227d14a3ea7bb5f853b318e1f9cd47c99a90b16c183',
  'rearm-26.05.17-linux-arm.zip':     '1fafefb0b09864acb3cbb889ed585a1a259eb3de9375f6485fc64dae75cf5f04',
  'rearm-26.05.17-linux-arm64.zip':   'eddc80b64cc84831f676f21bb2d95169896722e5bfe60dbfd9897b646e7d9e59',
  'rearm-26.05.17-openbsd-386.zip':   '87a8d84f1064e21669cd6a0871216fab5c0760543e16dec2324883df23c69c1b',
  'rearm-26.05.17-openbsd-amd64.zip': 'b1926909c8032ee4f9b9fb53e8f948e4ff718a3510cbd37da960207a7fc34c79',
  'rearm-26.05.17-solaris-amd64.zip': 'ef38a21b3b7cdb8da3e799816620084cf0802508c843a62dc9731a266873bdf0',
  'rearm-26.05.17-windows-386.zip':   '3f075983f3fd27e30ee68862dffdfcea03a110d881560d9a761d906b05a80a74',
  'rearm-26.05.17-windows-amd64.zip': 'af75ecf2b0d8267d27bacc762cbce9ab7621b962f93373e301c91e24baf2356f',
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
