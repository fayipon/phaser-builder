import { useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import type { TimelineEntry } from '../../dsl'
import styles from './TimelinePanel.module.css'

const TWEENS: TimelineEntry['type'][] = ['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotation', 'alpha']

export default function TimelinePanel() {
  const { banner, addTimelineEntry, removeTimelineEntry } = useEditorStore()
  const objects = banner.objects
  const entries = banner.timeline

  const [target, setTarget] = useState('')
  const [type, setType] = useState<TimelineEntry['type']>('scale')
  const [value, setValue] = useState(1.2)
  const [duration, setDuration] = useState(500)

  const handleAdd = () => {
    if (!target) return
    addTimelineEntry({
      target,
      type,
      value,
      duration,
      repeat: -1,
      yoyo: true,
    })
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.heading}>Timeline</h3>

        <div className={styles.addRow}>
          <select
            className={styles.sel}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="">— object —</option>
            {objects.map((o) => (
              <option key={o.id} value={o.id}>
                {o.text ?? o.asset ?? o.particlePreset ?? o.id.slice(0, 8)}
              </option>
            ))}
          </select>

          <select className={styles.sel} value={type} onChange={(e) => setType(e.target.value as TimelineEntry['type'])}>
            {TWEENS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <input className={styles.num} type="number" value={value} step={0.1} onChange={(e) => setValue(Number(e.target.value))} placeholder="val" />
          <input className={styles.num} type="number" value={duration} step={100} onChange={(e) => setDuration(Number(e.target.value))} placeholder="ms" />

          <button className={styles.addBtn} onClick={handleAdd}>+ Add</button>
        </div>
      </div>

      <div className={styles.entries}>
        {entries.length === 0 && (
          <p className={styles.empty}>No animations yet — add one above.</p>
        )}
        {entries.map((entry, i) => {
          const objLabel = objects.find((o) => o.id === entry.target)
          const label = objLabel?.text ?? objLabel?.asset ?? objLabel?.id.slice(0, 8) ?? entry.target.slice(0, 8)
          return (
            <div key={i} className={styles.entry}>
              <span className={styles.entryTarget}>{label}</span>
              <span className={styles.entryProp}>{entry.type}</span>
              <span className={styles.entryVal}>→ {entry.value}</span>
              <span className={styles.entryDur}>{entry.duration}ms</span>
              <span className={styles.entryRepeat}>
                {entry.repeat === -1 ? '∞' : `×${entry.repeat ?? 1}`}
                {entry.yoyo ? ' ↔' : ''}
              </span>
              <button className={styles.delBtn} onClick={() => removeTimelineEntry(i)}>✕</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
