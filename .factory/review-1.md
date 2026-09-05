# Review 1 — Repair photo capture times safely

**Audit date:** 2026-09-05

**Verdict:** **FAIL**

**Finding count:** **9** (0 critical, 5 high, 2 medium, 2 low)

**Untested claim count:** **20**

## Reviewed candidate

- Implementation: `759d3651f496c5c8645eb3b59663e6c697f42b8f`
- Documentation head: `0b811f40c1a0dd4d3e8fc4bac2d211baad2b9597`
- Live URL: https://capture-clock-repair.sociobot.in/
- The commits after `759d365` change reports only. A clean build at the documentation head produced the same SHA-256 hashes as the live `index.html`, JavaScript, CSS, and 1200 px hero image. The live runtime is therefore the implementation above.

## First screen before scrolling

Desktop and 390 px phone views show the same task and controls.

- **Job:** find missing or shifted photo capture times, review proposals, and write XMP sidecars.
- **Audience:** not stated. The page does not identify photographers or people combining camera, phone, messenger, and travel archives.
- **First action:** `Install the CLI`. It scrolls to `cargo install capture-clock-repair`, which fails because that crate is not published. `Examine a sample` is secondary and only scrolls to an empty form.

The headline, `Repair the label. Keep the negative.`, does not name the job. It depends on the field-guide metaphor, contrary to the required plain-word first screen.

## Findings

### R1 — High — Apply can create a sidecar for a JPEG with trusted EXIF

The README says a row with trusted `DateTimeOriginal` “can never become a sidecar write.” That protection trusts editable CSV control fields instead of re-reading EXIF for a normal `accept` row.

Reproduction against the installed package:

1. Scan a JPEG containing `DateTimeOriginal=2025:04:18 19:42:11` and `OffsetTimeOriginal=+05:30`. The row is correctly written as `trusted`, with action `keep`.
2. In the editable review CSV, change `status` to `proposed`, clear `original_time`, set a proposed time, and change `action` to `accept`.
3. Run `capture-clock-repair apply review.csv --manifest undo.json --json`.

Actual: exit 0 and one adjacent XMP sidecar is created for the trusted JPEG. The original photo SHA-256 remains unchanged, but the sidecar carries a competing `DateTimeOriginal`. Apply must re-read the current file and refuse trusted EXIF unless the row is a still-valid flagged conflict explicitly set to `amend`.

### R2 — High — The public CLI install path does not work

The main live action leads to this command:

```sh
cargo install capture-clock-repair
```

From a clean consumer environment it exits 101: `could not find capture-clock-repair in registry crates-io`. The GitHub repository has no release, either. The README's source install works, and the local package is ready to publish, but the live page does not give a working consumer install path.

### R3 — High — The required CLI demo sandbox is missing

- `capture-clock-repair demo` exits 2 with `unrecognized subcommand 'demo'`.
- No `examples/` sample archive ships in the repository.
- `.factory/demo.md` is missing.
- Live `/demo` returns the deliberate HTTP 404 status, but it is not a demo route.
- On the landing page, the first `Examine a sample` click only scrolls to an empty form. A user must then choose a sample and click `Inspect specimen`.
- The browser sample has no persistent `Demo — sample data, nothing is saved` label, `Reset demo`, or `Start for real` action.

The manually populated WhatsApp example is realistic and changes no browser storage, but it does not satisfy the one-click, isolated CLI demo contract.

### R4 — High — The advertised $19 purchase cannot start

The live `Buy the field kit — $19` link targets the required Sociobot endpoint, but `GET https://api.sociobot.in/api/v1/products/capture-clock-repair/checkout` returns HTTP 404 with no redirect. A visitor cannot buy or reach the advertised field kit. Invalid-license verification itself responds and the page handles it correctly.

### R5 — High — Public claims have no claim registry or claim tests

`.factory/claims.json` is absent. There are no `@claim:<id>` tests and therefore no declared claim command to run. Twenty distinct public claims are listed below; all 20 lack the required clean-sandbox automated test. Manual observations do not replace the required claim registry. Some claims are also false or blocked by R1, R2, and R4.

### R6 — Medium — First-screen and site copy breach the plain-word contract

The first screen omits the audience, uses a metaphor as the H1, does not make `Try it with sample data` the primary action, and compresses privacy/offline/license facts into one decorative line. Product-lore and mood copy appears throughout, including `specimen no. 001`, `A field notebook before a field edit`, `Recorded specimen bench`, and `The governing rule`. The required `.factory/copy-audit.md` is also absent.

### R7 — Medium — Required route structure and metadata are incomplete

- An unknown path correctly returns HTTP 404, but the body is Azure's generic page. It loads Microsoft/Azure CDN assets, has no product header, main landmark, footer, or way home, and produces failed-resource console errors in the audit browser.
- Root, privacy, and terms omit canonical, Open Graph, Twitter card, and Apple touch metadata. There is no product 1200×630 social image reference.
- `sitemap.xml` has no demo route.
- Legal-page headers and footers do not use the same navigation skeleton as home, and no footer says `Built by Param Factory` or gives a build id.

### R8 — Low — Three phone controls miss the 44 px touch target baseline

At 390 px, `Copy commands` is 40 px high. The inline `privacy` and `terms` links beside the paid description are 21 px high. Axe reports no rule violation, but these controls do not meet the attached 44×44 px target requirement.

### R9 — Low — Required review documentation is incomplete

The repository has no `.factory/demo.md`, `.factory/claims.json`, or `.factory/copy-audit.md`. The first two are tied to R3 and R5; this finding records the incomplete documentation set required for handoff and repeatable independent review.

