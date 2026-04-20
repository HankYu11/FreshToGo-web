# FreshToGo Web

Marketing and download landing site for the FreshToGo mobile app, built with React + TypeScript + Vite.

## Tech Stack

- **React 19** with TypeScript (~5.9)
- **Vite 7** — dev server and bundler
- **React Router 7** — client-side routing
- **i18n** — multi-language support
- ESLint 9 flat config with `typescript-eslint`

## Getting Started

```bash
npm install
npm run dev
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR at `http://localhost:5173` |
| `npm run build` | Type-check then build for production |
| `npm run lint` | Run ESLint across all TS/TSX files |
| `npm run preview` | Preview production build locally |

## Project Structure

```
src/
├── main.tsx          # Entry point
├── App.tsx           # Root component with routing
├── i18n.ts           # i18n setup
├── constants.ts      # Shared constants
├── pages/
│   ├── HomePage.tsx
│   ├── DownloadPage.tsx
│   └── DownloadPage.css
└── assets/
```

## Branching & Deployment

- Feature/fix branches target **`develop`**
- `develop` → `main` is a **release PR** — triggers production deployment to Firebase Hosting
- Dev site deployment is triggered manually via `workflow_dispatch` (select `dev` environment)
- CI runs lint & build on all PRs to `main`
