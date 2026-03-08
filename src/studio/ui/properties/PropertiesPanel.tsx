import { useEditorStore } from '../../store/editorStore'
import type { BannerObject } from '../../dsl'
import styles from './PropertiesPanel.module.css'

export default function PropertiesPanel() {
  const { selectedId, banner, updateObject } = useEditorStore()
  const obj = banner.objects.find((o) => o.id === selectedId)

  if (!obj) {
    return (
      <aside className={styles.panel}>
        <p className={styles.empty}>Select an object to edit its properties.</p>
      </aside>
    )
  }

  const set = (patch: Partial<BannerObject>) => updateObject(obj.id, patch)

  return (
    <aside className={styles.panel}>
      <h3 className={styles.heading}>Properties</h3>

      <div className={styles.section}>
        <label className={styles.label}>Type</label>
        <span className={styles.value}>{obj.type}</span>
      </div>

      <Row label="X" value={obj.x} onChange={(v) => set({ x: v })} />
      <Row label="Y" value={obj.y} onChange={(v) => set({ y: v })} />
      <Row label="Scale" value={obj.scale ?? 1} onChange={(v) => set({ scale: v })} step={0.1} />
      <Row label="Rotation" value={obj.rotation ?? 0} onChange={(v) => set({ rotation: v })} step={0.1} />
      <Row label="Alpha" value={obj.alpha ?? 1} onChange={(v) => set({ alpha: v })} step={0.05} min={0} max={1} />
      <Row label="Depth" value={obj.depth ?? 0} onChange={(v) => set({ depth: v })} />

      {obj.type === 'text' && (
        <>
          <div className={styles.section}>
            <label className={styles.label}>Text</label>
            <input
              className={styles.input}
              value={obj.text ?? ''}
              onChange={(e) => set({ text: e.target.value })}
            />
          </div>
          <div className={styles.section}>
            <label className={styles.label}>Font Size</label>
            <input
              className={styles.inputNum}
              type="number"
              value={obj.style?.fontSize ?? 24}
              onChange={(e) =>
                set({ style: { ...obj.style, fontSize: Number(e.target.value) } })
              }
            />
          </div>
          <div className={styles.section}>
            <label className={styles.label}>Color</label>
            <input
              className={styles.inputColor}
              type="color"
              value={obj.style?.color ?? '#ffffff'}
              onChange={(e) =>
                set({ style: { ...obj.style, color: e.target.value } })
              }
            />
          </div>
        </>
      )}

      {obj.type === 'image' && (
        <div className={styles.section}>
          <label className={styles.label}>Asset</label>
          <input
            className={styles.input}
            value={obj.asset ?? ''}
            onChange={(e) => set({ asset: e.target.value })}
            placeholder="filename.png"
          />
        </div>
      )}
    </aside>
  )
}

function Row({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
}) {
  return (
    <div className={styles.section}>
      <label className={styles.label}>{label}</label>
      <input
        className={styles.inputNum}
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
