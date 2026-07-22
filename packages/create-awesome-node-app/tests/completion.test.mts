import assert from "node:assert/strict";
import { test } from "node:test";

import {
  detectShell,
  resolveCompletionShell,
} from "../src/completion.js";

test("resolveCompletionShell accepts known shells", () => {
  assert.equal(resolveCompletionShell("bash"), "bash");
  assert.equal(resolveCompletionShell("zsh"), "zsh");
  assert.equal(resolveCompletionShell("fish"), "fish");
  assert.equal(resolveCompletionShell("powershell"), "powershell");
});

test("resolveCompletionShell defaults via detectShell", () => {
  const previous = process.env.SHELL;
  process.env.SHELL = "/usr/bin/zsh";
  try {
    assert.equal(resolveCompletionShell(true), "zsh");
    assert.equal(resolveCompletionShell(undefined), "zsh");
    assert.equal(detectShell(), "zsh");
  } finally {
    if (previous === undefined) delete process.env.SHELL;
    else process.env.SHELL = previous;
  }
});

test("resolveCompletionShell rejects unknown shells", () => {
  assert.throws(() => resolveCompletionShell("tcsh"), /Unsupported shell/);
});
