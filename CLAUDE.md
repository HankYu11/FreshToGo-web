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
- `develop` → `main` PRs are **release PRs** — they trigger CD for production deployment
  - Title format: `Release: <short summary>`
  - The PR body must include a summary of all changes since the last release (list merged feature/fix PRs)
  - Do not squash-merge release PRs; use a merge commit to preserve history

## CI/CD

- **CI** (`.github/workflows/ci.yml`) — Runs lint & build on PRs to `main` (opened/synchronize/reopened)
- **CD** (`.github/workflows/cd.yml`) — Deploys to Firebase Hosting when a PR to `main` is merged
