/** Typed event map — extend as needed. */
export interface GameEvents {
  // scene → react
  'scene:ready': { scene: string }
  'scene:destroy': { scene: string }
  // react → scene
  'ui:resize': { width: number; height: number }

  // ── Banner Demo ───────────────────────────────────────────
  /** React → Phaser: jump to a specific slide */
  'banner:goto': { index: number }
  /** Phaser → React: current slide changed */
  'banner:changed': { index: number }
}

type Handler<T> = (payload: T) => void

class EventBus {
  private listeners = new Map<string, Set<Handler<unknown>>>()

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    this.listeners.get(event as string)?.forEach((fn) => fn(payload as unknown))
  }

  on<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): void {
    if (!this.listeners.has(event as string)) {
      this.listeners.set(event as string, new Set())
    }
    this.listeners.get(event as string)!.add(handler as Handler<unknown>)
  }

  off<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): void {
    this.listeners.get(event as string)?.delete(handler as Handler<unknown>)
  }
}

/** Singleton shared between Phaser scenes and React components. */
export const bus = new EventBus()
