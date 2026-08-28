# Independent verification 2 — PASS

**Candidate:** `cd83ff4146ad76dece375d6c36c7d4749e2b6750`

**Live URL:** https://capture-clock-repair.sociobot.in/

**Verified:** 2026-08-28
**Method:** fresh detached clone of the GitHub repository at the candidate SHA; product source was not modified during verification.

## Release decision

**PASS.** The prior release-blocking negative-timezone parsing defect is fixed in the actual release binary and packaged consumer. The live static site is the candidate build: the downloaded `index.html`, JS, CSS, and hero image have the same SHA-256 hashes as the fresh local production build. The local CLI meets the brief's conservative repair flow: it plans before writing, keeps trusted data protected, writes only adjacent inferred XMP sidecars, preserves offsets, and supplies a checksummed undo manifest.

## Clean checkout, tests, build, package

- Cloned `https://github.com/B-Divyesh/sf-capture-clock-repair.git` into a new temporary directory, checked out detached at the candidate SHA, and confirmed a clean worktree.
- `npm ci` succeeded with **0 vulnerabilities** reported.
- `cargo fmt --check` and `cargo clippy --all-targets -- -D warnings` passed.
- `npm test` passed: 6 Rust unit tests, 1 Rust doctest, and 3 Node tests; 0 failures.
- Exact production command `npm run build` passed and produced `dist/bin/capture-clock-repair` and `dist/site`.
- `cargo package --allow-dirty` packaged and verified `capture-clock-repair v0.1.0` (9 files, 61.9 KiB compressed source). A clean `cargo install --path target/package/capture-clock-repair-0.1.0 --root <temp>` consumer installation reported `capture-clock-repair 0.1.0` and successfully scanned an archive with the separated negative offset form.

## CLI product and safety evidence

Using the release binary against a temporary archive with a filename-dated WhatsApp JPEG, a nested filename-dated JPEG, a renamed JPEG, and a PNG:

- `scan --timezone -04:00 --json` succeeded. It preserved `-04:00` and proposed `2025-04-18T19:42:11-04:00` for the WhatsApp filename; the nested JPEG was included recursively; the renamed JPEG remained a low-confidence filesystem-time `review`; the PNG was reported unsupported.
- `--no-recursive` excluded the nested JPEG (2 examined JPEGs and 1 unsupported file).
- `apply --dry-run` reported two potential sidecars and created neither a sidecar nor a manifest. Normal `apply` created two adjacent `.xmp` files and a manifest. SHA-256 confirmed the source JPEG was unchanged.
- The generated XMP contained `ccr:Inference="filename"`, `ccr:Confidence="high"`, and `ccr:Inferred="true"`; it retained the proposed `-04:00` timestamp.
- `undo --dry-run` left both sidecars in place; normal `undo` removed both. After altering a sidecar, `undo` returned exit code 2 and refused to remove it. An already-existing sidecar was also refused without overwrite.
- Invalid `+24:00` and a missing archive returned exit code 2. Attempting to reuse an existing undo-manifest path returned exit code 2. `--help` documents all three commands, safety behavior, `--json`, and offsets.
- The existing Rust coverage independently exercises DateTimeOriginal protection, explicit amendment of a flagged EXIF/filename conflict, and the separated negative-offset parser regression.

## Site, privacy, accessibility, PWA, and performance

- `CCR_SITE_URL=https://capture-clock-repair.sociobot.in npm run test:browser` passed. For `/`, `/privacy/`, and `/terms/` in light and dark schemes, each response was HTTP 200 with exactly one `h1` and `main`, no console/page errors, and zero Axe violations (therefore zero serious or critical findings).
- Independent Playwright checks passed at desktop and **390 × 844**: no horizontal overflow; Tab focused the skip link with a visible `3px solid` outline; Enter navigated to `#main`; native-select Arrow/Tab/Enter interaction completed the specimen analysis; no console/page errors occurred. Under reduced motion, both transition and animation durations computed to `0.00001s`.
- The normal first-page request made requests only to `https://capture-clock-repair.sociobot.in`; there are no analytics, trackers, third-party scripts, or CDN fonts. The CLI itself performs no network calls. A deliberate fake license-return test stripped `?license=` from the visible URL, stored the token locally, and made only the disclosed verification request to `https://api.sociobot.in/api/v1/products/capture-clock-repair/verify`.
- Service worker validation: after registration and reload it controlled the page, used cache `capture-clock-repair-v2`, had no waiting update, and `registration.update()` retained the active `/sw.js`. With the browser offline, a reload rendered the home `h1` from the cached shell.
- Built initial JS is 5,906 bytes (2,789 gzip), CSS is 10,859 bytes (3,411 gzip), and the mobile hero WebP is 19,164 bytes; all are within the stated budgets. Lighthouse mobile collected Performance **99**, Accessibility **100**, LCP **1,833.1 ms**, CLS **0**, and TBT **6.687 ms**. Lighthouse emitted a post-collection Chromium tab-crash diagnostic while producing the JSON report; the collected metrics and separate Playwright checks are valid, but this runner issue should not be interpreted as a page error.

## Live deployment identity and response policy

- Fresh local production hashes exactly equal the deployed bodies:
  - `index.html`: `f6b694034393521c58b6e2315bcd43393acb009cc0ee07c6bf764c7770f8d633`
  - `assets/main-BAEvsmo6.js`: `e0801c8fc04d9c216a0d773ec2f4d6d7977056df48ecc26036c1846ecbf94352`
  - `assets/style-BFLptOvo.css`: `910da41b3fc500fddaa95b5b7c0ec53b9bd09c1091791dbb2e858b7ef235721f`
  - `assets/timestamp-herbarium.webp`: `972384d0471cf63c1e7eb51e8de49feaead7083940b4411bdbe232906bc8737c`
- Live headers include HSTS, CSP (`default-src 'self'`, with only the disclosed Sociobot API in `connect-src`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, strict-origin referrer policy, and restrictive camera/microphone/geolocation permissions. Hashed JS has `Cache-Control: public, max-age=31536000, immutable`; `sw.js` has `Cache-Control: no-cache`; HTML is short-lived revalidated (`public, must-revalidate, max-age=30`).

## Defects by severity

None found. The Lighthouse browser-process crash occurred after artifact collection in this verification environment and did not produce a visible page failure; it is recorded above as a test-runner limitation, not a product defect.
