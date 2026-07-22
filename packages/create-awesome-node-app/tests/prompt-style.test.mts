import assert from "node:assert/strict";
import { test } from "node:test";
import pc from "picocolors";

import {
  SearchableFormattedText,
  colorsEnabled,
  makeSearchableChoice,
  renderTokens,
  shortCategoryLabel,
} from "../src/prompt-style.js";

test("shortCategoryLabel matches CPA/CNA badge rules", () => {
  assert.equal(shortCategoryLabel("Backend Applications"), "Backend");
  assert.equal(shortCategoryLabel("User Acceptance Testing"), "UAT");
});

test("renderTokens respects NO_COLOR", () => {
  const previous = process.env.NO_COLOR;
  process.env.NO_COLOR = "1";
  try {
    assert.equal(colorsEnabled(), false);
    assert.equal(
      renderTokens([
        { text: "Backend  ", style: pc.yellow },
        { text: "FastAPI", style: pc.bold },
      ]),
      "Backend  FastAPI",
    );
  } finally {
    if (previous === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = previous;
  }
});

test("SearchableFormattedText lower() uses search text", () => {
  const title = new SearchableFormattedText(
    [{ text: "X", style: pc.bold }],
    "Backend FastAPI API",
  );
  assert.equal(title.lower(), "backend fastapi api");
  assert.ok(title.toString().includes("X"));
});

test("makeSearchableChoice builds badge + name + labels", () => {
  process.env.NO_COLOR = "1";
  try {
    const choice = makeSearchableChoice({
      name: "FastAPI Starter",
      value: "https://example.com",
      description: "Async API",
      labels: ["FastAPI", "API", "uv", "extra"],
      categorySlug: "backend-applications",
      categoryName: "Backend Applications",
    });
    assert.match(choice.title, /Backend/);
    assert.match(choice.title, /FastAPI Starter/);
    assert.match(choice.title, /· FastAPI, API, uv/);
    assert.ok(choice._search.includes("backend"));
    assert.equal(choice.description, "Async API");
  } finally {
    delete process.env.NO_COLOR;
  }
});
