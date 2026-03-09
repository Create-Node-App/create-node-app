<div align="center">

<h1>Create Awesome Node App — Packages</h1>

<p>This directory contains all workspace packages for the <a href="https://create-awesome-node-app.vercel.app"><strong>Create Awesome Node App</strong></a> monorepo.</p>

</div>

---

## Packages

| Package                                                | Description                                              |
| ------------------------------------------------------ | -------------------------------------------------------- |
| [`create-awesome-node-app`](./create-awesome-node-app) | Main CLI — the tool end users run                        |
| [`create-node-app-core`](./create-node-app-core)       | Core generation logic (templates, git, package merge)    |
| `eslint-config*`                                       | Shared ESLint presets (base, TypeScript, React, Next.js) |
| `tsconfig`                                             | Shared TypeScript base configurations                    |

---

## Requirements

**Node >= 22.0.0** is required. We recommend [`fnm`](https://github.com/Schniz/fnm) for fast version switching.

```sh
git clone https://github.com/Create-Node-App/create-node-app
cd create-node-app
fnm use
npm install
```

---

## Publishing Packages

We use [Changesets](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md) for versioning and publishing.

```sh
# Record your changes
npm run changeset

# Lint, bump versions, build, and publish
npm run publish-packages
```

---

## Contributing

Pull requests are welcome! See the root [CONTRIBUTING guide](../CONTRIBUTING.md) for full details on our development process, how to run tests, and how to submit changes.

For template and extension contributions, visit [github.com/Create-Node-App/cna-templates](https://github.com/Create-Node-App/cna-templates).
