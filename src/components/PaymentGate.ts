import * as fs from 'node:fs'
import * as path from 'node:path'
import * as readline from 'node:readline'
import { BRAND_ACCENT_RGB } from '../constants/brand.js'
import { RESET } from './StartupScreen.js'

// ─── Config ───────────────────────────────────────────────────────────────────

const PAYMENT_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '/tmp', '.wormgpt')
const PAYMENT_FILE = path.join(PAYMENT_DIR, 'payment.json')

const ACCENT = parseRgb(BRAND_ACCENT_RGB) // [220, 40, 40]
const DIM = [100, 100, 100]
const CREAM = [230, 210, 190]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseRgb(rgb: string): [number, number, number] {
  const m = rgb.match(/\d+/g)
  if (!m || m.length < 3) return [220, 40, 40]
  return [Number(m[0]), Number(m[1]), Number(m[2])]
}

function ansiRgb(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`
}

function center(text: string, width: number): string {
  const pad = Math.max(0, width - text.length)
  const left = Math.floor(pad / 2)
  const right = pad - left
  return ' '.repeat(left) + text + ' '.repeat(right)
}

function renderBox(title: string, lines: string[], width: number): string[] {
  const out: string[] = []
  const top = `\x1b[38;2;${ACCENT[0]};${ACCENT[1]};${ACCENT[2]}m\u2554${'\u2550'.repeat(width - 2)}\u2557${RESET}`
  const bot = `\x1b[38;2;${ACCENT[0]};${ACCENT[1]};${ACCENT[2]}m\u255a${'\u2550'.repeat(width - 2)}\u255d${RESET}`
  const sep = `\x1b[38;2;${ACCENT[0]};${ACCENT[1]};${ACCENT[2]}m\u2551${RESET}`
  out.push('')
  out.push(top)
  if (title) {
    const padded = center(` ${title} `, width)
    out.push(`${sep}${ansiRgb(...ACCENT)}\x1b[1m${padded}${RESET}${sep}`)
    out.push(`\x1b[38;2;${ACCENT[0]};${ACCENT[1]};${ACCENT[2]}m\u2560${'\u2550'.repeat(width - 2)}\u2563${RESET}`)
  }
  for (const line of lines) {
    const padded = line.length > width - 4
      ? line.slice(0, width - 7) + '...'
      : ' ' + line + ' '.repeat(width - 3 - line.length)
    out.push(`${sep}${padded}${sep}`)
  }
  out.push(bot)
  out.push('')
  return out
}

// ─── Payment State ────────────────────────────────────────────────────────────

type PaymentState = {
  paid: boolean
  paymentDate?: string
  transactionId?: string
  apiKey?: string
}

function loadPaymentState(): PaymentState | null {
  try {
    if (fs.existsSync(PAYMENT_FILE)) {
      return JSON.parse(fs.readFileSync(PAYMENT_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return null
}

function savePaymentState(state: PaymentState): void {
  try {
    if (!fs.existsSync(PAYMENT_DIR)) {
      fs.mkdirSync(PAYMENT_DIR, { recursive: true })
    }
    fs.writeFileSync(PAYMENT_FILE, JSON.stringify(state, null, 2), 'utf-8')
  } catch { /* ignore */ }
}

function generateApiKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segments: string[] = []
  for (let s = 0; s < 3; s++) {
    let seg = ''
    for (let i = 0; i < 14; i++) {
      seg += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    segments.push(seg)
  }
  return `sk-wormgpt-${segments.join('-')}`
}

function confirmPaid(): PaymentState {
  const state: PaymentState = {
    paid: true,
    paymentDate: new Date().toISOString(),
    apiKey: generateApiKey(),
  }
  savePaymentState(state)
  return state
}

// ─── Payment Gate Screen ──────────────────────────────────────────────────────

function clearScreen(): void {
  process.stdout.write('\x1b[2J\x1b[H')
}

function printPaymentGate(): void {
  clearScreen()

  const W = 66
  const LINE = '\u2500'.repeat(W - 2)

  // ── Header ──
  process.stdout.write(`\n${center('', W)}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\x1b[1m${center('WORMGPT — PAYMENT REQUIRED', W)}${RESET}\n`)
  process.stdout.write(`${ansiRgb(...DIM)}${center('One-time payment to unlock full access', W)}${RESET}\n`)
  process.stdout.write(`\n${ansiRgb(...ACCENT)}\u2554${LINE}\u2557${RESET}\n`)

  // ── Payment Address ──
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET} ${ansiRgb(...ACCENT)}\x1b[1mPAY 100\xa3 USDT${RESET}                                    ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET} ${ansiRgb(...DIM)}Network:${RESET} ERC20 or BEP20                             ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET} ${ansiRgb(...DIM)}Address:${RESET} ${ansiRgb(...CREAM)}0x4bb852a6873c366ba3736ccfddc2798aacd4527a${RESET} ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2560${LINE}\u2563${RESET}\n`)

  // ── After Payment ──
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET} ${ansiRgb(...CREAM)}\x1b[1mYou will receive:${RESET}                                ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET}   ${ansiRgb(...CREAM)}\u2713${RESET} WormGPT ${ansiRgb(...DIM)}full CLI access${RESET}                        ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET}   ${ansiRgb(...CREAM)}\u2713${RESET} ${ansiRgb(...DIM)}Generated API key for all models${RESET}                ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET}   ${ansiRgb(...CREAM)}\u2713${RESET} ${ansiRgb(...DIM)}Priority support${RESET}                               ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2560${LINE}\u2563${RESET}\n`)

  // ── API Keys Preview ──
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET} ${ansiRgb(...ACCENT)}\x1b[1mAvailable API keys after payment:${RESET}                   ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET} ${ansiRgb(...DIM)}  sk-hPnOGNKndA8nSWUr0hdn6xyJpKaYRQzr1...${RESET}               ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET} ${ansiRgb(...DIM)}  sk-JJOutZmWtCEubZBXtM4Q7Frz8SMRPvl...${RESET}                 ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET} ${ansiRgb(...DIM)}  sk-VlvkpKyBkQLpSGErptqWmtivbkZRiDE...${RESET}                 ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2560${LINE}\u2563${RESET}\n`)

  // ── Instructions ──
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET} ${ansiRgb(...CREAM)}\x1b[1mInstructions:${RESET}                                     ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET} ${ansiRgb(...DIM)}  1. Send exactly 100\xa3 USDT (ERC20 or BEP20)${RESET}             ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET} ${ansiRgb(...DIM)}  2. Wait for network confirmation${RESET}                         ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET} ${ansiRgb(...DIM)}  3. Type ${ansiRgb(...CREAM)}\x1b[1mPAID <tx-hash>${RESET}${ansiRgb(...DIM)} or just ${ansiRgb(...CREAM)}\x1b[1mPAID${RESET}${ansiRgb(...DIM)} to confirm${RESET}    ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET} ${ansiRgb(...DIM)}  4. Your API key will be generated automatically${RESET}          ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u2551${RESET} ${ansiRgb(...DIM)}  5. Restart WormGPT to start using it${RESET}                     ${ansiRgb(...ACCENT)}\u2551${RESET}\n`)
  process.stdout.write(`${ansiRgb(...ACCENT)}\u255a${LINE}\u255d${RESET}\n`)
  process.stdout.write(`\n${ansiRgb(...DIM)}  Payment is verified locally. Send the exact amount above,${RESET}\n`)
  process.stdout.write(`${ansiRgb(...DIM)}  type PAID to confirm, and your API key will be generated.${RESET}\n\n`)
}

export async function showPaymentGate(): Promise<void> {
  // Check if already paid
  const state = loadPaymentState()
  if (state?.paid) {
    return // Already paid, skip gate
  }

  // Show the payment gate (unless CI or non-TTY)
  if (process.env.CI || !process.stdout.isTTY) return

  printPaymentGate()

  // Read user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  })

  return new Promise<void>((resolve) => {
    const prompt = () => {
      rl.question(`${ansiRgb(...ACCENT)}\u25b8${RESET} ${ansiRgb(...DIM)}Type ${ansiRgb(...CREAM)}PAID${RESET}${ansiRgb(...DIM)} after sending payment:${RESET} `, (answer) => {
        const trimmed = answer.trim().toUpperCase()
        if (trimmed === 'PAID' || trimmed.startsWith('PAID ')) {
          const txHash = answer.trim().slice(4).trim()
          const newState = confirmPaid()
          newState.transactionId = txHash || undefined
          savePaymentState(newState)

          clearScreen()
          process.stdout.write(`\n${ansiRgb(...ACCENT)}\u2714${RESET} ${ansiRgb(...CREAM)}\x1b[1mPayment confirmed!${RESET}\n`)
          process.stdout.write(`${ansiRgb(...DIM)}  Your API key:${RESET} ${ansiRgb(...CREAM)}${newState.apiKey}${RESET}\n`)
          process.stdout.write(`${ansiRgb(...DIM)}  Saved to:${RESET} ${ansiRgb(...CREAM)}${PAYMENT_FILE}${RESET}\n\n`)
          process.stdout.write(`${ansiRgb(...ACCENT)}\u25b8${RESET} ${ansiRgb(...CREAM)}Restart WormGPT to begin using it.${RESET}\n\n`)
          rl.close()
          resolve()
        } else {
          process.stdout.write(`\n${ansiRgb(...ACCENT)}\u2716${RESET} ${ansiRgb(...DIM)}Invalid. Type ${ansiRgb(...CREAM)}PAID${RESET}${ansiRgb(...DIM)} once you have sent 100\xa3 USDT.${RESET}\n\n`)
          prompt()
        }
      })
    }
    prompt()
  })
}
