<div align="center">

<h1>🧩 <code>tsconfig</code></h1>

<p><strong>Shared TypeScript configurations for Create Awesome Node App packages.</strong><br/>
Base, NestJS, Next.js, and React Library presets — extends <code>base.json</code> for consistent strictness across the monorepo.</p>

</div>

> This is an **internal package** within the Create Node App monorepo. It is not published to npm.

---

## Available Configs

All presets extend `base.json` unless noted otherwise.

### `base.json`

The foundation — strict TypeScript with `ES2022` target and `NodeNext` module resolution:

- `strict: true`
- `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`
- `verbatimModuleSyntax`, `isolatedModules`
- `useUnknownInCatchVariables`

### `nextjs.json`

For Next.js applications (extends `base.json`):

- Target: `es5` with `dom` + `esnext` lib
- `jsx: "preserve"`, `noEmit: true`
- `allowJs: true`, `resolveJsonModule: true`
- Includes `src` and `next-env.d.ts`

### `react-library.json`

For React component packages (extends `base.json`):

- `jsx: "react-jsx"` (automatic JSX transform)
- Target: `es6`
- Lib: `dom`, `dom.iterable`, `ES2015`

### `nest.json`

For NestJS applications (extends `base.json`):

- Target: `es2019` with CommonJS modules
- `emitDecoratorMetadata: true`, `experimentalDecorators: true`
- `sourceMap: true`, `outDir: ./dist`

---

## Usage

Reference a config by its relative path in your `tsconfig.json`:

```json
{
  "extends": "tsconfig/base.json"
}
```

Or for a specific framework:

```json
{
  "extends": "tsconfig/nextjs.json"
}
```

---

## License

MIT &copy; [Create Node App Contributors](https://github.com/Create-Node-App/create-node-app/graphs/contributors)
