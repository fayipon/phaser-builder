import Phaser from 'phaser'
import type { ParticlePresetName } from '../dsl'

/** Returns a Phaser particle emitter config for a named preset. */
export function getParticleConfig(
  preset: ParticlePresetName,
  w: number,
  h: number,
): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig {
  switch (preset as ParticlePresetName) {
    case 'coin_rain':
      return {
        x: { min: 0, max: w },
        y: -10,
        speed: { min: 80, max: 200 },
        angle: { min: 80, max: 100 },
        lifespan: 3000,
        quantity: 2,
        frequency: 120,
        scale: { start: 0.4, end: 0.1 },
        alpha: { start: 1, end: 0.2 },
        tint: 0xffd700,
      }
    case 'sparkles':
      return {
        x: w / 2,
        y: h / 2,
        speed: { min: 30, max: 100 },
        angle: { min: 0, max: 360 },
        lifespan: 1200,
        quantity: 1,
        frequency: 80,
        scale: { start: 0.3, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: [0xffffff, 0xffffaa, 0xaaffff],
        blendMode: 'ADD',
      }
    case 'confetti':
      return {
        x: { min: 0, max: w },
        y: -5,
        speed: { min: 50, max: 160 },
        angle: { min: 70, max: 110 },
        lifespan: 4000,
        quantity: 3,
        frequency: 100,
        scale: { start: 0.35, end: 0.2 },
        rotate: { min: 0, max: 360 },
        tint: [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff],
      }
    case 'jackpot_explosion':
      return {
        x: w / 2,
        y: h / 2,
        speed: { min: 120, max: 350 },
        angle: { min: 0, max: 360 },
        lifespan: 1500,
        quantity: 30,
        frequency: -1, // one-shot
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: 0xffd700,
        blendMode: 'ADD',
      }
    default:
      return { x: w / 2, y: h / 2, speed: 50, lifespan: 1000 }
  }
}
