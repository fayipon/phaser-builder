import type { BannerTemplate } from './index'

export const slotJackpot: BannerTemplate = {
  id: 'slot_jackpot',
  name: 'Slot Jackpot',
  description: 'Classic jackpot celebration with coin rain particles',
  dsl: {
    size: { width: 728, height: 90 },
    assets: [],
    objects: [
      {
        id: 'bg',
        type: 'text',
        x: 364,
        y: 45,
        text: '',
        depth: 0,
        style: { fontSize: 1 },
      },
      {
        id: 'title',
        type: 'text',
        x: 200,
        y: 26,
        text: '🎰 {{game_name}}',
        style: { fontSize: 22, color: '#FFD700', fontStyle: 'bold', align: 'center' },
        depth: 2,
      },
      {
        id: 'jackpot',
        type: 'text',
        x: 200,
        y: 56,
        text: '💰 JACKPOT {{jackpot_amount}}',
        style: { fontSize: 16, color: '#FFFFFF', align: 'center' },
        depth: 2,
      },
      {
        id: 'cta',
        type: 'text',
        x: 580,
        y: 45,
        text: '{{cta_text}}',
        style: { fontSize: 14, color: '#0c0c1a', fontStyle: 'bold', align: 'center' },
        depth: 3,
      },
      {
        id: 'coins',
        type: 'particle',
        x: 364,
        y: 0,
        particlePreset: 'coin_rain',
        depth: 1,
      },
    ],
    timeline: [
      { target: 'title', type: 'scale', value: 1.1, duration: 600, ease: 'Sine.easeInOut', repeat: -1, yoyo: true },
      { target: 'jackpot', type: 'alpha', value: 0.6, duration: 800, ease: 'Sine.easeInOut', repeat: -1, yoyo: true },
      { target: 'cta', type: 'y', value: 42, duration: 500, ease: 'Bounce.easeOut', repeat: -1, yoyo: true },
    ],
  },
}

export const freeSpin: BannerTemplate = {
  id: 'free_spin',
  name: 'Free Spin Promo',
  description: 'Free-spin promotion banner with sparkle effects',
  dsl: {
    size: { width: 300, height: 250 },
    assets: [],
    objects: [
      {
        id: 'headline',
        type: 'text',
        x: 150,
        y: 60,
        text: '🎡 {{promotion_text}}',
        style: { fontSize: 20, color: '#00E5FF', fontStyle: 'bold', align: 'center' },
        depth: 2,
      },
      {
        id: 'sub',
        type: 'text',
        x: 150,
        y: 110,
        text: '{{game_name}}',
        style: { fontSize: 16, color: '#FFFFFF', align: 'center' },
        depth: 2,
      },
      {
        id: 'cta',
        type: 'text',
        x: 150,
        y: 200,
        text: '{{cta_text}}',
        style: { fontSize: 16, color: '#111', fontStyle: 'bold', align: 'center' },
        depth: 3,
      },
      {
        id: 'sparks',
        type: 'particle',
        x: 150,
        y: 125,
        particlePreset: 'sparkles',
        depth: 1,
      },
    ],
    timeline: [
      { target: 'headline', type: 'scale', value: 1.05, duration: 700, ease: 'Sine.easeInOut', repeat: -1, yoyo: true },
      { target: 'cta', type: 'alpha', value: 0.5, duration: 600, ease: 'Sine.easeInOut', repeat: -1, yoyo: true },
    ],
  },
}

export const bigWin: BannerTemplate = {
  id: 'big_win',
  name: 'Big Win Celebration',
  description: 'Explosive big-win celebration with confetti',
  dsl: {
    size: { width: 1080, height: 1080 },
    assets: [],
    objects: [
      {
        id: 'title',
        type: 'text',
        x: 540,
        y: 300,
        text: '🏆 BIG WIN!',
        style: { fontSize: 64, color: '#FFD700', fontStyle: 'bold', align: 'center' },
        depth: 2,
      },
      {
        id: 'amount',
        type: 'text',
        x: 540,
        y: 450,
        text: '{{jackpot_amount}}',
        style: { fontSize: 48, color: '#FFFFFF', fontStyle: 'bold', align: 'center' },
        depth: 2,
      },
      {
        id: 'game',
        type: 'text',
        x: 540,
        y: 560,
        text: '{{game_name}}',
        style: { fontSize: 28, color: '#AAB3FF', align: 'center' },
        depth: 2,
      },
      {
        id: 'cta',
        type: 'text',
        x: 540,
        y: 750,
        text: '{{cta_text}}',
        style: { fontSize: 24, color: '#0c0c1a', fontStyle: 'bold', align: 'center' },
        depth: 3,
      },
      {
        id: 'confetti',
        type: 'particle',
        x: 540,
        y: 0,
        particlePreset: 'confetti',
        depth: 1,
      },
    ],
    timeline: [
      { target: 'title', type: 'scale', value: 1.15, duration: 800, ease: 'Bounce.easeOut', repeat: -1, yoyo: true },
      { target: 'amount', type: 'y', value: 440, duration: 600, ease: 'Sine.easeInOut', repeat: -1, yoyo: true },
      { target: 'confetti', type: 'alpha', value: 0.7, duration: 1000, ease: 'Sine.easeInOut', repeat: -1, yoyo: true },
    ],
  },
}

export const templates: import('./index').BannerTemplate[] = [slotJackpot, freeSpin, bigWin]
