import { useLayoutEffect, useEffect, useRef } from 'react'
import Phaser from 'phaser'

interface Props {
  sceneClass: new () => Phaser.Scene
  className?: string
  style?: React.CSSProperties
  /** When false the Phaser game loop sleeps (zero CPU/GPU). */
  active?: boolean
}

/**
 * Mounts a single-scene Phaser.Game inside a div.
 * The game fills its parent container and is destroyed on unmount.
 */
export default function PhaserCanvas({ sceneClass, className, style, active = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useLayoutEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: el,
      width: el.offsetWidth || 800,
      height: el.offsetHeight || 450,
      backgroundColor: '#06111f',
      scene: [sceneClass],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: true,
        pixelArt: false,
      },
      fps: { target: 30, limit: 30 },
      audio: { noAudio: true },
      banner: false,
    })
    gameRef.current = game

    return () => {
      gameRef.current = null
      game.destroy(true)
    }
  // sceneClass identity is stable (class reference), so this is fine
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Sleep / wake the game loop based on visibility */
  useEffect(() => {
    const game = gameRef.current
    if (!game?.loop) return
    if (active) game.loop.wake()
    else game.loop.sleep()
  }, [active])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    />
  )
}
