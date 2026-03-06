# Copilot Instructions

## Project Overview

**phaser-builder** is a Phaser 3 + React application. React handles UI/menus/overlays; Phaser owns the game canvas and all game logic. They communicate via a shared event emitter or a React context bridge — never by letting Phaser import React components or vice versa.

## Architecture

```
src/
  routesMeta.ts  # ← ONLY file to edit when adding a new page (path, label, desc)
  routes.tsx     # Maps routesMeta paths → lazy page elements; re-exports slices
  game/          # Phaser scenes, game objects, physics, input
    scenes/      # One file per Scene (Boot, Preload, MainMenu, Game, UI)
    objects/     # GameObjects / prefabs
    config.ts    # base Phaser.Game config (spread per page)
  ui/
    layout/      # Layout.tsx (Outlet wrapper) + NavBar.tsx — shared shell
    pages/       # One file per route page
    components/  # Shared React components (DemoCard, etc.)
  bridge/        # EventBus singleton shared between Phaser & React
  App.tsx        # BrowserRouter + Routes driven by routes.tsx
  main.tsx       # React createRoot
```

### Adding a new page (3 steps)
1. Create `src/ui/pages/MyPage.tsx`
2. Add one entry to `src/routesMeta.ts` → auto-appears in NavBar + Home grid
3. Add `'/my-path': <MyPage />` to `elementMap` in `src/routes.tsx`

- Cross-boundary communication: React → Phaser via `EventBus.emit()`; Phaser → React via `EventBus.emit()` + React `useEffect` listeners. The specific emitter library (`mitt`, Phaser's built-in, or a custom class) is TBD — keep it behind an interface in `bridge/EventBus.ts` so the implementation can be swapped.
- Scenes extend `Phaser.Scene`. Register them in `game/config.ts`, not inside components.

## Code Style

- TypeScript strict mode throughout (`"strict": true` in `tsconfig.json`).
- Phaser files: class-based (`class FooScene extends Phaser.Scene`).
- React files: functional components + hooks only (no class components).
- File naming: `PascalCase` for classes/components, `camelCase` for utilities.
- Prefer `const` / arrow functions in React; standard class methods in Phaser scenes.

## Build

```bash
npm install    # install dependencies
npm run dev    # Vite dev server (HMR for React; full reload for Phaser scenes)
npm run build  # production build → dist/
npm run preview  # preview production build locally
```

## Project Conventions

- Phaser asset keys (strings) are declared as `const` enums in `game/assets.ts` — never use raw strings in scene code.
- Scene lifecycle order: `preload → create → update`. Physics and input setup always in `create`.
- React components in `ui/` must not import anything from `game/` except `bridge/EventBus`.
- Environment variables exposed to the client use the `VITE_` prefix.

## Integration Points

- **Vite** with `@vitejs/plugin-react` for JSX transform and HMR.
- **Phaser 3** (`phaser` npm package) — import as `import Phaser from 'phaser'`.
- **React 18** with concurrent features; `createRoot` in `main.tsx`. State is managed entirely with React Context + `useReducer` / `useState` — no third-party state library.
- Asset loading (images, audio, tilemaps) happens exclusively in `PreloadScene`.

## Security

- No secrets in client code; use `VITE_` env vars for any public API keys.
- User-generated strings must be sanitized before rendering as HTML in React (use `textContent`, not `innerHTML`).
