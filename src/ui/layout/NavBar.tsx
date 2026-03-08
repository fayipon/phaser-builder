import { Link } from 'react-router-dom'
import styles from './NavBar.module.css'

export default function NavBar() {
  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <Link to="/" className={styles.brand}>
        <span className={styles.brandName}>Phaser Builder</span>
        <span className={styles.brandTagline}>互動遊戲展示平台</span>
      </Link>

      <div className={styles.externalLinks}>
        <a
          href="https://phaser.io/"
          target="_blank"
          rel="noreferrer"
          className={styles.extLink}
        >
          Phaser 3
        </a>
        <a
          href="https://github.com/fayipon/phaser-builder"
          target="_blank"
          rel="noreferrer"
          className={styles.extLink}
        >
          GitHub
        </a>
      </div>
    </nav>
  )
}
