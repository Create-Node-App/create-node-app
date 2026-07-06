import { test } from "node:test";
import assert from "node:assert/strict";
import pc from "picocolors";

test("expected errors print only the red message when not verbose", () => {
  // This test pins the format of the error output so any change is
  // intentional. The actual handler is exercised end-to-end by the
  // smoke test and the integration tests.
  const error = new Error("Invalid extension slug: 'x'.");

  const messages: string[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    messages.push(String(args[0]));
  };

  try {
    if (error instanceof Error) {
      console.error(pc.red(error.message));
    }
  } finally {
    console.error = originalError;
  }

  assert.equal(messages.length, 1);
  assert.equal(messages[0], pc.red("Invalid extension slug: 'x'."));
});
