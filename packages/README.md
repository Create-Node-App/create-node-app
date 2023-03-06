<div align="center">
<p>
    <img
        style="width: 200px"
        width="200"
        src="https://avatars.githubusercontent.com/u/4426989?s=200&v=4"
    >
</p>
<h1>TypeScript Monorepo Boilerplate Packages</h1>

</div>

## Requirements

**You’ll need to have Node 18.14.2 or later on your local development machine** (but it’s not required on the server). You can use [fnm](https://github.com/Schniz/fnm) to easily switch Node versions between different projects.

```sh
git clone https://github.com/Create-Node-App/create-node-app
cd create-node-app
fnm use
npm install
```

## Publishing Packages

We use [Changesets](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md) to publish packages. This is a tool that allows us to publish packages to NPM with a single command. It also allows us to create a changelog for each package.

To publish a package, you need to run the following command:

```sh
# Add a new changeset
npm run changeset

# Build the packages, update the versions and publish them
npm run publish-packages
```

## Contributing

Contributions are welcome! Pull requests are welcome.

If you have a more representative example of some of the components, hooks, helpers, feel free to create a new story and create a pull request.

Read the [CONTRIBUTING guide](../../CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to React.
