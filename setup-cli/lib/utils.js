const os = require('os');

// Pinned default version of the rearm CLI installed when the caller
// does not override `version` (+ `digest`). Kept in code rather than as
// an action.yaml input default so the override rule can distinguish
// "not set" from "set to the default" — see setup() in ../index.js.
const DEFAULT_VERSION = '26.09.5';

// sha256 of each published install zip for DEFAULT_VERSION, keyed by the
// zip filename. Source: the sha256sums.txt published alongside the
// release. The download is verified against this in setup() before the
// CLI is extracted onto the runner. When a caller overrides `version`
// they must also pass the matching `digest` (both or neither — enforced
// in setup()), so this map only needs to cover the pinned default.
const DIGESTS = {
  'rearm-26.09.5-darwin-amd64.zip':  '12729e3f604af6fdf237d148f0df6a189111d91c25e89b85dea078c672955d37',
  'rearm-26.09.5-darwin-arm64.zip':  '9c2fe7ef4066bbbc49302a2d7e2421318464f1ad4092e7251ea90215607c7797',
  'rearm-26.09.5-freebsd-386.zip':   '3c15006d26fd0dbcccbe524666c7058b47720b10a5659afa0dc9b46bdd76475f',
  'rearm-26.09.5-freebsd-amd64.zip': 'e5e09f106f2ebaac82911f1f4943885e266518789b38e700d8ad0f753310911a',
  'rearm-26.09.5-freebsd-arm.zip':   'd6cc2d1a471b698d8a82616040eb49813fd52034b8b412bd69f929e39b8dbfa8',
  'rearm-26.09.5-linux-386.zip':     '728a7a845bf133dd603e54a4079d55d764cff13cd90d0cc42ae421b2669d5853',
  'rearm-26.09.5-linux-amd64.zip':   '9c7dfb305cfd1d651d83715822d30883924bd29bfdf6c5d10769420a70091dae',
  'rearm-26.09.5-linux-arm.zip':     '73bf674db25ff4c2dd59b44a36ced94c1f8cc92f8d00b244af896cbe55aa5257',
  'rearm-26.09.5-linux-arm64.zip':   '730e2cd95bb7e45c09f9e9cf6c5b6106d493ffdf3f0271db4d86b83a408217cc',
  'rearm-26.09.5-openbsd-386.zip':   '4f0809092b4f8b1543323343604f90f6e841b5b19e226a8191067623edad60a3',
  'rearm-26.09.5-openbsd-amd64.zip': '0d22ee281d7ce00dc5da30b9b03d460bb7e3ee87eeaf3c8ca53a38828648f46f',
  'rearm-26.09.5-solaris-amd64.zip': 'c11a5588925b88481c47695f1e6f6ec2588572f71cbeb701f80e65da68dc5806',
  'rearm-26.09.5-windows-386.zip':   '454aa6345ffeb7cbac380001f734e4cb1843989ea1b64e20d56debc83f88d77a',
  'rearm-26.09.5-windows-amd64.zip': 'a5bc3a7861a2957d3cce63469c6fe62afc35528d1c5b75b3583a65bd6e57341b',
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
