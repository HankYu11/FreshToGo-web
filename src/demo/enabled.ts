// Demo pages ship only in the dev build (`vite build --mode development` → dev.handyla.co).
// Vite replaces MODE at build time, so in production every `DEMO_ENABLED && …` branch is dropped.
export const DEMO_ENABLED = import.meta.env.MODE === 'development'