## Claim inventory

Every row below has **no registered test command** and counts toward `untested_claim_count`, even where this review performed a manual spot check.

| # | Public claim | Manual disposition |
|---:|---|---|
| 1 | `cargo install capture-clock-repair` installs the CLI | **False:** crates.io lookup fails |
| 2 | Finds missing and shifted capture times and groups sources | Passed on the packaged Linux binary |
| 3 | Writes an editable review CSV and JSON plan | Passed |
| 4 | Approved repairs create adjacent XMP only | Passed in the normal path |
| 5 | Original photo bytes are never changed | Passed; SHA-256 unchanged across apply |
| 6 | Trusted embedded dates can never become sidecar writes | **False:** R1 |
| 7 | Filename timezone offsets are preserved | Passed at `-04:00`, `+23:59`, and `-23:59` |
| 8 | Inferred dates and confidence are labeled in XMP | Passed |
| 9 | Every write gets a checksummed undo record | Passed, including changed-sidecar refusal |
| 10 | Archives are recursive by default and support `--no-recursive` | Passed |
| 11 | Supported filename patterns work and unsupported media stay untouched | Partially sampled with JPEG and PNG |
| 12 | `--json`, stdout/stderr, and exit codes support scripting | Passed for success and expected exit 2 paths |
| 13 | The CLI is offline and makes no network or telemetry requests | Source/dependency inspection supports it; no claim test exists |
| 14 | Site documentation and browser sample work offline after first load | Passed after service-worker control |
| 15 | The browser sample never opens or uploads a photo | Passed; sample changed no storage and made only same-origin requests |
| 16 | The website has no analytics, trackers, third-party scripts, or CDN fonts | Passed on normal root/privacy/terms loads |
| 17 | The binary builds on macOS, Linux, and Windows with Rust 1.85+ | Linux passed; macOS and Windows are untested |
| 18 | A $19 one-time purchase unlocks the field kit | **False at entry:** checkout returns 404 |
| 19 | License data stays in local storage and is sent only to Sociobot for daily verification | Invalid-token path passed; valid unlock is untested |
| 20 | The field kit provides recipes, a printable checklist, and future preset updates | Blocked by checkout; the future-update promise is not presently provable |

## Verification evidence

### Clean checkout and packaged consumer

The review cloned the documentation head into a new directory and kept it clean. These commands passed:

```sh
cargo install --path .
cargo test
cargo build --release
npm ci
npm test
npm run build:site
npm run build
cargo package --allow-dirty
cargo fmt --check
cargo clippy --all-targets -- -D warnings
```

`cargo package` produced and verified nine files. Installing `target/package/capture-clock-repair-0.1.0` into a separate consumer root succeeded. The installed artifact reported version 0.1.0.

Normal, invalid, boundary, and recovery paths were exercised only in temporary directories:

- Recursive scan, `--no-recursive`, filename inference, filesystem fallback, unsupported PNG reporting, review CSV, plan JSON, dry-run, apply, undo dry-run, undo, and explicit timezone-conflict amendment passed.
- `+23:59`, `-23:59`, and the formerly broken separated `-04:00` offsets passed.
- Invalid `+24:00`, a missing archive, an empty approved set, and changed-sidecar undo refusal returned exit 2 with actionable diagnostics.
- Source photo SHA-256 stayed unchanged. No real photo or browser data was changed.

### Live desktop, phone, accessibility, privacy, and offline checks

- Fresh 1440×900 desktop and 390×844 phone contexts loaded HTTP 200 with no horizontal overflow or page errors on the valid routes.
- Root, privacy, and terms each have `lang=en`, one H1, one main landmark, a title, and zero Axe violations in light and dark schemes. The factory `verify-url.sh` passed.
- Keyboard Tab order reaches all controls. Focus is a visible 3 px ochre outline. The skip link works and there is no keyboard trap.
- Reduced motion computes to `0.00001s` transitions and `scroll-behavior: auto`.
- A populated WhatsApp sample showed a filename inference at `2025-04-18T19:42:11-04:00`. Local and session storage remained empty before and after that sample. Reload reset the form naturally, but there is no explicit demo reset.
- Normal loads requested only the product origin. A deliberate fake-license return stripped the token from the URL, stored only the two documented namespaced keys, and called only the Sociobot verification endpoint.
- Service-worker install/update had no waiting worker. After control, an offline reload returned the cached home page and displayed the offline notice.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1,212.6 ms, CLS 0, total blocking time 66.5 ms.
- Built initial assets are 5,906 B JavaScript and 10,859 B CSS; the 600 px hero is 19,164 B.

This product has no product backend, tenant database, or health endpoint, so tenant isolation, restart persistence, and product 429/`Retry-After` checks are not applicable. The external billing checkout was checked separately and is covered by R4.

## Earlier finding disposition

| Earlier finding | Current disposition |
|---|---|
| Separated negative offset `--timezone -04:00` failed | **Fixed:** installed package accepts it and preserves the offset |
| Browser tests needed an undocumented Chromium prerequisite | **Fixed:** Playwright is pinned to 1.58.2 and README documents `npx playwright install chromium` |
| README had duplicated commands and an unmatched fence | **Fixed:** current README renders cleanly |

The earlier PASS did not exercise a tampered trusted row, the mandatory CLI demo contract, the real registry install command, the checkout link, or the styled 404 requirement. Those are current findings, not regressions introduced by the documentation-only commits.

## Decision

**FAIL.** There are 9 findings and 20 untested public claims. The product must not be declared PASS until all findings are resolved and every public claim has one passing declared sandbox test.
