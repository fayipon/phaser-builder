import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './ui/layout/Layout'
import { routes } from './routes'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All pages share the Layout shell (sticky nav + Suspense wrapper) */}
        <Route element={<Layout />}>
          {routes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
