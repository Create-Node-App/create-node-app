import pc from "picocolors";

/**
 * Declarative style tokens (CPA FormattedText parity).
 * Tokens compose into a single ANSI string for the `prompts` library,
 * which only accepts string titles — not token arrays.
 */
export type StyleFn = (s: string) => string;

export interface StyleToken {
  text: string;
  style?: StyleFn;
}

const CATEGORY_STYLES: StyleFn[] = [
  pc.yellow,
  pc.green,
  pc.cyan,
  pc.magenta,
  pc.blue,
  (s: string) => pc.bold(pc.green(s)),
  (s: string) => pc.bold(pc.cyan(s)),
];

export const categoryStyle = (slug: string): StyleFn => {
  const idx =
    slug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    CATEGORY_STYLES.length;
  return CATEGORY_STYLES[idx] ?? CATEGORY_STYLES[0]!;
};

const STOP_WORDS = new Set(["Applications", "Application", "Boilerplate"]);

export const shortCategoryLabel = (categoryName: string): string => {
  const words = categoryName.split(" ").filter((w) => !STOP_WORDS.has(w));
  if (words.length >= 3)
    return words.map((w) => w[0]?.toUpperCase() ?? "").join("");
  return words.slice(0, 2).join(" ");
};

export const colorsEnabled = (): boolean => {
  if (process.env.NO_COLOR) return false;
  if (process.env.CNA_COLOR === "0" || process.env.CNA_COLOR === "false") {
    return false;
  }
  if (process.env.CNA_COLOR === "1" || process.env.CNA_COLOR === "true") {
    return true;
  }
  return Boolean(process.stdout.isTTY);
};

/** Render styled tokens to a plain or ANSI string. */
export const renderTokens = (tokens: StyleToken[]): string => {
  if (!colorsEnabled()) {
    return tokens.map((t) => t.text).join("");
  }
  return tokens.map((t) => (t.style ? t.style(t.text) : t.text)).join("");
};

/**
 * Searchable title: keeps a plain `.search` / `.lower()` surface for filters
 * while `toString()` returns the rendered (possibly styled) title.
 */
export class SearchableFormattedText {
  readonly tokens: StyleToken[];
  readonly search: string;

  constructor(tokens: StyleToken[], search: string) {
    this.tokens = tokens;
    this.search = search;
  }

  toString(): string {
    return renderTokens(this.tokens);
  }

  lower(): string {
    return this.search.toLowerCase();
  }

  valueOf(): string {
    return this.toString();
  }
}

export interface SearchableChoice {
  title: string;
  value: string;
  description: string;
  _search: string;
}

export const makeSearchableChoice = (opts: {
  name: string;
  value: string;
  description?: string | undefined;
  labels?: string[] | undefined;
  categorySlug?: string | undefined;
  categoryName?: string | undefined;
}): SearchableChoice => {
  const labelSuffix =
    opts.labels && opts.labels.length > 0
      ? " · " + opts.labels.slice(0, 3).join(", ")
      : "";

  const badgeText = opts.categorySlug
    ? shortCategoryLabel(opts.categoryName ?? opts.categorySlug)
        .padEnd(10)
        .slice(0, 10)
    : "";

  const tokens: StyleToken[] = [];
  if (badgeText && opts.categorySlug) {
    tokens.push({
      text: badgeText,
      style: categoryStyle(opts.categorySlug),
    });
    tokens.push({ text: "  " });
  }
  tokens.push({ text: opts.name, style: pc.bold });
  if (labelSuffix) {
    tokens.push({ text: labelSuffix, style: pc.dim });
  }

  const formatted = new SearchableFormattedText(
    tokens,
    [
      opts.categoryName,
      opts.categorySlug,
      opts.name,
      opts.description ?? "",
      ...(opts.labels ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );

  return {
    // prompts expects a string; SearchableFormattedText stringifies on use
    title: formatted.toString(),
    value: opts.value,
    description: opts.description ?? "",
    _search: formatted.search.toLowerCase(),
  };
};
