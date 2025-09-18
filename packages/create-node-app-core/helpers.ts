import { execSync } from "child_process";
import spawn from "cross-spawn";
import pc from "picocolors";
import semver from "semver";
import dns from "dns";
import { URL } from "url";

export const toCamelCase = (str: string) => {
  // Lower cases the string
  return (
    str
      .toLowerCase()
      // Replaces any - or _ characters with a space
      .replace(/[-_]+/g, " ")
      // Removes any non alphanumeric characters
      .replace(/[^\w\s]/g, "")
      // Uppercases the first character in each group immediately following a space
      // (delimited by spaces)
      .replace(/ (.)/g, ($1) => {
        return $1.toUpperCase();
      })
      // Removes spaces
      .replace(/ /g, "")
  );
};

export const isUsingYarn = () => {
  return (process.env.npm_config_user_agent || "").indexOf("yarn") === 0;
};

export const shouldUseYarn = () => {
  const { hasMinYarnPnp, hasMaxYarnPnp, yarnVersion } = checkYarnVersion();

  if (!hasMinYarnPnp) {
    console.log(
      pc.yellow(
        `You are using yarn version ${pc.bold(
          yarnVersion,
        )} which is not supported yet. ` +
          `To use Yarn, install v1.12.0 or higher and lower than v2.0.0. ` +
          `See https://yarnpkg.com for instructions on how to update.`,
      ),
    );
    return false;
  }

  if (!hasMaxYarnPnp) {
    console.log(
      pc.yellow(
        `You are using a pre-release version of Yarn which is not supported yet. ` +
          `To use Yarn, install v1.12.0 or higher and lower than v2.0.0. ` +
          `See https://yarnpkg.com for instructions on how to update.`,
      ),
    );
    return false;
  }

  return true;
};

export const shouldUsePnpm = () => {
  const { hasMinPnpm, pnpmVersion } = checkPnpmVersion();

  if (!hasMinPnpm) {
    console.log(
      pc.yellow(
        `You are using pnpm version ${pc.bold(
          pnpmVersion,
        )} which is not supported yet. ` +
          `To use pnpm, install v5.0.0 or higher. ` +
          `See https://pnpm.js.org for instructions on how to update.`,
      ),
    );
    return false;
  }

  return true;
};

export const checkThatNpmCanReadCwd = () => {
  const cwd = process.cwd();
  let childOutput = null;
  try {
    // Note: intentionally using spawn over exec since
    // the problem doesn't reproduce otherwise.
    // `npm config list` is the only reliable way I could find
    // to reproduce the wrong path. Just printing process.cwd()
    // in a Node process was not enough.
    childOutput = spawn.sync("npm", ["config", "list"]).output.join("");
  } catch (err) {
    // Something went wrong spawning node.
    // Not great, but it means we can't do this check.
    // We might fail later on, but let's continue.
    return true;
  }
  if (typeof childOutput !== "string") {
    return true;
  }
  const lines = childOutput.split("\n");
  // `npm config list` output includes the following line:
  // "; cwd = C:\path\to\current\dir" (unquoted)
  // I couldn't find an easier way to get it.
  const prefix = "; cwd = ";
  const line = lines.find((line) => line.startsWith(prefix));
  if (typeof line !== "string") {
    // Fail gracefully. They could remove it.
    return true;
  }
  const npmCWD = line.substring(prefix.length);
  if (npmCWD === cwd) {
    return true;
  }
  console.error(
    pc.red(
      `Could not start an npm process in the right directory.\n\n` +
        `The current directory is: ${pc.bold(cwd)}\n` +
        `However, a newly started npm process runs in: ${pc.bold(npmCWD)}\n\n` +
        `This is probably caused by a misconfigured system terminal shell.`,
    ),
  );
  if (process.platform === "win32") {
    console.error(
      pc.red(`On Windows, this can usually be fixed by running:\n\n`) +
        `  ${pc.cyan(
          "reg",
        )} delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n` +
        `  ${pc.cyan(
          "reg",
        )} delete "HKLM\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n\n` +
        pc.red(`Try to run the above two lines in the terminal.\n`) +
        pc.red(
          `To learn more about this problem, read: https://blogs.msdn.microsoft.com/oldnewthing/20071121-00/?p=24433/`,
        ),
    );
  }
  return false;
};

