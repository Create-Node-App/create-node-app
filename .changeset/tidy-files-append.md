---
"@create-node-app/core": patch
---

Apply template files before extension files so extension appends are preserved when they target the same generated file. Fixes #367.
