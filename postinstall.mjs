// postinstall.mjs
// Repo-approved safe replacement for upstream oh-my-opencode postinstall.
// Purpose: verify that the expected platform binary package is resolvable
// without executing any external binary during installation.

import { createRequire } from "node:module";
import { getPlatformPackage, getBinaryPath } from "./bin/platform.js";

const require = createRequire(import.meta.url);

function getLibcFamily() {
  if (process.platform !== "linux") {
    return undefined;
  }

  try {
    const detectLibc = require("detect-libc");
    return detectLibc.familySync();
  } catch {
    return null;
  }
}

function main() {
  const { platform, arch } = process;
  const libcFamily = getLibcFamily();

  try {
    const pkg = getPlatformPackage({ platform, arch, libcFamily });
    const binPath = getBinaryPath(pkg, platform);
    require.resolve(binPath);
    console.log(`✓ oh-my-opencode binary installed for ${platform}-${arch}`);
  } catch (error) {
    console.warn(`⚠ oh-my-opencode: ${error.message}`);
    console.warn(`  The CLI may not work on this platform.`);
  }
}

main();
