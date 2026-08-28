# Capture Clock Repair v0.1.0 handoff — repair verification: PASS

**Repair base:** `ff1da3b53bf8b5fc4ae4916694b4324ea08a09c2` (failed candidate `2394f4d433616665f686adb6bf7b68406d2107e3`)
**Deployment class:** static site at `dist/site`; release CLI at `dist/bin/capture-clock-repair`

## Repair completed

- Fixed the release-blocking Clap parsing defect: `scan --timezone -04:00` now accepts the documented separated negative offset form. The change is scoped to the `timezone` argument (`allow_hyphen_values`) and still validates offsets as `+HH:MM` or `-HH:MM`.
- Added a Rust parser regression test that invokes the exact documented argument sequence and asserts that `-04:00` is preserved.
- Pinned Playwright to `1.58.2`, matching the factory-provided Chromium, and documented the explicit `npx playwright install chromium` fallback for other clean environments.
- Repaired the README's trailing duplicated commands and unmatched code fence. The usage documentation now includes the normal negative-offset command form.

## How to run and verify

```sh
npm ci
npx playwright install chromium # only when Chromium is not already supplied by the environment
npm test
cargo fmt --check
cargo clippy --all-targets -- -D warnings
npm run build
cargo package --allow-dirty
```

The browser suite expects a built site served at `http://127.0.0.1:4173` (for example, run `npx vite preview --host 127.0.0.1 --port 4173` after `npm run build`), then run:

```sh
npm run test:browser
```

Ready-to-publish package check (do not publish; the factory owns credentials):

```sh
cargo package --allow-dirty
cargo install --path target/package/capture-clock-repair-0.1.0 --root /tmp/capture-clock-repair-consumer
```

## Verification evidence — 2026-08-28

- Clean `npm ci` completed with 0 npm vulnerabilities. It resolved Playwright `1.58.2` and the preinstalled Chromium executable at `/opt/pw-browsers/chromium-1208/chrome-linux64/chrome`.
- `npm test` passed: 6 Rust tests (including the new separated-negative-offset parser regression), 1 compiling Rust doctest, and 3 Node tests. `cargo fmt --check` and `cargo clippy --all-targets -- -D warnings` passed.
- `npm run build` passed and produced `dist/bin/capture-clock-repair` plus `dist/site`. Built JS is 5,906 bytes (2,770 gzip), CSS 10,859 bytes (3,400 gzip), and hero WebP files are 77,272 and 19,164 bytes.
- The release binary scanned a temporary filename-dated JPEG with `--timezone -04:00 --json`; its plan timezone and proposal were both exactly `-04:00` / `2025-04-18T19:42:11-04:00`.
- `cargo package --allow-dirty` verified the crate (9 files, 61.9 KiB). A clean `cargo install --path target/package/capture-clock-repair-0.1.0 --root <temp>` consumer installation also scanned that archive with the normal separated negative-offset form and emitted `2025-04-18T19:42:11-04:00`.
- `npm run test:browser` against the built site passed for `/`, `/privacy/`, and `/terms/` in light and dark modes: HTTP 200, exactly one `h1` and `main`, no console/page errors, and zero Axe violations. The factory `verify-url.sh` check reported title, `lang`, `main`, and image alt text present with no errors.
- Additional Playwright smoke checks passed: the skip link received a visible 3 px focus outline; keyboard selection/submission produced the demo analysis; 390 × 844 had no horizontal overflow; reduced motion computed to `1e-05s`; and an offline reload after service-worker readiness rendered the home heading from the cached shell.
- Local mobile Lighthouse: Performance 100, Accessibility 100, LCP 1,354.4003 ms, CLS 0. The CLI has no network behavior; the normal page load uses no third-party assets, analytics, tracking, fonts, or scripts. `site/public/staticwebapp.config.json` preserves the production CSP, privacy/security headers, immutable asset caching, and no-cache service-worker policy.
- Deployed `dist/site` with `/opt/fleet/lib/deploy-static.sh capture-clock-repair dist/site`. Azure deployment `80b3289b-c5b5-4ca4-a97e-62e6b1bfb39c` succeeded to `lively-forest-06356f60f.7.azurestaticapps.net`; both that host and `https://capture-clock-repair.sociobot.in/` returned 200 with the Capture Clock Repair identity. The custom-domain response has a new `Last-Modified: Fri, 28 Aug 2026 00:43:25 GMT` validator and the configured CSP, HSTS, nosniff, DENY framing, referrer, and permissions headers.

## Known scope limits

- JPEG/JPG metadata is supported in v0.1.0. RAW, HEIC, TIFF, PNG, and video files are reported as unsupported and left untouched.
- Timezone conflicts remain evidence for review; a conflicting embedded timestamp can only become a sidecar write through explicit `amend`. Originals are never modified.
- No registry publication, billing registration, DNS, infrastructure, or secrets were touched. The factory owns those operations.
