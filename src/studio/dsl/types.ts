/** Banner DSL — the canonical JSON format for banners. */

export interface BannerSize {
  width: number
  height: number
}

export interface TextStyle {
  fontFamily?: string
  fontSize?: number
  color?: string
  fontStyle?: string
  align?: string
  stroke?: string
  strokeThickness?: number
  wordWrap?: { width: number }
}

export interface BannerObject {
  id: string
  type: 'image' | 'text' | 'sprite' | 'particle' | 'container'
  x: number
  y: number
  scale?: number
  scaleX?: number
  scaleY?: number
  rotation?: number
  alpha?: number
  depth?: number
  /** image / sprite: asset filename */
  asset?: string
  /** text: rendered string */
  text?: string
  /** text: style config */
  style?: TextStyle
  /** sprite: frame config */
  frameWidth?: number
  frameHeight?: number
  startFrame?: number
  endFrame?: number
  frameRate?: number
  /** particle: preset name */
  particlePreset?: ParticlePresetName
  /** container: child object IDs */
  children?: string[]
}

export interface TimelineEntry {
  target: string
  type: 'x' | 'y' | 'scale' | 'scaleX' | 'scaleY' | 'rotation' | 'alpha'
  value: number
  duration: number
  delay?: number
  ease?: string
  repeat?: number
  yoyo?: boolean
}

export interface BannerDSL {
  size: BannerSize
  assets: string[]
  objects: BannerObject[]
  timeline: TimelineEntry[]
}

export type ParticlePresetName =
  | 'coin_rain'
  | 'sparkles'
  | 'confetti'
  | 'jackpot_explosion'

export const BANNER_SIZES: Record<string, BannerSize> = {
  '728x90':    { width: 728,  height: 90 },
  '300x250':   { width: 300,  height: 250 },
  '160x600':   { width: 160,  height: 600 },
  '1080x1080': { width: 1080, height: 1080 },
  '1920x1080': { width: 1920, height: 1080 },
}
