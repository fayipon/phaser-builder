import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'
import styles from './Layout.module.css'

export default function Layout() {
  return (
    <div className={styles.shell}>
      <NavBar />
      <main className={styles.content}>
        <Suspense fallback={<div className={styles.loading}>Loading…</div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
