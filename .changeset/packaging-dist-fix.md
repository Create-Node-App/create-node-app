---
'create-awesome-node-app': patch
---

Fix release packaging: build dist before publishing so the npm tarball contains the compiled CLI (0.17.0 shipped console-only files and crashed on startup).
