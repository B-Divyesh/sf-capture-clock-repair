# Capture Clock Repair v0.1.0 handoff — verification result: FAIL

**Verified candidate:** `2394f4d433616665f686adb6bf7b68406d2107e3`
**Live deployment checked:** https://capture-clock-repair.sociobot.in/

Independent verification is **FAIL**. The product’s conservative scan, review, sidecar, undo, static site, offline behavior, package installation, and live deployment all passed the checks below. Release is blocked by the normal negative-timezone command form: `capture-clock-repair scan ./archive --timezone -04:00` exits 2 instead of accepting the promised `-HH:MM` offset. `--timezone=-04:00` works, but that workaround is undocumented.

## Verified

- Clean detached checkout at the candidate; `npm ci`, `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `npm test`, and `npm run build` passed.
- Test total: 5 Rust tests, 1 compiling doctest, and 3 Node tests, all passing. Production output contains the release CLI at `dist/bin/capture-clock-repair` and static deploy output at `dist/site`.
- `cargo package --allow-dirty` passed. The unpacked crate installed cleanly via `cargo install --path` and its installed binary scanned a consumer archive. Do not publish; registry credentials remain factory-owned.
- Release-binary end-to-end test: filename-derived `+05:30` proposal, review CSV/plan JSON, dry run, sidecar apply, SHA-256 check that originals were unchanged, and undo all passed. Invalid input, existing-sidecar refusal, changed-sidecar undo refusal, recursive/no-recursive handling, unsupported-file reporting, and valid `+23:59` were also checked.
- Site browser checks passed locally and live (after installing the Playwright browser prerequisite): 200 responses, one `h1` and one `main` per page, no console/page errors, and zero Axe violations on home/privacy/terms in light and dark schemes. 390 px had no overflow; keyboard, focus, and reduced motion worked.
- Lighthouse mobile on the production build: Performance 99, Accessibility 100, LCP 1.666 s, CLS 0. Built JS is 5.9 KB, CSS 10.9 KB, and hero assets are 77 KB / 19 KB.
- Live HTML and JS SHA-256 match the candidate build. Live headers provide CSP, HSTS, nosniff, DENY framing, permissions/referrer policy, immutable asset caching, and no-cache service-worker caching. No third-party request occurs on normal load; the live PWA reloaded offline from `capture-clock-repair-v2`.

## Required before release

1. Make `--timezone -04:00` work (not only `--timezone=-04:00`) and add a regression test.
2. Document or automate `npx playwright install chromium` for `npm run test:browser` from a clean checkout.
3. Fix the stray commands/unmatched code fence at the end of `README.md`.

See `.factory/verification.md` for exact commands, observed outputs, live evidence, and defect severities.
