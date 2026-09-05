# Capture Clock Repair — review 1 handoff

**Review date:** 2026-09-05

**Verdict:** **FAIL**

The independent audit is recorded in `.factory/review-1.md`. Product code was not changed.

## Candidate reviewed

- Implementation: `759d3651f496c5c8645eb3b59663e6c697f42b8f`
- Documentation: `0b811f40c1a0dd4d3e8fc4bac2d211baad2b9597`
- Live: https://capture-clock-repair.sociobot.in/

The live HTML, JavaScript, CSS, and hero-image hashes match the fresh build of this candidate.

## Result

Nine findings remain: five high, two medium, and two low. There are 20 public claims without registered claim tests.

The highest-priority work is to re-check current EXIF during every apply, publish or replace the broken public install command, ship the required CLI demo sandbox, register/fix the Sociobot checkout, and add `.factory/claims.json` with one observable sandbox test per claim. The landing page also needs plain job-and-audience copy, a product 404, complete social/canonical metadata, and compliant phone targets.

## Verification completed

From a clean checkout, `cargo install --path .`, `cargo test`, `cargo build --release`, `npm ci`, `npm test`, `npm run build:site`, `npm run build`, `cargo package --allow-dirty`, `cargo fmt --check`, and strict clippy all passed. The package was installed into a clean consumer root and exercised through scan, review, dry-run, apply, conflict amendment, undo, invalid input, offset boundaries, and recovery refusals.

Live root/privacy/terms checks passed Axe in light and dark, keyboard/focus, 390 px layout, reduced motion, normal-load privacy, service-worker update, and offline reload. Lighthouse mobile scored 100 in Performance, Accessibility, Best Practices, and SEO, with LCP 1.21 s and CLS 0. The required demo route, 404 design, install command, checkout, and trusted-row tamper path failed as detailed in the report.

## Re-run

```sh
npm ci
npm test
npm run build
CCR_SITE_URL=https://capture-clock-repair.sociobot.in npm run test:browser
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo package --allow-dirty
```

Also run every future command in `.factory/claims.json`, test `capture-clock-repair demo` from the packaged consumer, test the registry/release install shown live, and follow each live link before requesting another review.
