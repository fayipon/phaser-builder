/** Pure metadata for each route — no React, no lazy imports.
 *  Safe to import from any page (avoids circular deps). */
export interface RouteMeta {
  path: string
  label: string
  description?: string
  /** Technology tag displayed on the demo card */
  tech?: 'REACT' | 'PHASER'
  hideNav?: boolean
}

/**
 * Add a new page here → it appears in the NavBar and on the Home grid.
 */
export const routesMeta: RouteMeta[] = [
  { path: '/', label: 'Home', hideNav: true },

  // ── Add Phaser demo pages below ────────────────────────────
  {
    path: '/banner-demo',
    label: 'Banner Demo',
    description: 'Three Phaser-rendered banners with slide & swipe support',
    tech: 'PHASER',
  },
  // ──────────────────────────────────────────────────────────

  { path: '*', label: '404', hideNav: true },
]

export const navMeta = routesMeta.filter((r) => !r.hideNav)
export const demoMeta = navMeta
