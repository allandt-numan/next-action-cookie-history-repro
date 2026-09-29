// Home -> A (client nav) -> Continue (await server action, then router.push('/b')) -> Back.
// Expected: Back lands on /a. With the bug: Back skips /a and lands on /.
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:3100'

const browser = await chromium.launch()
const page = await browser.newPage()

const navEvents = []
await page.exposeFunction('logNav', (e) => navEvents.push(e))
await page.addInitScript(() => {
  window.navigation?.addEventListener('navigate', (e) => {
    window.logNav(`${e.navigationType} -> ${new URL(e.destination.url).pathname}`)
  })
})

let actionHeaders = null
page.on('response', async (res) => {
  if (res.request().method() === 'POST' && res.request().headers()['next-action']) {
    const h = await res.allHeaders()
    actionHeaders = {
      'x-action-revalidated': h['x-action-revalidated'] ?? '(absent)',
      'set-cookie': h['set-cookie'] ? h['set-cookie'].split(';')[0].replace(/=.*/, '=…') : '(absent)'
    }
  }
})

await page.goto(`${BASE}/`)
await page.click('text=Go to A')
await page.waitForSelector('h1:text("A")')
await page.waitForTimeout(1000) // let /b prefetch

const beforeLength = await page.evaluate(() => history.length)
await page.click(process.env.BUTTON === 'cookie' ? 'text=Continue (action sets cookie)' : 'button:text-is("Continue")')
await page.waitForSelector('h1:text("B")')
await page.waitForTimeout(1000)
const afterLength = await page.evaluate(() => history.length)

await page.goBack()
await page.waitForTimeout(1000)
const backPath = new URL(page.url()).pathname

console.log('action response:', actionHeaders)
console.log('navigate events after A:', navEvents.slice(navEvents.indexOf('push -> /a') + 1))
console.log(`history.length: ${beforeLength} -> ${afterLength}`)
console.log(`Back landed on: ${backPath}`, backPath === '/a' ? '(OK)' : '(BUG: skipped /a)')

await browser.close()
process.exit(backPath === '/a' ? 0 : 1)
