import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const base = process.env.CCR_SITE_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const results = [];

for (const colorScheme of ["light", "dark"]) {
  const context = await browser.newContext({ colorScheme, viewport: { width: 1280, height: 900 } });
  for (const path of ["/", "/privacy/", "/terms/"]) {
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    const accessibility = await new AxeBuilder({ page }).analyze();
    const headings = await page.locator("h1").count();
    const main = await page.locator("main").count();
    results.push({ path, colorScheme, status: response?.status(), headings, main, errors, violations: accessibility.violations.map((item) => `${item.id}:${item.impact}`) });
    await page.close();
  }
  await context.close();
}

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: "light" });
await mobile.goto(base, { waitUntil: "networkidle" });
await mobile.selectOption("#sample", "whatsapp");
await mobile.selectOption("#timezone", "+05:30");
await mobile.click('#demo-form button[type="submit"]');
const mobileCheck = {
  horizontalOverflow: await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  result: await mobile.locator("#demo-result").innerText()
};
await mobile.screenshot({ path: "/tmp/capture-clock-repair-mobile.png", fullPage: true });
await mobile.close();

await browser.close();
console.log(JSON.stringify({ pages: results, mobile: mobileCheck }, null, 2));
if (results.some((item) => item.status !== 200 || item.headings !== 1 || item.main !== 1 || item.errors.length || item.violations.length) || mobileCheck.horizontalOverflow) process.exit(1);
