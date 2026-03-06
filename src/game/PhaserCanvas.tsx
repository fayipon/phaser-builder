import { useLayoutEffect, useRef } from 'react'
import Phaser from 'phaser'

interface Props {
  // Pass the scene class (not an instance)
  sceneClass: new () => Phaser.Scene
  className?: string
  style?: React.CSSProperties
}

/**
 * Mounts a single-scene Phaser.Game inside a div.
 * The game fills its parent container and is destroyed on unmount.
 */
export default function PhaserCanvas({ sceneClass, className, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

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
      audio: { noAudio: true },
      banner: false,
    })

    return () => {
      game.destroy(true)
    }
  // sceneClass identity is stable (class reference), so this is fine
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    />
  )
}
