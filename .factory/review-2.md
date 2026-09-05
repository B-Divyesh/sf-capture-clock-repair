# Review 2 — Repair photo capture times safely

**Review date:** 5 September 2026  
**Verdict: PASS**  
**Finding count:** 0  
**Untested claim count:** 0

## Reviewed release

- Implementation candidate: `9edbda982eabaebc97c2b057bed2a3486e133570`
- Documentation and test head: `eb064912967427592f59b83625c641571c731192`
- Live URL: <https://capture-clock-repair.sociobot.in/>

The commits after the implementation candidate change review material and the verification helper only. They do not change Rust CLI code, site source, assets, or deployment configuration. A clean build at the documentation head exactly matched the live root HTML, JavaScript, and CSS hashes, so the live runtime is the implementation candidate.

## First screen before scrolling

- **Job:** Repair missing and shifted photo capture times.
- **Audience:** Photographers combining camera, phone, messenger, and travel archives into one accurate timeline.
- **First action:** **Try it with sample data**. It opens the populated browser review plan in one click.

The three facts are visible on both fresh desktop and 390 px phone views: it runs offline after installation, keeps original photo files unchanged, and is free under the MIT License.

## Declared claims

Every command in `.factory/claims.json` was run separately from a clean public clone. All passed.

| Claim ID | Result |
|---|---|
| `source-install` | Pass — a clean source checkout installed and ran the executable. |
| `mit-license` | Pass — package metadata, MIT grant, and full free demo passed. |
| `cli-demo` | Pass — bundled demo made an isolated populated workspace. |
| `archive-plan` | Pass — recursive planning, grouping, unsupported media, CSV, and JSON passed. |
| `timezone-offset` | Pass — separated `-04:00` was preserved. |
| `trusted-exif` | Pass — tampered trusted EXIF was refused without XMP or manifest. |
| `sidecar-undo` | Pass — adjacent XMP only, checksum-protected undo, and recovery refusals passed. |
| `script-interface` | Pass — JSON, diagnostics, and documented exit code 2 passed. |
| `cli-private` | Pass — complete demo succeeded with socket calls blocked. |
| `web-demo` | Pass — filled one-click sample, reset, and empty browser storage passed. |
| `site-private` | Pass — demo requests stayed on the served origin and stored no browser data. |
| `offline-site` | Pass — a separate context reloaded the filled sample offline. |

No additional public claim found on the landing page, demo, README, privacy page, or terms page lacked coverage in this registry.

## CLI and clean consumer evidence

From a clean clone at `eb06491`, these checks passed:

```sh
npm ci
npx playwright install chromium
cargo fmt --check
cargo clippy --all-targets -- -D warnings
npm test
npm run build
cargo package --locked
```

- `npm test` passed 7 Rust unit tests, 1 doctest, and 15 Node tests.
- `npm run build` produced `dist/bin/capture-clock-repair` and `dist/site`; the initial site JavaScript is 3.24 kB and CSS is 11.59 kB before gzip.
- `cargo package --locked` verified `capture-clock-repair 0.1.1` (13 files; 71.0 KiB unpacked, 21.3 KiB compressed).
- A new consumer root installed the packed crate, reported `capture-clock-repair 0.1.1`, and ran `demo --json` successfully. Its isolated workspace contained three JPEGs, one unsupported PNG, populated `review.csv`, and `plan.json`.
- Normal, invalid, boundary, and recovery paths are exercised by the claim suite: recursive and shallow scans, unsupported files, `-04:00`, invalid offsets, trusted-EXIF tampering, sidecar collision, changed-sidecar undo refusal, and unchanged-photo checksums.

## Live site and browser evidence

Fresh Chromium desktop and phone contexts passed on `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html` in light and dark modes:

- Each route has the expected unique title, `lang="en"`, one H1, one main landmark, complete image alternatives, canonical, Open Graph, Twitter, and Apple-touch metadata.
- Axe found zero violations. The skip link moves focus to main; focus remains visible; native selects and buttons work by keyboard; 390 px has no horizontal overflow or control below 44 px; reduced motion is immediate.
- The demo begins with the realistic WhatsApp missing-EXIF case. The Nikon sample shows a protected one-hour conflict. **Reset demo** restores the WhatsApp row. The persistent label says `Demo — sample data, nothing is saved`; local and session storage are both empty.
- Request logging during the sample flow found only `https://capture-clock-repair.sociobot.in`. No tracker, analytics, remote font, third-party script, upload, IndexedDB, or stored sample data was observed.
- After service-worker control, the populated demo reloaded offline and displayed the offline notice. No waiting update was present.
- All published internal routes, `robots.txt`, `sitemap.xml`, and the public source link returned 200. A random unknown route returned the designed page with deliberate HTTP 404, one H1, main landmark, and a route home. Its browser failed-document console entry is the expected result of a deliberate 404 status, not a broken resource.
- Live security headers include a self-only CSP with `frame-ancestors 'none'`, HSTS, `nosniff`, `DENY`, strict-origin referrer policy, and disabled camera, microphone, and geolocation.

Clean-build and live SHA-256 values match:

| Asset | SHA-256 |
|---|---|
| `index.html` | `f32f822bb8a68d9ae88681cc3326eab7261e9133011514008a3a6326d01921f7` |
| `main-BDGZrvXh.js` | `71a9bae45b33233fc4f225c70972a3e4abec811b5084ce97eb3b6e14770cb5c5` |
| `style-C0JFV1vQ.css` | `efdd09dade6e2899b7f3817806a6be0d1124af4064c332bb4465d53cbba990f1` |

Lighthouse mobile repeat run: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.2 s, CLS 0, total blocking time 0 ms, transfer 84 KiB. The Lighthouse CLI was pointed at the already-installed Playwright Chromium because this environment has no system Chrome.

## Earlier finding disposition

| Earlier finding | Current disposition |
|---|---|
| Verification 1 negative timezone parsing | Fixed; separated `-04:00` passes in the installed CLI and claim test. |
| Verification 1 browser prerequisite and README fence | Fixed; Playwright installation is documented and the current README renders cleanly. |
| Review 1 R1 trusted-EXIF bypass | Fixed; the declared tamper test refuses the write and preserves the source. |
| Review 1 R2 public install path | Fixed; documented public-clone install and packed consumer install both work. |
| Review 1 R3 demo sandbox | Fixed; CLI and browser samples are populated, isolated, resettable, and documented. |
| Review 1 R4 unavailable payment offer | Resolved by removing payment, licensing code, and paid claims; the complete CLI is free under MIT. |
| Review 1 R5 untested claims | Fixed; all 12 registered claim commands pass. |
| Review 1 R6 plain-word first screen | Fixed; job, audience, action, and facts are visible before scrolling. |
| Review 1 R7 routes, metadata, and 404 | Fixed; routes, shared structure, metadata, designed 404, and links pass live. |
| Review 1 R8 phone touch targets | Fixed; no visible target is below 44 px at 390 px. |
| Review 1 R9 missing review documents | Fixed; the required claims, demo, copy-audit, design, verification, and handoff documents are present. |

## Scope notes

This product is a local CLI with a static documentation site. It has no backend, tenant data, product database, health route, persistence layer, or rate limiter; tenant isolation, restart persistence, and 429/`Retry-After` checks do not apply. The deterministic metadata workflow has no missing AI step: introducing model inference would weaken its conservative evidence and review model.

**PASS.** There are zero findings at every severity and zero untested public claims.
