/** Shared slide data — imported by both BannerScene (bg/accent) and BannerDemoPage (text overlay). */
export interface BannerSlide {
  /** Phaser fill colour (number) */
  bg: number
  /** Phaser fill colour (number) */
  accent: number
  /** CSS hex string derived from accent */
  accentHex: string
  title: string
  sub: string
}

export const BANNER_SLIDES: BannerSlide[] = [
  {
    bg: 0x0d3a58,
    accent: 0x7ac8e8,
    accentHex: '#7ac8e8',
    title: '神奈川沖浪裏',
    sub: 'The Great Wave — Katsushika Hokusai, c. 1831',
  },
  {
    bg: 0x220800,
    accent: 0xff5500,
    accentHex: '#ff5500',
    title: '吶喊',
    sub: 'After Edvard Munch, 1893 — pixel distortion',
  },
  {
    bg: 0xc01020,
    accent: 0xffc200,
    accentHex: '#ffc200',
    title: 'CRISPY！',
    sub: 'Jollibee Chickenjoy — 咋下的瞬間',
  },
]

export const BANNER_TOTAL = BANNER_SLIDES.length
