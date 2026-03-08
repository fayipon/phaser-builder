import type { BannerDSL, BannerSize } from '../dsl'
import { templates } from '../templates/presets'
import { applyTemplate } from '../templates'

export interface GenerateRequest {
  game_name: string
  jackpot_amount?: string
  promotion_text?: string
  cta_text?: string
  banner_size?: string
}

/**
 * Deterministic "AI" generator: picks the best-matching template,
 * fills placeholders, adjusts size and returns a ready-to-use BannerDSL.
 *
 * A real implementation would call an LLM endpoint; this keeps
 * the project self-contained with zero external dependencies.
 */
export function generateBanner(req: GenerateRequest): BannerDSL {
  // Pick template based on available fields
  const templateId = pickTemplate(req)
  const template = templates.find((t) => t.id === templateId) ?? templates[0]

  const vars: Record<string, string> = {
    game_name: req.game_name || 'My Game',
    jackpot_amount: req.jackpot_amount || '$10,000',
    promotion_text: req.promotion_text || 'Free Spins!',
    cta_text: req.cta_text || 'PLAY NOW →',
  }

  const dsl = applyTemplate(template, vars)

  // Override size if requested
  if (req.banner_size) {
    const [w, h] = req.banner_size.split('x').map(Number)
    if (w && h) {
      const scale = scaleForSize(template.dsl.size, { width: w, height: h })
      dsl.size = { width: w, height: h }
      dsl.objects.forEach((obj) => {
        obj.x = Math.round(obj.x * scale.sx)
        obj.y = Math.round(obj.y * scale.sy)
      })
    }
  }

  return dsl
}

function pickTemplate(req: GenerateRequest): string {
  if (req.jackpot_amount && req.promotion_text) return 'big_win'
  if (req.promotion_text) return 'free_spin'
  return 'slot_jackpot'
}

function scaleForSize(
  from: BannerSize,
  to: BannerSize,
): { sx: number; sy: number } {
  return {
    sx: to.width / from.width,
    sy: to.height / from.height,
  }
}
