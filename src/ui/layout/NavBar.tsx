import { NavLink } from 'react-router-dom'
import { navMeta } from '../../routesMeta'
import styles from './NavBar.module.css'

export default function NavBar() {
  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <NavLink to="/" className={styles.brand}>
        <span className={styles.brandAccent}>Phaser</span> Builder
      </NavLink>

      {navMeta.length > 0 && (
        <ul className={styles.links}>
          {navMeta.map((r) => (
            <li key={r.path}>
              <NavLink
                to={r.path}
                end={r.path === '/'}
                className={({ isActive }) =>
                  [styles.link, isActive ? styles.active : ''].join(' ').trim()
                }
              >
                {r.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