export const checkPnpmVersion = () => {
  const minPnpm = "5.0.0";
  let hasMinPnpm = false;
  let pnpmVersion = null;
  try {
    pnpmVersion = execSync("pnpm --version").toString().trim();
    if (semver.valid(pnpmVersion)) {
      hasMinPnpm = semver.gte(pnpmVersion, minPnpm);
    } else {
      // Handle non-semver compliant pnpm version strings, which pnpm currently
      // uses for nightly builds. The regex truncates anything after the first
      // dash. See #5362.
      const trimmedPnpmVersionMatch = /^(.*?)[-+].+$/.exec(pnpmVersion);
      if (trimmedPnpmVersionMatch && trimmedPnpmVersionMatch[1]) {
        hasMinPnpm = semver.gte(trimmedPnpmVersionMatch[1], minPnpm);
      }
    }
  } catch (e) {
    // Ignore errors.
  }
  return { hasMinPnpm, pnpmVersion };
};

export const checkYarnVersion = () => {
  const minYarnPnp = "1.12.0";
  const maxYarnPnp = "2.0.0";
  let hasMinYarnPnp = false;
  let hasMaxYarnPnp = false;
  let yarnVersion = null;
  try {
    yarnVersion = execSync("yarnpkg --version").toString().trim();
    if (semver.valid(yarnVersion)) {
      hasMinYarnPnp = semver.gte(yarnVersion, minYarnPnp);
      hasMaxYarnPnp = semver.lt(yarnVersion, maxYarnPnp);
    } else {
      // Handle non-semver compliant yarn version strings, which yarn currently
      // uses for nightly builds. The regex truncates anything after the first
      // dash. See #5362.
      const trimmedYarnVersionMatch = /^(.+?)[-+].+$/.exec(yarnVersion);
      if (trimmedYarnVersionMatch) {
        const trimmedYarnVersion = trimmedYarnVersionMatch.pop();
        if (trimmedYarnVersion) {
          hasMinYarnPnp = semver.gte(trimmedYarnVersion, minYarnPnp);
          hasMaxYarnPnp = semver.lt(trimmedYarnVersion, maxYarnPnp);
        }
      }
    }
  } catch (err) {
    // ignore
  }
  return {
    hasMinYarnPnp: hasMinYarnPnp,
    hasMaxYarnPnp: hasMaxYarnPnp,
    yarnVersion: yarnVersion,
  };
};

export const checkNpmVersion = () => {
  let hasMinNpm = false;
  let npmVersion = null;
  try {
    npmVersion = execSync("npm --version").toString().trim();
    hasMinNpm = semver.gte(npmVersion, "6.0.0");
  } catch (err) {
    // ignore
  }
  return {
    hasMinNpm: hasMinNpm,
    npmVersion: npmVersion,
  };
};

const getProxy = () => {
  if (process.env.HTTPS_PROXY) {
    return process.env.HTTPS_PROXY;
  }
  try {
    // Trying to read https-proxy from .npmrc
    const httpsProxy = execSync("npm config get https-proxy").toString().trim();
    return httpsProxy !== "null" ? httpsProxy : undefined;
  } catch (e) {
    // ignore
  }
  return "";
};

export const checkIfOnline = (useYarn?: boolean) => {
  if (!useYarn) {
    // Don't ping the Yarn registry.
    // We'll just assume the best case.
    return Promise.resolve(true);
  }

  return new Promise<boolean>((resolve) => {
    dns.lookup("registry.yarnpkg.com", (err) => {
      let proxy;
      if (err != null && (proxy = getProxy())) {
        // If a proxy is defined, we likely can't resolve external hostnames.
        // Try to resolve the proxy name as an indication of a connection.
        dns.lookup(new URL(proxy).hostname, (proxyErr) => {
          resolve(!proxyErr);
        });
      } else {
        resolve(!err);
      }
    });
  });
};
