import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pc from "picocolors";

export type CompletionShell = "bash" | "zsh" | "fish" | "powershell";

const SHELLS: CompletionShell[] = ["bash", "zsh", "fish", "powershell"];

const EXT: Record<CompletionShell, string> = {
  bash: "bash",
  zsh: "zsh",
  fish: "fish",
  powershell: "ps1",
};

const INSTALL_HINT: Record<CompletionShell, string> = {
  bash: "Add to ~/.bashrc:\n  source <(create-awesome-node-app --add-completion bash)",
  zsh: "Add to ~/.zshrc:\n  source <(create-awesome-node-app --add-completion zsh)",
  fish: "Save to ~/.config/fish/completions/create-awesome-node-app.fish:\n  create-awesome-node-app --add-completion fish > ~/.config/fish/completions/create-awesome-node-app.fish",
  powershell:
    "Add to your PowerShell profile:\n  create-awesome-node-app --add-completion powershell | Out-String | Invoke-Expression",
};

const resolveCompletionsDir = (): string => {
  const candidates: string[] = [];

  // Prefer package-relative paths (src/ → ../completions, dist/ → ../completions).
  try {
    if (typeof __dirname !== "undefined") {
      candidates.push(path.resolve(__dirname, "../completions"));
    }
  } catch {
    // ignore
  }
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    candidates.push(
      path.resolve(here, "../completions"),
      path.resolve(here, "../../completions"),
    );
  } catch {
    // CJS / import.meta unavailable
  }

  // Published package / monorepo checkout: walk up from cwd looking for package root.
  candidates.push(
    path.resolve(process.cwd(), "completions"),
    path.resolve(process.cwd(), "packages/create-awesome-node-app/completions"),
  );

  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  throw new Error(
    "Could not locate completions/ directory. Reinstall create-awesome-node-app or run from the package root.",
  );
};

export const detectShell = (): CompletionShell => {
  const shellPath = process.env.SHELL || "";
  const base = path.basename(shellPath).toLowerCase();
  if (base.includes("zsh")) return "zsh";
  if (base.includes("fish")) return "fish";
  if (base.includes("pwsh") || base.includes("powershell")) return "powershell";
  return "bash";
};

export const resolveCompletionShell = (
  value: string | true | undefined,
): CompletionShell => {
  if (value === true || value === undefined || value === "") {
    return detectShell();
  }
  const normalized = String(value).toLowerCase();
  if ((SHELLS as string[]).includes(normalized)) {
    return normalized as CompletionShell;
  }
  throw new Error(
    `Unsupported shell '${value}'. Use one of: ${SHELLS.join(", ")}.`,
  );
};

export const printCompletionScript = (shell: CompletionShell): void => {
  const file = path.join(
    resolveCompletionsDir(),
    `create-awesome-node-app.${EXT[shell]}`,
  );
  if (!fs.existsSync(file)) {
    throw new Error(`Completion script not found: ${file}`);
  }
  process.stdout.write(fs.readFileSync(file, "utf8"));
  if (process.stdout.isTTY) {
    console.error();
    console.error(pc.dim(INSTALL_HINT[shell]));
  }
};
