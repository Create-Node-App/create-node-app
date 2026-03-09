# Contributing to Create Awesome Node App

First off, **thank you for taking the time to contribute!** 🎉

Whether you're fixing a bug, improving documentation, adding a template, or suggesting a feature — every contribution helps make CNA better for the whole community.

> **New here?** Start by checking the [official site](https://create-awesome-node-app.vercel.app) to understand what CNA does, then come back here to dive in.

Please note we have a [Code of Conduct](./.github/CODE_OF_CONDUCT.md) — follow it in all your interactions with the project.

---

## 🐛 Reporting Bugs

Use the [GitHub issue tracker](https://github.com/Create-Node-App/create-node-app/issues) to report bugs.

Before filing, please:

- Check open/recently closed issues to avoid duplicates
- Use the [bug report template](./.github/ISSUE_TEMPLATE/bug_report.md)

Include as much detail as possible:

- A **reproducible test case** or steps to reproduce
- The **version** of the CLI you're running (`create-awesome-node-app --version`)
- Your **Node.js version** (`node --version`) and OS
- Any relevant modifications or unusual environment details

---

## 💡 Suggesting Features

We love good ideas! Use the [feature request template](./.github/ISSUE_TEMPLATE/feature_request.md) on GitHub Issues.

Describe the problem you're solving and the solution you have in mind — the more context, the better.

---

## 🔀 Contributing via Pull Requests

Pull requests are the best way to propose changes. Before opening one:

1. **Work against the latest `main` branch** — make sure your fork is up to date
2. **Check existing PRs** — someone may already be working on the same thing
3. **Open an issue first** for significant changes — we'd hate for your time to be wasted on something that doesn't align with the roadmap

### Steps

1. **Fork** the repository and create a branch from `main`
2. **Make your changes** — focus on the specific fix or feature; avoid reformatting unrelated code
3. **Ensure tests pass** — run `npm test` from the root
4. **Write clear commit messages** — follow [Conventional Commits](https://www.conventionalcommits.org/) if possible
5. **Open a Pull Request** — fill out the template and link the related issue
6. **Stay engaged** — respond to review comments and CI failures

GitHub docs: [Forking a repo](https://help.github.com/articles/fork-a-repo/) · [Creating a pull request](https://help.github.com/articles/creating-a-pull-request/)

---

## 🧱 Contributing Templates or Extensions

Template and extension data lives in a separate repository:
**[github.com/Create-Node-App/cna-templates](https://github.com/Create-Node-App/cna-templates)**

To add or update a template/extension, open a PR there following the conventions described in that repo's README.

---

## 🔍 Finding Something to Work On

- Look for issues labelled **`help wanted`** or **`good first issue`**
- Browse the [open issues](https://github.com/Create-Node-App/create-node-app/issues) for bugs or feature requests that interest you
- Check the [Roadmap](./packages/create-awesome-node-app/README.md#-roadmap) section in the CLI README

---

## 🛠 Local Development

```sh
# Clone and set up
git clone https://github.com/Create-Node-App/create-node-app.git
cd create-node-app
fnm use
npm install

# Build the CLI
npm run build -- --filter create-awesome-node-app

# Test your changes
./packages/create-awesome-node-app/index.js my-test-app
```

---

Again, **thank you** for helping make Create Awesome Node App better! 🚀
