import Phaser from 'phaser'

/** Base Phaser.Game config shared by all page instances.
 *  Each page that embeds a Phaser canvas should spread this and
 *  supply its own `parent` DOM id and `scene` array. */
export const baseConfig: Omit<Phaser.Types.Core.GameConfig, 'parent' | 'scene'> = {
  type: Phaser.AUTO,
  backgroundColor: '#0d0d1a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: import.meta.env.DEV },
  },
}
