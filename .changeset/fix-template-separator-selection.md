---
"create-awesome-node-app": patch
---

Fix interactive template autocomplete submitting category separator rows.

`prompts@2.x` autocomplete ignores `disabled: true`, so Enter on a divider
could select an invalid template. Separators are removed; each choice now
shows a fixed-width coloured category badge for scanability.
