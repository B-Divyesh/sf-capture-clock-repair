import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

const base = process.env.CCR_SITE_URL || "http://127.0.0.1:4173";
const evidenceDir = process.env.CCR_EVIDENCE_DIR || "/tmp";
await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
const pages = [
  ["/", "Capture Clock Repair — Repair photo capture times"],
  ["/demo/", "Demo — Capture Clock Repair"],
  ["/privacy/", "Privacy — Capture Clock Repair"],
  ["/terms/", "Terms — Capture Clock Repair"],
  ["/404.html", "Page not found — Capture Clock Repair"]
];

for (const colorScheme of ["light", "dark"]) {
  const context = await browser.newContext({ colorScheme, viewport: { width: 1280, height: 900 } });
  for (const [path, expectedTitle] of pages) {
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    const accessibility = await new AxeBuilder({ page }).analyze();
    const structure = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      h1: document.querySelectorAll("h1").length,
      main: document.querySelectorAll("main").length,
      missingAlt: [...document.images].filter((image) => !image.hasAttribute("alt")).length,
      canonical: document.querySelector('link[rel="canonical"]')?.href || "",
      openGraph: Boolean(document.querySelector('meta[property="og:title"]') && document.querySelector('meta[property="og:image"]')),
      twitter: Boolean(document.querySelector('meta[name="twitter:card"]') && document.querySelector('meta[name="twitter:image"]')),
      appleTouch: Boolean(document.querySelector('link[rel="apple-touch-icon"]'))
    }));
    results.push({
      path, colorScheme, status: response?.status(), expectedTitle, structure, errors,
      violations: accessibility.violations.map((item) => `${item.id}:${item.impact}`)
    });
    await page.close();
  }
  await context.close();
}

const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "light" });
const phone = await phoneContext.newPage();
await phone.goto(base, { waitUntil: "networkidle" });
const beforeScroll = await phone.evaluate(() => ({
  h1: document.querySelector("h1")?.textContent.trim(),
  audience: document.querySelector(".lede")?.textContent.trim(),
  primary: document.querySelector(".hero-actions .button")?.textContent.trim(),
  facts: [...document.querySelectorAll(".facts li")].map((item) => item.textContent.trim())
}));
await phone.getByRole("link", { name: "Try it with sample data" }).click();
await phone.waitForURL("**/demo/");
const filled = await phone.locator("#demo-result").innerText();
await phone.selectOption("#sample", "nikon");
await phone.getByRole("button", { name: "Update sample plan" }).click();
const changed = await phone.locator("#demo-result").innerText();
await phone.getByRole("button", { name: "Reset demo" }).click();
const reset = await phone.locator("#demo-result").innerText();
const phoneCheck = await phone.evaluate(() => ({
  horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  storage: { local: localStorage.length, session: sessionStorage.length },
  smallTargets: [...document.querySelectorAll("a,button,select")]
    .filter((element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && (box.width < 44 || box.height < 44);
    })
    .map((element) => ({ text: element.textContent.trim(), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }))
}));
await phone.screenshot({ path: `${evidenceDir}/screenshot-mobile.png`, fullPage: true });
await phoneContext.close();

const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
const desktop = await desktopContext.newPage();
await desktop.goto(base, { waitUntil: "networkidle" });
await desktop.screenshot({ path: `${evidenceDir}/screenshot-desktop.png`, fullPage: true });
await desktop.keyboard.press("Tab");
const skipFocused = await desktop.evaluate(() => document.activeElement?.classList.contains("skip-link") && getComputedStyle(document.activeElement).outlineStyle !== "none");
await desktop.keyboard.press("Enter");
const mainFocused = await desktop.evaluate(() => document.activeElement?.id === "main");
await desktopContext.close();

const motionContext = await browser.newContext({ reducedMotion: "reduce" });
const motion = await motionContext.newPage();
await motion.goto(`${base}/demo/`, { waitUntil: "networkidle" });
const reducedMotion = await motion.locator("#demo-result").evaluate((element) => ({
  animationDuration: getComputedStyle(element).animationDuration,
  scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior
}));
await motionContext.close();

const privacyContext = await browser.newContext();
const privacyPage = await privacyContext.newPage();
const requestOrigins = new Set();
privacyPage.on("request", (request) => requestOrigins.add(new URL(request.url()).origin));
await privacyPage.goto(`${base}/demo/`, { waitUntil: "networkidle" });
await privacyPage.selectOption("#sample", "unknown");
await privacyPage.getByRole("button", { name: "Update sample plan" }).click();
await privacyContext.close();

const offlineContext = await browser.newContext();
const offlinePage = await offlineContext.newPage();
await offlinePage.goto(`${base}/demo/`, { waitUntil: "networkidle" });
await offlinePage.evaluate(() => navigator.serviceWorker.ready);
await offlinePage.reload({ waitUntil: "networkidle" });
await offlinePage.waitForFunction(() => navigator.serviceWorker?.controller !== null);
await offlineContext.setOffline(true);
await offlinePage.reload({ waitUntil: "domcontentloaded" });
await offlinePage.waitForFunction(() => document.querySelector("#demo-result")?.textContent.includes("WhatsApp Image") && !document.querySelector("#offline-notice")?.hidden);
const offline = {
  heading: await offlinePage.locator("h1").innerText(),
  sample: await offlinePage.locator("#demo-result").innerText(),
  notice: await offlinePage.locator("#offline-notice").isVisible()
};
await offlineContext.close();
await browser.close();

const observedRequestOrigins = [...requestOrigins];
const report = { pages: results, beforeScroll, filled, changed, reset, phone: phoneCheck, skipFocused, mainFocused, reducedMotion, requestOrigins: observedRequestOrigins, offline };
console.log(JSON.stringify(report, null, 2));

const routeFailed = results.some((item) =>
  item.status !== 200 || item.structure.lang !== "en" || item.structure.title !== item.expectedTitle || item.structure.h1 !== 1 ||
  item.structure.main !== 1 || item.structure.missingAlt !== 0 || !item.structure.canonical || !item.structure.openGraph ||
  !item.structure.twitter || !item.structure.appleTouch || item.errors.length || item.violations.length
);
const interactionChecks = {
  firstScreenHeading: beforeScroll.h1 !== "Repair missing and shifted photo times",
  firstScreenAudience: !beforeScroll.audience.includes("photographers"),
  firstScreenAction: beforeScroll.primary !== "Try it with sample data",
  firstScreenFacts: beforeScroll.facts.length !== 3,
  filledSample: !filled.includes("WhatsApp Image"),
  changedSample: !changed.toLowerCase().includes("protected conflict"),
  resetSample: !reset.toLowerCase().includes("ready to review"),
  horizontalOverflow: phoneCheck.horizontalOverflow,
  smallTargets: phoneCheck.smallTargets.length > 0,
  localStorage: phoneCheck.storage.local > 0,
  sessionStorage: phoneCheck.storage.session > 0,
  skipFocus: !skipFocused,
  mainFocus: !mainFocused,
  reducedMotion: Number.parseFloat(reducedMotion.animationDuration) > 0.00002,
  reducedScroll: reducedMotion.scrollBehavior !== "auto",
  requestCount: observedRequestOrigins.length !== 1,
  requestOrigin: observedRequestOrigins[0] !== new URL(base).origin,
  offlineNotice: !offline.notice,
  offlineSample: !offline.sample.includes("WhatsApp Image")
};
const interactionFailed = Object.values(interactionChecks).some(Boolean);

if (routeFailed || interactionFailed) {
  console.error(JSON.stringify({ routeFailed, interactionChecks }));
  process.exit(1);
}
