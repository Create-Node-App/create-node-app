/**
 * Rewrite option aliases in argv before Commander parses it.
 *
 * Commander has no first-class support for aliases of negatable boolean
 * options, so we normalize `--skip-install` to `--no-install` ourselves.
 *
 * The rewrite respects the `--` end-of-options boundary: tokens at or
 * after the first `--` are passed through unchanged, so a literal
 * `--skip-install` value given after `--` is preserved as a positional
 * argument and never reinterpreted as the option.
 *
 * @param argv  The raw argv to normalize (typically `process.argv`).
 * @returns     A new array with aliases rewritten before `--`.
 */
export const rewriteOptionAliases = (argv: readonly string[]): string[] => {
  const out: string[] = [];
  let pastEndOfOptions = false;
  for (const arg of argv) {
    if (arg === "--") {
      pastEndOfOptions = true;
      out.push(arg);
      continue;
    }
    if (!pastEndOfOptions && arg === "--skip-install") {
      out.push("--no-install");
    } else {
      out.push(arg);
    }
  }
  return out;
};
