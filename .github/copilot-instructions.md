# Copilot Instructions

This is a **React + Phaser 3 demo/showcase site** — a SPA where React provides the UI shell (navigation, gallery, homepage) and Phaser renders game demos inside a canvas. **Phaser is not yet integrated**; the current state is a React SPA with a homepage and routing skeleton.

## Current Structure

```
src/
  main.tsx              # React entry (ReactDOM.createRoot)
  App.tsx               # BrowserRouter + Routes (React Router v7)
  pages/
    HomePage.tsx        # Landing page with demo entry cards
  index.css             # Tailwind CSS v4 (@import "tailwindcss") + global :root vars
public/
  assets/               # (reserved) Static Phaser game assets
index.html
vite.config.ts          # @vitejs/plugin-react + @tailwindcss/vite
```

## Architecture

React owns all UI state and routing. When Phaser is added:
- A `src/game/` directory will hold game config and scenes.
- A `PhaserGame.tsx` bridge component (using `useLayoutEffect` + `forwardRef`) mounts/destroys `Phaser.Game`.
- A `src/game/EventBus.ts` singleton (`Phaser.Events.EventEmitter`) is the **only** allowed React↔Phaser communication channel — never pass React state/props directly into scenes.
- Each `/demos/:id` route will mount its own `PhaserGame` instance (unmount on route change keeps demos isolated).

## Adding a New Demo Page

1. Create `src/pages/demos/MyDemo.tsx` — mounts a `<PhaserGame>` component.
2. Add a `<Route path="/demos/my-demo" element={<MyDemo />} />` in `App.tsx`.
3. Add a `<DemoCard>` entry on `HomePage.tsx`.
4. Place demo scenes in `src/game/demos/my-demo/`.

## Tooling

| Concern | Choice |
|---|---|
| Bundler | Vite 7 (`vite.config.ts`) |
| Language | TypeScript 5.9 (strict) |
| React | v19 |
| Routing | React Router v7 (`BrowserRouter`) |
| CSS | Tailwind CSS v4 via `@tailwindcss/vite` |
| Phaser | v3.90+ (not yet installed) |

## Build & Dev Commands

```bash
npm install       # Install dependencies
npm run dev       # Dev server (Vite default: http://localhost:5173)
npm run build     # tsc -b && vite build → dist/
npm run preview   # Preview production build locally
```

## Conventions

- Pages live in `src/pages/` (top-level) or `src/pages/demos/<name>.tsx` (demo pages).
- Tailwind utility classes are the primary styling method; avoid `*.module.css` files.
- `src/index.css` starts with `@import "tailwindcss"` — do not add a separate `tailwind.config.ts` (Tailwind v4 is config-file-free by default).
- No Phaser code outside `src/game/`; no React state inside Phaser scenes.
