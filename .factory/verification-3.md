# Verification 3 — Repair missing and shifted photo times

**Verified:** 5 September 2026

**Verdict: PASS**

- Findings: **0**
- Untested claims: **0**
- Implementation candidate: `9edbda982eabaebc97c2b057bed2a3486e133570`
- Documentation SHA: `c7c08de7fa87bdb99ca085d8d86e1906482d35ba`
- Live URL: https://capture-clock-repair.sociobot.in/

The commits after the implementation candidate change verification evidence, the browser verifier, and handoff text. They do not change the shipped CLI, site source, or site assets. A clean build at the documentation SHA matches the live HTML, JavaScript, CSS, and social image byte for byte.

## Release decision

**PASS.** The independent check found no defect at any severity and no untested public claim. The CLI completes the real repair workflow from scan through reviewed XMP writes and checksummed undo. It protects current trusted EXIF, leaves source photos unchanged, and works without a network connection. The public install and one-command sample work in clean consumer folders.

The live guide works on fresh desktop and 390 px phone contexts. Its first screen names the job, audience, and first action before scrolling. The browser sample opens filled in one click, stays labeled as sample data, resets, and writes no user or browser data.

## First screen before scrolling

- Job: **Repair missing and shifted photo times.**
- Audience: photographers combining camera, phone, messenger, and travel archives.
- First action: **Try it with sample data.**
- The next sentence says the action opens a filled review plan and does not read or save files.
- Three visible facts state offline operation after installation, unchanged original photos, and the MIT License.

The same content appears at 1440 × 900 and 390 × 844. The phone view has no horizontal overflow. The public headings and controls use literal photo and metadata terms; the botanical direction stays visual rather than becoming metaphor-based instructions.

## Declared claims

Every command below ran separately from a clean detached checkout at the documentation SHA after `npm ci` and `npx playwright install chromium`.

| Claim | Declared command | Result and observed outcome |
|---|---|---|
| `source-install` | `npm run test:claim -- source-install` | Pass; clean Cargo root installed 0.1.1 and ran the bundled demo. |
| `mit-license` | `npm run test:claim -- mit-license` | Pass; package metadata and grant are MIT, with the full demo available without payment. |
| `cli-demo` | `npm run test:claim -- cli-demo` | Pass; four bundled files produced populated CSV and JSON outputs in a new workspace. |
| `archive-plan` | `npm run test:claim -- archive-plan` | Pass; recursive and shallow scans, grouping, unsupported media, CSV, and JSON passed. |
| `timezone-offset` | `npm run test:claim -- timezone-offset` | Pass; separated `-04:00` was preserved in the proposal. |
| `trusted-exif` | `npm run test:claim -- trusted-exif` | Pass; a disguised trusted row returned exit 2 and created no sidecar or manifest. |
| `sidecar-undo` | `npm run test:claim -- sidecar-undo` | Pass; XMP labels, photo hash, existing-sidecar refusal, manifest checksum, changed-sidecar refusal, and undo passed. |
| `script-interface` | `npm run test:claim -- script-interface` | Pass; successful JSON and structured invalid-input exit 2 passed without a prompt. |
| `cli-private` | `npm run test:claim -- cli-private` | Pass; the real demo succeeded with socket calls blocked and made no socket attempt. |
| `web-demo` | `npm run test:claim -- web-demo` | Pass; one click opened the filled phone sample, change and reset worked, and storage stayed empty. |
| `site-private` | `npm run test:claim -- site-private` | Pass; the complete sample flow requested only its served origin and stored no browser data. |
| `offline-site` | `npm run test:claim -- offline-site` | Pass; a separate context reloaded the filled sample offline with the offline notice visible. |

The landing page, legal pages, demo, README, and catalog description were checked against `.factory/claims.json`. Their public statements map to these 12 claims. No false, missing, incomplete, or untested public claim was found.

## Clean checkout, build, and consumer install

The following passed from the clean detached checkout:

```sh
cargo fmt --check
cargo clippy --all-targets -- -D warnings
npm test
npm run build
cargo package --locked
```

Results:

- 7 Rust unit tests and 1 Rust doctest passed.
- 15 Node tests passed, including all 12 tagged claims.
- `npm run build` produced `dist/bin/capture-clock-repair` and `dist/site`.
- The site build contains 3.24 KB JavaScript and 11.59 KB CSS before gzip.
- `cargo package --locked` verified 13 files, 71.0 KiB unpacked and 21.3 KiB compressed.
- A separate install from the packaged crate reported version 0.1.1 and produced the full demo workspace.
- A new clone from the public GitHub URL resolved to documentation SHA `c7c08de`, installed successfully with the documented command, and ran the demo.

All CLI work used new temporary folders and synthetic bundled images. No personal or existing photo data was read or changed.

## CLI normal, invalid, boundary, and recovery paths

- The installed package demo examined 3 JPEGs across 2 source groups and reported 1 unsupported file. It wrote a populated `review.csv` and `plan.json`.
- Recursive and non-recursive scans, filename inference, filesystem fallback, trusted EXIF, a reproducible one-hour conflict, explicit amendment, and unsupported media passed through tests.
- Separated `-23:59` and `+23:59` boundaries produced timestamps with the exact selected offset.
- Invalid `+24:00` and a missing archive returned structured JSON diagnostics with exit 2.
- Dry-run listed the intended sidecar but created neither the sidecar nor the manifest.
- Apply created only adjacent XMP, and the source JPEG SHA-256 stayed unchanged.
- Undo removed the unchanged sidecar. A changed sidecar and a pre-existing sidecar were both refused in the declared recovery test.
- The tampered trusted-EXIF reproduction returned exit 2, created no XMP or manifest, and preserved the photo hash.

