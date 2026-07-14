---
"create-awesome-node-app": minor
---

Interactive mode overhaul: searchable, single-list template and extension pickers.

- **Templates**: replaced the two-step category → template flow with a single
  searchable `autocomplete` prompt that shows every template across every
  category at once. Type any framework, category name, or keyword to filter.
  A "Use my own template URL" entry lives at the bottom of the list for
  users bringing their own starter.
- **Extensions**: replaced the loop of per-category multiselects with a
  single `autocompleteMultiselect` that flattens every compatible extension
  into one searchable list, visually grouped by category prefix. Search
  matches title, description, category, and keywords.
- **Search UX**: each choice ships a pre-computed `_search` token bag so
  filtering matches text that is not visible in the styled title (ANSI
  colors, category prefix, keywords) — pure prefix matches work naturally.
- **Discovery**: the entire catalog is visible from the first prompt, so
  users no longer need to guess which category holds the template they want.

No behavioral changes to non-interactive mode.
