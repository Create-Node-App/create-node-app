import fs from "fs";

/**
 * Base error class for all CNA-specific errors.
 */
export class CnaError extends Error {
  readonly code: string;
  readonly suggestions: string[] = [];
  override readonly cause: Error | undefined;

  constructor(
    code: string,
    message: string,
    options?: { suggestions?: string[]; cause?: Error },
  ) {
    super(message);
    this.name = "CnaError";
    this.code = code;
    if (options?.suggestions) this.suggestions = options.suggestions;
    if (options?.cause) this.cause = options.cause;
  }
}

/** A config file is missing or cannot be parsed. */
export class ConfigParseError extends CnaError {
  constructor(
    readonly filePath: string,
    parseError: unknown,
  ) {
    const cause = parseError instanceof Error ? parseError : undefined;
    super(
      "CNA_CONFIG_PARSE",
      `Failed to parse config file: ${filePath}. ${
        parseError instanceof Error ? parseError.message : String(parseError)
      }`,
      ...(cause ? [{ cause }] : []),
    );
    this.name = "ConfigParseError";
  }
}

/** A template manifest (template.json, package.json) failed to load. */
export class ManifestLoadError extends CnaError {
  constructor(
    readonly templateUrl: string,
    manifestType: string,
    cause: Error,
  ) {
    super(
      "CNA_MANIFEST_LOAD",
      `Failed to load ${manifestType} for template ${templateUrl}: ${cause.message}`,
      {
        cause,
        suggestions: [
          "Ensure the template URL is valid and the manifest file exists.",
        ],
      },
    );
    this.name = "ManifestLoadError";
  }
}

/** Package manager fallback (e.g. pnpm < 5 → npm). */
export class PackageManagerFallback extends CnaError {
  constructor(
    readonly requestedManager: string,
    readonly fallbackManager: string,
    reason: string,
  ) {
    super(
      "CNA_PM_FALLBACK",
      `${requestedManager} is not fully supported (${reason}). Falling back to ${fallbackManager}.`,
      {
        suggestions: [
          `Install a newer version of ${requestedManager} to use it directly.`,
        ],
      },
    );
    this.name = "PackageManagerFallback";
  }
}

/**
 * Two or more extensions are mutually incompatible.
 */
export class IncompatibleExtensionsError extends CnaError {
  readonly pairs: Array<[string, string]>;

  constructor(
    pairs: Array<[string, string]>,
    options?: { suggestions?: string[] },
  ) {
    const lines = pairs.map(([a, b]) => `  · ${a} is incompatible with ${b}`);
    super(
      "CNA_INCOMPATIBLE_EXTENSIONS",
      `Incompatible extensions selected:\n${lines.join("\n")}`,
      {
        suggestions: options?.suggestions ?? [
          "Remove or replace one of the conflicting extensions.",
          "Run with --remove-conflicts to auto-resolve by keeping the first extension.",
        ],
      },
    );
    this.name = "IncompatibleExtensionsError";
    this.pairs = pairs;
  }
}

/** Scaffolding interrupted by user signal. */
export class ScaffoldAbortedError extends CnaError {
  constructor(readonly root: string) {
    super(
      "CNA_ABORTED",
      `Scaffolding was interrupted. Removing partial scaffold at ${root}.`,
    );
    this.name = "ScaffoldAbortedError";
  }

  /** Remove the scaffold directory if it was created during this run. */
  cleanup() {
    if (fs.existsSync(this.root)) {
      fs.rmSync(this.root, { recursive: true, force: true });
    }
  }
}
