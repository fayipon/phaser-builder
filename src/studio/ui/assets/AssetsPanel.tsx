import { useEditorStore } from '../../store/editorStore'
import type { BannerObject } from '../../dsl'
import styles from './AssetsPanel.module.css'

type QuickAdd = Pick<BannerObject, 'type'> & Partial<BannerObject>

const quickItems: { label: string; icon: string; props: QuickAdd }[] = [
  { label: 'Text', icon: 'T', props: { type: 'text', text: 'Hello', x: 100, y: 50 } },
  { label: 'Image', icon: '🖼', props: { type: 'image', x: 120, y: 50 } },
  { label: 'Sprite', icon: '🎞', props: { type: 'sprite', x: 120, y: 50 } },
  { label: 'Coin Rain', icon: '🪙', props: { type: 'particle', particlePreset: 'coin_rain', x: 200, y: 0 } },
  { label: 'Sparkles', icon: '✨', props: { type: 'particle', particlePreset: 'sparkles', x: 200, y: 50 } },
  { label: 'Confetti', icon: '🎉', props: { type: 'particle', particlePreset: 'confetti', x: 200, y: 0 } },
  { label: 'Explosion', icon: '💥', props: { type: 'particle', particlePreset: 'jackpot_explosion', x: 200, y: 50 } },
]

export default function AssetsPanel() {
  const { addObject, banner, selectObject, selectedId, removeObject } = useEditorStore()

  return (
    <aside className={styles.panel}>
      <h3 className={styles.heading}>Add Object</h3>
      <div className={styles.quickGrid}>
        {quickItems.map((item) => (
          <button
            key={item.label}
            className={styles.quickBtn}
            title={item.label}
            onClick={() => addObject(item.props as Omit<BannerObject, 'id'>)}
          >
            <span className={styles.quickIcon}>{item.icon}</span>
            <span className={styles.quickLabel}>{item.label}</span>
          </button>
        ))}
      </div>

      <h3 className={styles.heading}>Layers</h3>
      <ul className={styles.layers}>
        {banner.objects.map((obj) => (
          <li
            key={obj.id}
            className={`${styles.layer} ${obj.id === selectedId ? styles.layerActive : ''}`}
            onClick={() => selectObject(obj.id)}
          >
            <span className={styles.layerType}>{obj.type}</span>
            <span className={styles.layerId}>{obj.text ?? obj.asset ?? obj.particlePreset ?? obj.id.slice(0, 6)}</span>
            <button
              className={styles.layerDel}
              onClick={(e) => { e.stopPropagation(); removeObject(obj.id) }}
              title="Delete"
            >✕</button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
