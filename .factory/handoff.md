# Capture Clock Repair — repair 2 handoff

**Completed:** 2026-09-05

**Verdict:** repaired and verified

**Live URL:** https://capture-clock-repair.sociobot.in/

## Release identity

- Deployed implementation: `9edbda982eabaebc97c2b057bed2a3486e133570`
- Verification and documentation baseline: `779b4775db66dc3bc8c57a6a20b06d03eaadfb9f`
- The commit containing this handoff is report-only. The live HTML, JavaScript, CSS, and social image match the build from the implementation SHA.
- Static deployment id: `fb5fa8ca-43d6-4b40-96f6-0d91e2d45ccf`

## What changed

- Apply now re-reads each JPEG before both planning and writing. Any current `DateTimeOriginal` blocks `accept`; only a reproducible filename and EXIF conflict explicitly set to `amend` may proceed.
- Sidecars and undo manifests use create-new writes, so a file appearing after preflight is not overwritten.
- `capture-clock-repair demo` now creates an isolated temporary workspace from four bundled synthetic image fixtures and prints its review CSV and JSON plan paths.
- The public install now clones the GitHub source and runs `cargo install --locked --path`. The exact public commands work from a clean consumer environment.
- `/demo/` opens a filled WhatsApp result in one click. Its persistent banner includes Reset demo and Start for real. It writes no browser data.
- The unavailable $19 checkout, license storage, verification requests, and paid claims were removed. The free CLI remains complete.
- The landing page now names the photo-time repair job, photographers, the sample action, and three facts before scrolling.
- All pages now share the standard header and footer. Canonical, Open Graph, Twitter, favicon, touch icon, social image, sitemap, and route titles are present.
- Unknown routes return HTTP 404 with the product's page, navigation, main landmark, footer, and home action.
- The service worker precaches the exact built JS and CSS and supports an offline demo reload.
- Twelve public claims are registered in `.factory/claims.json`, each with one tagged outcome test.

## Finding disposition

| Finding | Disposition and proof |
|---|---|
| R1 trusted-EXIF bypass | Fixed. The tampered accepted row returns exit 2, creates no XMP or manifest, and leaves the photo checksum unchanged. A valid flagged conflict amendment still passes. |
| R2 broken public install | Fixed. A fresh public GitHub clone installed version 0.1.1 and ran the bundled demo. |
| R3 missing CLI demo sandbox | Fixed. The packaged binary includes `demo`; `examples/sample-archive/`, `/demo/`, and `.factory/demo.md` are present. |
| R4 broken $19 checkout | False offer removed. No checkout or license path remains in site copy or code. See the external dependency below. |
| R5 untested claims | Fixed. All 12 current claims passed individually from a fresh clone. The prior false and future claims were removed. |
| R6 unclear first screen and metaphor copy | Fixed. Phone and desktop checks confirm the job, audience, first action, and facts before scrolling. `.factory/copy-audit.md` has no flagged sentence. |
| R7 routes and metadata | Fixed. Root, demo, privacy, terms, and 404 have unique titles and complete metadata. An unknown live path returns the designed body with status 404. |
| R8 small phone targets | Fixed. The 390 px test found zero visible links, buttons, or selects below 44×44 CSS px. |
| R9 missing review documents | Fixed. Demo, claims, copy audit, catalog description, updated design, and this handoff are present. |
| Earlier negative-offset parser defect | Still fixed. The clean installed artifact accepts separated `--timezone -04:00` and preserves it. |
| Earlier browser prerequisite gap | Still fixed. Playwright 1.58.2 is pinned and the clean setup documents browser installation. |
| Earlier README formatting defect | Still fixed. The README renders with matched fences and no duplicated tail commands. |

## Clean verification

A fresh clone at the implementation SHA ran the documented prerequisites. Every command in `.factory/claims.json` passed individually. The aggregate checks also passed:

```sh
npm ci
npx playwright install chromium
npm test
cargo fmt --check
cargo clippy --all-targets -- -D warnings
npm run build
cargo package --locked
CCR_SITE_URL=http://127.0.0.1:4174 npm run test:browser
```

Results:

- Rust: 7 unit tests and 1 doctest passed.
- Claims and browser units: 15 tests passed, including all 12 tagged claims.
- Package: 13 files, 71.0 KiB unpacked source and 21.3 KiB compressed.
- Clean packaged consumer: installed 0.1.1, ran `demo`, and produced both plan files.
- Browser: zero Axe violations in light and dark on root, demo, privacy, terms, and 404.
- Phone: no horizontal overflow, no small targets, filled sample, changed sample, reset, and empty local/session storage.
- Keyboard: skip link focus and main focus passed. Native selects and buttons completed the demo.
- Reduced motion: animation duration was 0.01 ms and scroll behavior was immediate.
- Privacy: the whole browser demo requested only its own origin. The CLI completed with socket calls blocked.
- Offline: a fresh context reloaded the filled demo from cache and showed the offline notice.
- Build assets: 3.24 KB JavaScript and 11.59 KB CSS before gzip.

## Performance

Lighthouse mobile against the clean production build scored Performance 100, Accessibility 100, Best Practices 100, and SEO 100. LCP was 1.36 s, CLS was 0, total blocking time was 0 ms, and transferred bytes were 87 KB.

Lighthouse mobile against the live HTTPS site also scored 100 in all four categories. Live LCP was 1.20 s, CLS was 0, total blocking time was 0 ms, and transferred bytes were 87 KB.

## Live verification

- Factory URL verification returned 200, the expected title and language, one H1, one main, complete alt text, and no console errors.
- Fresh 1440×900 and 390×844 contexts completed the sample flow on HTTPS.
- Root, demo, privacy, terms, and explicit 404 pages returned 200. A random unknown path returned the expected HTTP 404 with the designed product page and zero Axe violations. Chromium logs the expected failed-document status for that deliberate 404; no page resource failed.
- Every internal link returned 200. The public GitHub repository returned 200. The privacy email is an explicit `mailto:` link.
- Service-worker update left one active worker, no waiting worker, and cache `capture-clock-repair-v5`.
- Live security headers include HSTS, CSP restricted to self, `nosniff`, `DENY`, strict-origin referrer policy, and disabled camera, microphone, and geolocation.
- Live hashes equal the local implementation build for `index.html`, JS, CSS, and the social image.

## Remaining external dependency

The Sociobot billing endpoint for this slug still returns 404, and product scope does not authorize billing registration. Register the one-time product through the factory before adding a paid offer again. Until then, the site makes no purchase claim and the full CLI is free under MIT.

Registry publishing and platform release binaries also remain factory-owned tasks. The documented GitHub source install is tested and working now.

This static product has no backend, tenant database, health endpoint, rate limiter, or persistent product state. Backend isolation, restart persistence, and 429 checks do not apply.
