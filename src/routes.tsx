import { lazy, type ReactNode } from 'react'
import { routesMeta } from './routesMeta'

const HomePage = lazy(() => import('./ui/pages/HomePage'))
const NotFoundPage = lazy(() => import('./ui/pages/NotFoundPage'))
const BannerDemoPage = lazy(() => import('./ui/pages/BannerDemoPage'))
const BannerPage = lazy(() => import('./ui/pages/BannerPage'))
const StudioPage = lazy(() => import('./studio/ui/StudioPage'))

/** Map each metadata path to its lazy-loaded page element.
 *  Add a new entry here when you add a route to routesMeta.ts. */
const elementMap: Record<string, ReactNode> = {
  '/': <HomePage />,
  '/banner-demo': <BannerDemoPage />,
  '/studio': <StudioPage />,
  '*': <NotFoundPage />,
}

export const routes = [
  ...routesMeta.map((meta) => ({
    ...meta,
    element: elementMap[meta.path] ?? null,
  })),
  // Per-banner sub-routes (not in routesMeta — parameterized)
  { path: '/banner-demo/:slug', element: <BannerPage />, label: 'Banner', hideNav: true },
]

// Re-export convenience slices so consumers can import from one place.
export { routesMeta, navMeta as navRoutes, demoMeta as demoRoutes } from './routesMeta'
