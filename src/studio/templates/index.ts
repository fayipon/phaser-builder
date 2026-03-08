import type { BannerDSL } from '../dsl'

export interface BannerTemplate {
  id: string
  name: string
  description: string
  /** The DSL blueprint — text objects may contain {{placeholder}} tokens */
  dsl: BannerDSL
}

/**
 * Replace `{{key}}` placeholders in all text objects with values from `vars`.
 * Returns a deep-cloned DSL — original is untouched.
 */
export function applyTemplate(
  template: BannerTemplate,
  vars: Record<string, string>,
): BannerDSL {
  const json = JSON.stringify(template.dsl)
  const filled = json.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = vars[key]
    return val !== undefined ? escapeJson(val) : `{{${key}}}`
  })
  return JSON.parse(filled) as BannerDSL
}

/** Escape a value so it's safe inside a JSON string */
function escapeJson(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}