## Live browser and demo

Fresh Chromium contexts checked desktop, phone, light, dark, reduced-motion, offline, privacy, and unknown-route behavior.

- Root, demo, privacy, terms, and explicit 404 pages return 200 with their unique expected title.
- A random unknown path returns the designed product page with HTTP 404. It has the product header, one H1, one main landmark, footer, and routes home. Chromium's failed-document console message is the expected consequence of that deliberate 404, not a broken resource.
- All internal links return 200. The public GitHub source returns 200. The privacy contact is an explicit `mailto:` link.
- The sample page starts with the WhatsApp case and `-04:00`, showing a concrete proposed time, evidence, confidence, and CSV action.
- Changing to the Nikon case shows a protected one-hour conflict. Reset restores the WhatsApp case.
- The `Demo — sample data, nothing is saved` banner remains part of demo mode with **Reset demo** and **Start for real**.
- Local storage and session storage remain empty. Source inspection and the browser request log confirm no IndexedDB, OPFS, upload, analytics, tracker, remote font, or third-party script path.
- The browser flow requests only `https://capture-clock-repair.sociobot.in`.
- The service worker reloads the filled demo offline, shows the offline status, retains one active worker, has no waiting update, and uses cache `capture-clock-repair-v5`.

## Accessibility and interaction

- All five routes have `lang=en`, one H1, one main landmark, complete alt text, ordered headings, a skip link, header, navigation, and footer.
- Axe found zero violations on every route in light and dark modes, including the designed 404.
- Keyboard Tab reaches the skip link, demo actions, navigation, both labeled selects, and submit button in order.
- Enter activates the skip link and moves focus to main. Arrow keys change native selects, and Enter updates the sample.
- The sample result uses `aria-live="polite"` and `aria-atomic="true"`.
- Focus is a visible 3 px ochre outline. No keyboard trap was found.
- At 390 px, every visible link, button, and select is at least 44 × 44 CSS pixels.
- Reduced motion computes to a 0.01 ms animation and immediate scroll behavior.
- No flash, autoplay, dialog, or custom widget is present.

## Metadata, privacy, security, and performance

- Titles, descriptions, canonical URLs, Open Graph, Twitter card, favicon, Apple touch icon, robots file, and sitemap are complete.
- Live headers include HSTS, a self-only CSP, `nosniff`, `DENY`, strict-origin referrer policy, and disabled camera, microphone, and geolocation.
- The privacy page explains local CLI processing, the public offline cache, browser-data removal, and the privacy email.
- The CLI network-blocker test proves no socket call during the complete bundled workflow.
- Lighthouse mobile scored Performance 100, Accessibility 100, Best Practices 100, and SEO 100. LCP was 1.23 s, CLS was 0, total blocking time was 0 ms, and total transfer was 86,472 bytes.

Live and clean-build SHA-256 values match:

| File | SHA-256 |
|---|---|
| `index.html` | `f32f822bb8a68d9ae88681cc3326eab7261e9133011514008a3a6326d01921f7` |
| `main-BDGZrvXh.js` | `71a9bae45b33233fc4f225c70972a3e4abec811b5084ce97eb3b6e14770cb5c5` |
| `style-C0JFV1vQ.css` | `efdd09dade6e2899b7f3817806a6be0d1124af4064c332bb4465d53cbba990f1` |
| `social-card.webp` | `a3c88ac5938a75cb3ecf9fb1866f8fff0f32f17c5122bd25efdacd2615b1b07f` |

## Earlier finding disposition

| Earlier finding | Current proof |
|---|---|
| R1 trusted-EXIF bypass | Fixed; the declared tamper test and installed behavior refuse the write with no new files. |
| R2 broken public install | Fixed; the exact public clone and Cargo install work from a fresh consumer folder. |
| R3 missing CLI and browser demo sandbox | Fixed; both demos are populated, isolated, documented, resettable, and available in one action. |
| R4 broken $19 checkout | Resolved by removing the unavailable offer, license code, and paid claims. The full CLI is free. |
| R5 untested public claims | Fixed; all 12 registered commands pass, and no unlisted claim remains. |
| R6 unclear or metaphor-based first screen | Fixed; job, audience, action, outcome, and three facts are visible before scrolling. |
| R7 route structure and metadata | Fixed; routes, shared skeleton, metadata, social image, sitemap, and designed 404 pass live. |
| R8 phone touch targets | Fixed; no visible interactive target is below 44 × 44 CSS pixels at 390 px. |
| R9 missing review documents | Fixed; claims, demo, copy audit, catalog description, design, verification, and handoff files exist. |
| Separated negative timezone offset | Still fixed; `-04:00` and the `-23:59` boundary work in the installed package. |
| Browser prerequisite gap | Still fixed; Playwright 1.58.2 is pinned and Chromium installation is documented. |
| README fence and duplicated commands | Still fixed; the current README structure is complete and renders cleanly. |

## Not applicable and external follow-up

This product is a static guide plus a local CLI. It has no product backend, tenant state, `/data` database, health endpoint, or runtime rate limiter. Tenant isolation, restart persistence, and 429/`Retry-After` checks do not apply.

The deterministic metadata workflow does not benefit from an AI step. Adding one would weaken the conservative evidence model, so the AI missed-leverage check has no finding.

The Sociobot checkout endpoint for this slug still returns 404. The site does not advertise payment, contain checkout or license code, or gate any feature. Billing registration and registry or platform publishing remain factory-owned follow-up work and do not block this free MIT release.
