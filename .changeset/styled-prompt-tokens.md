---
"create-awesome-node-app": minor
---

feat(cli): style prompts with declarative formatted tokens (#279)

Extracts prompt styling into a dedicated `prompt-style.ts` module that
uses declarative `FormattedText` tokens, fixing literal ANSI escapes in
interactive select prompts.
