import { Link } from 'react-router-dom'
import styles from './DemoCard.module.css'

interface DemoCardProps {
  title: string
  description: string
  path: string
  wip?: boolean
}

export default function DemoCard({ title, description, path, wip }: DemoCardProps) {
  return (
    <Link to={path} className={styles.card} aria-label={title}>
      <div className={styles.body}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>
      {wip && <span className={styles.badge}>WIP</span>}
      <span className={styles.arrow} aria-hidden>→</span>
    </Link>
  )
}
