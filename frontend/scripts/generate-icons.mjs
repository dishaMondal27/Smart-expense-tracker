import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// CRC32 table
const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  crcTable[n] = c
}

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function makeChunk(type, data) {
  const len = data.length
  const buf = Buffer.alloc(12 + len)
  buf.writeUInt32BE(len, 0)
  buf.write(type, 4)
  data.copy(buf, 8)
  const crc = crc32(buf.subarray(4, 8 + len))
  buf.writeUInt32BE(crc, 8 + len)
  return buf
}

function createPng(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr)

  // Uncompressed raw scanlines: each row starts with filter byte 0
  const rowStride = 1 + width * 4
  const rawData = Buffer.alloc(height * rowStride)

  // Colors:
  // Primary Stitch Green: #006948 -> R:0, G:105, B:72
  // White: R:255, G:255, B:255
  // Mint Accent: #85F8C4 -> R:133, G:248, B:196
  // Deep Background / Border: #004D34 -> R:0, G:77, B:52

  const cx = width / 2
  const cy = height / 2
  const rCorner = isMaskable ? 0 : width * 0.22

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride
    rawData[rowOffset] = 0 // Filter type None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4

      // Background rounded rect check (or full for maskable)
      let inCard = false
      if (isMaskable) {
        inCard = true
      } else {
        // Rounded rectangle test
        const dx = Math.abs(x - cx) - (width / 2 - rCorner)
        const dy = Math.abs(y - cy) - (height / 2 - rCorner)
        if (dx <= 0 || dy <= 0) {
          inCard = true
        } else {
          inCard = (dx * dx + dy * dy) <= (rCorner * rCorner)
        }
      }

      if (!inCard) {
        // Transparent
        rawData[pxOffset] = 0
        rawData[pxOffset + 1] = 0
        rawData[pxOffset + 2] = 0
        rawData[pxOffset + 3] = 0
        continue
      }

      // Base background: Stitch Primary Green #006948
      let r = 0, g = 105, b = 72, a = 255

      // Subtly lighter center glow
      const distFromCenter = Math.hypot(x - cx, y - cy) / (width * 0.5)
      if (distFromCenter < 1) {
        const glow = Math.floor((1 - distFromCenter) * 18)
        g = Math.min(255, g + glow)
        b = Math.min(255, b + glow)
      }

      // Wallet Motif centered inside safe zone (scale according to size)
      // Safe zone width: width * 0.44
      const scale = width / 192
      const wx = (x - cx) / scale
      const wy = (y - cy) / scale

      // Outer Wallet Body: wx in [-38, 38], wy in [-26, 28] with rounded corners
      const inWalletBody = (wx >= -38 && wx <= 38 && wy >= -24 && wy <= 28)
      // Wallet flap / fold line at top: wy between -24 and -14
      const inWalletFlap = (wx >= -38 && wx <= 38 && wy >= -28 && wy <= -14)

      // Inner card poking out: wx in [-28, 28], wy in [-34, -22]
      const inCardSlot = (wx >= -26 && wx <= 26 && wy >= -34 && wy <= -20)

      // Latch on right side: wx in [14, 40], wy in [-4, 14]
      const inLatch = (wx >= 16 && wx <= 40 && wy >= -4 && wy <= 14)
      const inLatchCoin = (Math.hypot(wx - 28, wy - 5) <= 4.5)

      // Dollar / Coin motif in center: circle around wx: -6, wy: 4
      const inCenterCoin = (Math.hypot(wx + 4, wy + 2) <= 13)
      const inCenterCoinHole = (Math.hypot(wx + 4, wy + 2) <= 10.5)

      // Dollar sign bar wx in [-7, -1], wy in [-7, 11]
      const inDollarStem = (wx >= -6 && wx <= -2 && wy >= -7 && wy <= 11)
      const inDollarTopArc = (Math.hypot(wx + 4, wy - 2) <= 5 && wy <= -1 && Math.hypot(wx + 4, wy - 2) >= 2.5)
      const inDollarBotArc = (Math.hypot(wx + 4, wy + 5) <= 5 && wy >= 3 && Math.hypot(wx + 4, wy + 5) >= 2.5)

      if (inCardSlot) {
        // Mint card sticking out
        r = 133
        g = 248
        b = 196
      } else if (inLatchCoin) {
        // Gold / Mint latch fastener
        r = 255
        g = 255
        b = 255
      } else if (inLatch) {
        // Latch strap
        r = 0
        g = 77
        b = 52
      } else if (inCenterCoin && !inCenterCoinHole) {
        // Crisp white ring for currency motif
        r = 255
        g = 255
        b = 255
      } else if (inDollarStem || inDollarTopArc || inDollarBotArc) {
        // White currency glyph
        r = 255
        g = 255
        b = 255
      } else if (inWalletFlap) {
        // Slightly darker leather flap
        r = 0
        g = 85
        b = 58
      } else if (inWalletBody) {
        // Pure White / Off-white wallet container for crisp contrast
        r = 255
        g = 255
        b = 255
        // If it's the body background behind the coin, let's keep it mint-white #E8FBF2
        r = 232
        g = 251
        b = 242
      }

      rawData[pxOffset] = r
      rawData[pxOffset + 1] = g
      rawData[pxOffset + 2] = b
      rawData[pxOffset + 3] = a
    }
  }

  const deflated = zlib.deflateSync(rawData, { level: 9 })
  const idatChunk = makeChunk('IDAT', deflated)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

const publicDir = path.resolve(__dirname, '..', 'public')
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

// 1. 192x192
const pwa192 = createPng(192, 192, false)
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192)
console.log('Created pwa-192x192.png')

// 2. 512x512
const pwa512 = createPng(512, 512, false)
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512)
console.log('Created pwa-512x512.png')

// 3. Maskable 512x512 (edge-to-edge background)
const maskable512 = createPng(512, 512, true)
fs.writeFileSync(path.join(publicDir, 'maskable-icon-512x512.png'), maskable512)
console.log('Created maskable-icon-512x512.png')

// 4. Apple Touch Icon 180x180
const apple180 = createPng(180, 180, false)
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), apple180)
console.log('Created apple-touch-icon.png')
