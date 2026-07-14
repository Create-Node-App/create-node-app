---
"create-awesome-node-app": minor
---

Interactive mode UX overhaul: grouped template picker and two-step extension selector.

**Template picker:**

- Visual category separator lines between groups (`── Frontend Applications ──`)
- Separators are hidden when you type a search query (clean filtered results)
- Template titles no longer repeat the category prefix — cleaner to scan
- Labels shown inline as a dim suffix: `React Vite Boilerplate · React, Vite, TypeScript`
- `limit: 9` keeps the list visible without scrolling off screen

**Extension picker (two-step):**

- Step 1: pick which _categories_ you want (State Management, UI, Testing…) with extension counts shown
- Step 2: for each selected category a focused multiselect of just those extensions appears
- Reduces visual load from 51 items in one list to small, purpose-specific groups
- Skipping all categories (hit Enter with none selected) bypasses extensions entirely

No behavioral changes to non-interactive mode.
