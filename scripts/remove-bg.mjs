/**
 * Remove solid/near-solid background from farm-guide.jpg and save as PNG.
 * Uses a BFS flood-fill from all four corners with a colour-tolerance check.
 */
import { Jimp, intToRGBA, rgbaToInt } from 'jimp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC  = path.resolve(__dirname, '../public/assets/farm-guide.jpg')
const DEST = path.resolve(__dirname, '../public/assets/farm-guide.png')
const TOLERANCE = 52   // colour distance threshold (0-255, higher = remove more)

function colorDist(a, b) {
  return Math.sqrt(
    (a.r - b.r) ** 2 +
    (a.g - b.g) ** 2 +
    (a.b - b.b) ** 2
  )
}

const img  = await Jimp.read(SRC)
const { width: W, height: H } = img.bitmap

// ------------------------------------------------------------------
// BFS flood-fill from all four corners
// ------------------------------------------------------------------

// Sample background colour as average of the four outermost corners
const corners = [
  intToRGBA(img.getPixelColor(0,   0)),
  intToRGBA(img.getPixelColor(W-1, 0)),
  intToRGBA(img.getPixelColor(0,   H-1)),
  intToRGBA(img.getPixelColor(W-1, H-1)),
]
const bgColor = {
  r: Math.round(corners.reduce((s, c) => s + c.r, 0) / 4),
  g: Math.round(corners.reduce((s, c) => s + c.g, 0) / 4),
  b: Math.round(corners.reduce((s, c) => s + c.b, 0) / 4),
}
console.log('Background colour (averaged corners):', bgColor)

const visited = new Uint8Array(W * H)
const TRANSPARENT = rgbaToInt(0, 0, 0, 0)

const queue = []
const seed = (x, y) => {
  const idx = y * W + x
  if (visited[idx]) return
  const c = intToRGBA(img.getPixelColor(x, y))
  if (colorDist(c, bgColor) <= TOLERANCE) {
    visited[idx] = 1
    queue.push(x, y)
  }
}

// Prime BFS from all edges for a thorough background capture
for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H - 1) }
for (let y = 0; y < H; y++) { seed(0, y); seed(W - 1, y) }

const DX = [1, -1, 0,  0]
const DY = [0,  0, 1, -1]

let qi = 0
while (qi < queue.length) {
  const x = queue[qi++]
  const y = queue[qi++]
  img.setPixelColor(TRANSPARENT, x, y)

  for (let d = 0; d < 4; d++) {
    const nx = x + DX[d]
    const ny = y + DY[d]
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
    const nidx = ny * W + nx
    if (visited[nidx]) continue
    const nc = intToRGBA(img.getPixelColor(nx, ny))
    if (colorDist(nc, bgColor) <= TOLERANCE) {
      visited[nidx] = 1
      queue.push(nx, ny)
    }
  }
}

await img.write(DEST)
console.log(`Saved → ${DEST}`)
