# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and a basic ESLint configuration.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Code quality

Run commands from `frontend/`:

```sh
npm run lint
npm run lint:fix
npm run build
```

`eslint.config.js` enables recommended JavaScript and TypeScript checks, React
Hooks rules, Vite Fast Refresh checks, strict equality, and consistent type imports.
Lint fails on warnings. Build output and coverage reports are excluded.

`lint:fix` applies available automatic fixes. ESLint checks code quality;
formatting and type checking remain separate concerns. `build` runs TypeScript
checking before bundling.

TypeScript uses the 6.0 branch supported by `typescript-eslint`. Upgrade both
together after checking parser compatibility.
