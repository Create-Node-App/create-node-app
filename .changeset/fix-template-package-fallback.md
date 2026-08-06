---
"@create-node-app/core": patch
"create-awesome-node-app": patch
---

fix(core): resolve package.json inside template/ when base package.json is absent

Support restructured templates where package.json lives only at templates/<name>/template/package.json (co-located with scaffold). getPackagePath now prefers template/package.json when it exists, allowing cna-templates to keep package.json only inside template/ without breaking file:// CI.
