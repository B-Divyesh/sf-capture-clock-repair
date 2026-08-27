# Capture Clock Repair v0.1.0 handoff

## What shipped

- A typed Rust library and `capture-clock-repair` single-binary CLI with `scan`, `apply`, and `undo` commands, helpful `--help`, structured `--json`, stable exit codes, dry runs, and no prompts or telemetry.
- Recursive JPEG inventory with EXIF `DateTimeOriginal`, `OffsetTimeOriginal`, make/model source grouping, common camera/messenger filename clocks, filesystem fallback, unsupported-format reporting, filename conflicts, and likely whole-hour timezone-drift flags.
- `review.csv` plus `plan.json`. Clean embedded dates default to `keep`. Missing filename-derived dates default to `accept`; weak filesystem dates and all conflicts default to `review`. A conflict can become an XMP proposal only through an explicit `amend`, and apply re-reads EXIF and confirms the conflict before writing.
- Adjacent `<photo>.xmp` patches that label the date, evidence, confidence, and inferred status. Originals are never written. Existing sidecars and existing manifest files are refused.
- A checksummed undo manifest. Undo removes only the exact sidecars that apply created and refuses any sidecar changed afterward.
- A responsive, keyboard-operable static landing/docs site at `dist/site`, with an interactive recorded demo, offline shell, dark treatment, privacy and terms pages, and the Sociobot one-time paid-unlock flow. All CLI safety, repair, undo, and export features remain free; $19 unlocks only the optional browser field kit.
- The botanical field-guide visual system in `.factory/design.md` and an original factory-generated hero plate. The optimized WebP is 76 KB, with a 19 KB responsive variant.

## Run and verify

```sh
npm install
npm test
npm run build
npm run dev
```

`npm test` runs five Rust unit/integration tests, the compiling Rust documentation example, and three browser-logic tests. `npm run build` builds the release binary at `dist/bin/capture-clock-repair` and the deployable static site at `dist/site/index.html`.

Additional checks completed on 2026-08-27:

- `cargo clippy --all-targets --all-features -- -D warnings` — passed.
- `cargo package --allow-dirty` — package verification passed. Ready-to-publish command: `cargo publish` (factory credentials only; not run here).
- Real CLI scan → CSV → dry run → sidecar apply → JSON result → checksummed undo — passed against a temporary JPEG archive.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ .factory/evidence` — HTTP 200, title/lang/main/alt present, no console errors. Evidence and desktop/mobile screenshots are in `.factory/evidence/`.
- Playwright + Axe on `/`, `/privacy/`, and `/terms/`, in light and dark schemes — zero violations and zero console/page errors. A 390 × 844 run had no horizontal overflow and completed the demo with keyboard-native controls.
- Lighthouse mobile against the production build — Performance 100, Accessibility 100, Best Practices 100, SEO 100. LCP 1.4 s, CLS 0, total transfer 86 KiB. INP was not observed in the lab run; the only demo update is synchronous and contains no long task.
- Built asset budgets: initial JS 5.91 KB, CSS 10.86 KB, hero WebP 76 KB desktop / 19 KB mobile; no runtime CDN, fonts, analytics, or third-party scripts.

## Known gaps and next steps

- v0.1.0 reads embedded metadata only from JPEG/JPG. RAW, HEIC, TIFF, PNG, and video files are listed as unsupported and untouched. A future parser can add them without changing the plan format.
- Timezone drift is evidence, not certainty. The CLI proposes the filename clock for review but requires the user to change `review` to `amend`; it never rewrites embedded EXIF.
- The factory still needs to register the paid product, provide release binaries for target platforms, and switch to its release deployment process. No registry publication, infrastructure, DNS, billing registration, or secrets were touched.
