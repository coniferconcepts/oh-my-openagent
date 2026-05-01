// postinstall.mjs
// Repo-approved safe replacement for upstream oh-my-opencode postinstall.
// Purpose: verify that the expected platform binary package is resolvable
// without executing any external binary during installation.
//
// Based on upstream v3.17.12 postinstall.mjs with the following safety modifications:
// - REMOVED: checkOpenCodeVersion() which runs `opencode --version` via execSync
//   (install-time process execution is a supply-chain risk)
// - KEPT: getPlatformPackageCandidates() and getPackageBaseName() for binary resolution
// - KEPT: require.resolve-only verification (no binary execution)

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { getPlatformPackageCandidates, getBinaryPath } from "./bin/platform.js";

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

function getPackageBaseName() {
  try {
    const packageJson = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
    return packageJson.name || "oh-my-opencode";
  } catch {
    return "oh-my-opencode";
  }
}

function main() {
  const { platform, arch } = process;
  const libcFamily = getLibcFamily();
  const packageBaseName = getPackageBaseName();

  try {
    const packageCandidates = getPlatformPackageCandidates({
      platform,
      arch,
      libcFamily,
      packageBaseName,
    });

    const resolvedPackage = packageCandidates.find((pkg) => {
      try {
        require.resolve(getBinaryPath(pkg, platform));
        return true;
      } catch {
        return false;
      }
    });

    if (!resolvedPackage) {
      throw new Error(
        `No platform binary package installed. Tried: ${packageCandidates.join(", ")}`
      );
    }

    console.log(`✓ oh-my-opencode binary installed for ${platform}-${arch} (${resolvedPackage})`);
  } catch (error) {
    console.warn(`⚠ oh-my-opencode: ${error.message}`);
    console.warn(`  The CLI may not work on this platform.`);
    // Don't fail installation - let user try anyway
  }
}

main();