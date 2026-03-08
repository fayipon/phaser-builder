import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { BannerDSL, BannerObject, BannerSize, TimelineEntry } from '../dsl'

export interface EditorState {
  /** The banner currently being edited */
  banner: BannerDSL

  /** Currently selected object id (null = none) */
  selectedId: string | null

  /** Is the timeline playing? */
  playing: boolean

  // ── Actions ────────────────────────────────────
  setBannerSize: (size: BannerSize) => void
  loadBanner: (dsl: BannerDSL) => void
  addObject: (partial: Omit<BannerObject, 'id'>) => string
  updateObject: (id: string, patch: Partial<BannerObject>) => void
  removeObject: (id: string) => void
  selectObject: (id: string | null) => void
  reorderObject: (id: string, newDepth: number) => void
  addTimelineEntry: (entry: TimelineEntry) => void
  removeTimelineEntry: (index: number) => void
  updateTimelineEntry: (index: number, patch: Partial<TimelineEntry>) => void
  setPlaying: (p: boolean) => void
  exportDSL: () => BannerDSL
  reset: () => void
}

const defaultBanner = (): BannerDSL => ({
  size: { width: 728, height: 90 },
  assets: [],
  objects: [],
  timeline: [],
})

export const useEditorStore = create<EditorState>((set, get) => ({
  banner: defaultBanner(),
  selectedId: null,
  playing: false,

  setBannerSize: (size) =>
    set((s) => ({ banner: { ...s.banner, size } })),

  loadBanner: (dsl) =>
    set({ banner: dsl, selectedId: null, playing: false }),

  addObject: (partial) => {
    const id = uuid()
    const obj: BannerObject = { id, ...partial }
    set((s) => {
      const assets = [...s.banner.assets]
      if (obj.asset && !assets.includes(obj.asset)) assets.push(obj.asset)
      return {
        banner: {
          ...s.banner,
          objects: [...s.banner.objects, obj],
          assets,
        },
        selectedId: id,
      }
    })
    return id
  },

  updateObject: (id, patch) =>
    set((s) => ({
      banner: {
        ...s.banner,
        objects: s.banner.objects.map((o) =>
          o.id === id ? { ...o, ...patch } : o,
        ),
      },
    })),

  removeObject: (id) =>
    set((s) => ({
      banner: {
        ...s.banner,
        objects: s.banner.objects.filter((o) => o.id !== id),
        timeline: s.banner.timeline.filter((t) => t.target !== id),
      },
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  selectObject: (id) => set({ selectedId: id }),

  reorderObject: (id, newDepth) =>
    set((s) => ({
      banner: {
        ...s.banner,
        objects: s.banner.objects.map((o) =>
          o.id === id ? { ...o, depth: newDepth } : o,
        ),
      },
    })),

  addTimelineEntry: (entry) =>
    set((s) => ({
      banner: {
        ...s.banner,
        timeline: [...s.banner.timeline, entry],
      },
    })),

  removeTimelineEntry: (index) =>
    set((s) => ({
      banner: {
        ...s.banner,
        timeline: s.banner.timeline.filter((_, i) => i !== index),
      },
    })),

  updateTimelineEntry: (index, patch) =>
    set((s) => ({
      banner: {
        ...s.banner,
        timeline: s.banner.timeline.map((t, i) =>
          i === index ? { ...t, ...patch } : t,
        ),
      },
    })),

  setPlaying: (p) => set({ playing: p }),

  exportDSL: () => {
    const { banner } = get()
    // Rebuild assets list from objects
    const assetSet = new Set<string>()
    banner.objects.forEach((o) => {
      if (o.asset) assetSet.add(o.asset)
    })
    return { ...banner, assets: [...assetSet] }
  },

  reset: () => set({ banner: defaultBanner(), selectedId: null, playing: false }),
}))
