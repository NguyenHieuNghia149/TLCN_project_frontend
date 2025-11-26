import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright'
import axeSource from 'axe-core/axe.min.js'

const OUT_DIR = path.resolve(process.cwd(), 'scripts', 'axe-output')
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

const PAGES = ['/', '/exam']
const BASE = process.env.BASE_URL || 'http://localhost:3000'

;(async () => {
  // Allow using a locally-installed Chrome/Edge by setting CHROME_PATH env var
  const launchOptions = {}
  if (process.env.CHROME_PATH) {
    launchOptions.executablePath = process.env.CHROME_PATH
  }
  const browser = await chromium.launch(launchOptions)
  const context = await browser.newContext()
  const page = await context.newPage()

  const results = []

  for (const route of PAGES) {
    const url = `${BASE.replace(/\/$/, '')}${route}`
    try {
      console.log(`Navigating to ${url}`)
      const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })
      if (!resp || resp.status() >= 400) {
        console.warn(`Failed to load ${url} - status: ${resp?.status()}`)
        results.push({ url, error: `HTTP status ${resp?.status()}` })
        continue
      }

      // Screenshot
      const safeName = route === '/' ? 'home' : route.replace(/[^a-z0-9]/gi, '_')
      const screenshotPath = path.join(OUT_DIR, `${safeName}.png`)
      await page.screenshot({ path: screenshotPath, fullPage: true })

      // Inject axe
      await page.addScriptTag({ content: axeSource })
      const axeResults = await page.evaluate(async () => {
        // @ts-ignore
        return await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2aa'] } })
      })

      const out = { url, screenshot: screenshotPath, axe: axeResults }
      const outPath = path.join(OUT_DIR, `${safeName}.json`)
      fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
      results.push(out)
      console.log(`Saved results for ${url}`)
    } catch (err) {
      console.error(`Error scanning ${route}:`, err.message || err)
      results.push({ url, error: String(err) })
    }
  }

  await browser.close()
  const summaryPath = path.join(OUT_DIR, 'summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2))
  console.log('Done. Output written to', OUT_DIR)
})().catch(err => {
  console.error(err)
  process.exit(1)
})
