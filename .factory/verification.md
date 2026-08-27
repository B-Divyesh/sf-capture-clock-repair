# Independent verification 1 — FAIL

**Candidate:** `2394f4d433616665f686adb6bf7b68406d2107e3`
**Live URL:** https://capture-clock-repair.sociobot.in/
**Verified:** 2026-08-27
**Method:** fresh detached clone at the candidate SHA; no product-source changes were made during verification.

## Release decision

**FAIL.** The CLI rejects the ordinary documented negative timezone value form, `--timezone -04:00`, with exit code 2 (`unexpected argument '-0' found`). Negative offsets are a core travel/timezone use case in the brief and CLI help promises `+HH:MM or -HH:MM`. The undisclosed workaround `--timezone=-04:00` does work, so this is a contained but release-blocking CLI parsing defect rather than a data-loss issue.

## Passed evidence

### Clean install, test, build, package

- Fresh clone checked out detached at the candidate SHA; `npm ci` completed with 0 reported npm vulnerabilities.
- `cargo fmt --check` and `cargo clippy --all-targets -- -D warnings` passed.
- `npm test` passed: 5 Rust tests, 1 compiling Rust doctest, and 3 Node tests; 0 failures.
- `npm run build` passed and produced `dist/bin/capture-clock-repair` plus `dist/site`.
- Production assets: JS 5,906 bytes (2,770 gzip), CSS 10,859 bytes (3,400 gzip), hero WebP 77,272 bytes / responsive asset 19,164 bytes. These are within the stated budgets.
- `cargo package --allow-dirty` verified `capture-clock-repair v0.1.0` (9 files, 61.0 KiB). The packaged crate was unpacked and installed into a clean consumer root with `cargo install --path`; its binary reported `capture-clock-repair 0.1.0` and performed a successful scan.

### CLI end-to-end and safety behavior

Using the built release binary against a temporary archive containing a filename-dated WhatsApp JPEG, a renamed JPEG, a nested directory, and an unsupported PNG:

- Recursive scan produced a review CSV and JSON plan: 2 examined JPEGs, 1 high-confidence filename proposal, 1 filesystem-time `review`, and 1 unsupported PNG. The proposal was exactly `2025-04-18T19:42:11+05:30`.
- `apply --dry-run`, `apply`, and `undo` all returned valid JSON. Apply created only the adjacent `.xmp`; SHA-256 confirmed the original photo was unchanged. Undo removed the unchanged sidecar.
- `--no-recursive` excluded the nested JPEG as expected.
- Invalid `+24:00` and a missing archive each returned exit code 2 with diagnostics; a valid `+23:59` boundary scan succeeded.
- Existing sidecars were refused (exit 2). After manually changing an applied sidecar, undo refused to remove it (exit 2), leaving it in place.
- The package-installed binary accepted `--timezone=-04:00` and emitted `2025-04-18T19:42:11-04:00`.
- Rust tests also cover EXIF-protected embedded times and explicit `amend` handling for a flagged timezone conflict.

### Site, accessibility, privacy, and PWA

- `npm run test:browser` passed locally and against the live URL after installing the Playwright Chromium test prerequisite. On `/`, `/privacy/`, and `/terms/`, in light and dark modes: HTTP 200, exactly one `h1`, exactly one `main`, zero console/page errors, and zero Axe violations (including serious/critical).
- At 390 x 844 the interactive demo completed without horizontal overflow. Keyboard-only smoke testing reached the skip link, native selects, and submit action; the result updated. A visible 3 px focus outline was present. With reduced motion, transition duration was `0.01ms`.
- Lighthouse mobile against the production build: Performance **99**, Accessibility **100**, LCP **1,665.895 ms**, CLS **0**. (INP was not observed by this lab run.)
- Initial live-page load made no requests outside `capture-clock-repair.sociobot.in`; source inspection found no analytics, tracking, CDN font, or third-party script. The only optional outbound browser request is the disclosed Sociobot license verification after a user supplies/returns a license; the CLI makes no requests.
- Live HTTP response headers included HSTS, CSP restricting scripts/styles to self and connects to the license API, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, Referrer-Policy, and a restrictive Permissions-Policy. Hashed JS has `Cache-Control: public, max-age=31536000, immutable`; `sw.js` has `no-cache`.
- The live `index.html` SHA-256 and `assets/main-BAEvsmo6.js` SHA-256 exactly matched the locally built candidate outputs. The service worker registered cache `capture-clock-repair-v2`; an offline reload of the live URL returned 200, rendered the home heading, and displayed the offline notice.

## Defects

### Medium — negative timezone argument is rejected in normal CLI form (release blocker)

Reproduction:

```sh
capture-clock-repair scan ./archive --output clock-review --timezone -04:00 --json
```

Actual: exit 2 and `error: unexpected argument '-0' found`.
Expected: accept the documented `-HH:MM` offset just as `+05:30` is accepted, preserving it in filename-inferred proposals.
Workaround: `--timezone=-04:00` works but is not stated in the CLI help or README.

### Low — browser verification is not runnable after the documented clean install alone

Immediately after `npm ci`, `npm run test:browser` fails because Playwright's Chromium executable is absent and the README does not mention `npx playwright install chromium`. After that one test-tool prerequisite, the browser suite passes. This does not affect the built product.

### Low — README ends with stray commands and an unmatched closing code fence

Lines 86–89 repeat `npm run dev`, `npm test`, and `npm run build` after the License paragraph and end with an unmatched ``` fence. This is a documentation rendering defect.

## Required fix and re-verification

Configure the `--timezone` argument to accept hyphen-prefixed values in the normal separated form (and add a regression test for `-04:00`). Document the Playwright browser-install prerequisite or provide it through the test setup, and repair the README fence. Re-run the CLI package consumer test, `npm test`, `npm run test:browser`, `npm run build`, and this negative-offset case before requesting a new verification.
