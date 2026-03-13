# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — Type-check with `tsc -b` then build with Vite
- `npm run lint` — ESLint across all TS/TSX files
- `npm run preview` — Preview production build locally

## Tech Stack

- **React 19** with TypeScript (~5.9), bundled by **Vite 7**
- ESLint 9 flat config with `typescript-eslint`, `react-hooks`, and `react-refresh` plugins
- No test framework configured yet
- No CSS framework — plain CSS (`App.css`, `index.css`)

## Project Structure

- `src/main.tsx` — Entry point, renders `<App />` inside `<StrictMode>`
- `src/App.tsx` — Root component
- `vite.config.ts` — Vite config with `@vitejs/plugin-react` (Babel-based)
- `tsconfig.json` — References `tsconfig.app.json` (app code) and `tsconfig.node.json` (tooling)

## Branching & PR Strategy

- Feature and fix branches target **`develop`** (not `main`)
- Only `develop` → `main` PRs are used to trigger CD for deployment
