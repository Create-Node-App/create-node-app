import pc from "picocolors";

const CATEGORY_STYLES: Array<(s: string) => string> = [
  pc.yellow,
  pc.green,
  pc.cyan,
  pc.magenta,
  pc.blue,
  (s: string) => pc.bold(pc.green(s)),
  (s: string) => pc.bold(pc.cyan(s)),
];

const categoryStyle = (slug: string): ((s: string) => string) => {
  const idx =
    slug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    CATEGORY_STYLES.length;
  return CATEGORY_STYLES[idx] ?? CATEGORY_STYLES[0]!;
};

const STOP_WORDS = new Set(["Applications", "Application", "Boilerplate"]);

const shortCategoryLabel = (categoryName: string): string => {
  const words = categoryName.split(" ").filter((w) => !STOP_WORDS.has(w));
  if (words.length >= 3)
    return words.map((w) => w[0]?.toUpperCase() ?? "").join("");
  return words.slice(0, 2).join(" ");
};

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
      ? pc.dim(" · " + opts.labels.slice(0, 3).join(", "))
      : "";

  const badge = opts.categorySlug
    ? categoryStyle(opts.categorySlug)(
        shortCategoryLabel(opts.categoryName ?? opts.categorySlug)
          .padEnd(10)
          .slice(0, 10),
      )
    : "";

  const title = badge
    ? badge + "  " + pc.bold(opts.name) + labelSuffix
    : pc.bold(opts.name) + labelSuffix;

  return {
    title,
    value: opts.value,
    description: opts.description ?? "",
    _search: [
      opts.categoryName,
      opts.categorySlug,
      opts.name,
      opts.description ?? "",
      ...(opts.labels ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
};
