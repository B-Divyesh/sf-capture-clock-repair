# Capture Clock Repair

Capture Clock Repair is a local CLI for photographers combining camera, phone, messenger, and travel archives. It finds missing and shifted photo capture times and writes an editable review plan. Approved changes become adjacent XMP sidecars. The original photo bytes stay unchanged.

## Install

Install Rust, clone the public source, and install the reviewed checkout:

```sh
git clone https://github.com/B-Divyesh/sf-capture-clock-repair.git
cargo install --locked --path ./sf-capture-clock-repair
capture-clock-repair --help
```

The factory does not publish registry packages from a repair worker.

## Try the bundled demo

Run the complete scan flow without pointing the CLI at personal files:

```sh
capture-clock-repair demo
```

The command creates a new folder under the system temporary directory. It copies four bundled sample files there and writes a populated `review.csv` and `plan.json`. It prints every output path. Pass `--output NEW_FOLDER` to choose a new location.

The same sample is available at [capture-clock-repair.sociobot.in/demo/](https://capture-clock-repair.sociobot.in/demo/). Browser demo state is not stored. Use **Reset demo** to restore the first sample.

## Scan and review an archive

Create a review folder. Set the offset used for filename clocks:

```sh
capture-clock-repair scan ~/Pictures/Trip \
  --output clock-review \
  --timezone +05:30
```

Negative offsets work in the same form:

```sh
capture-clock-repair scan ~/Pictures/Trip --output clock-review --timezone -04:00
```

Scan writes `clock-review/review.csv` and `clock-review/plan.json`. It reads subfolders unless `--no-recursive` is set. The plan groups camera and messenger sources when the available evidence supports a group.

Review `review.csv` in a spreadsheet or text editor:

- `keep` protects a current embedded `DateTimeOriginal`.
- `accept` approves an unchanged proposal for a file without that EXIF value.
- `amend` approves a reviewed time or a still-valid filename and EXIF conflict.
- `review` and `skip` produce no sidecar.

Use an ISO 8601 `proposed_time` with an offset, such as `2025-04-18T19:42:11+05:30`.

## Preview, apply, and undo

Preview all approved writes before applying them:

```sh
capture-clock-repair apply clock-review/review.csv --dry-run
capture-clock-repair apply clock-review/review.csv \
  --manifest clock-review/undo.json
```

Apply re-reads each current JPEG before writing. A current `DateTimeOriginal` is refused unless the row is an explicit amendment of a conflict the CLI can reproduce. Editing CSV control fields cannot turn trusted EXIF into an accepted missing date.

Each approved repair creates `<original filename>.xmp`. Apply refuses an existing sidecar. The manifest records the SHA-256 checksum of each new sidecar. Undo removes only unchanged sidecars:

```sh
capture-clock-repair undo clock-review/undo.json
```

## Supported evidence

- JPEG and JPG files with EXIF `DateTimeOriginal`, `OffsetTimeOriginal`, camera make, and camera model
- Filename clocks such as `IMG_20250418_194211.jpg`, `2025-04-18 19.42.11.jpg`, and `WhatsApp Image 2025-04-18 at 19.42.11.jpg`
- Missing dates, filename and EXIF conflicts, and likely whole-hour timezone shifts
- Recursive folders by default, with `--no-recursive` for one folder

Version 0.1.1 reports RAW, HEIC, video, TIFF, and PNG files as unsupported. It does not change those files. The CLI proposes review evidence and does not claim forensic certainty.

## Scripting

Every command supports `--json`. Successful JSON goes to stdout. Diagnostics go to stderr. Exit code `0` means success, `2` means invalid input or a safety refusal, and `1` means an unexpected I/O failure. Commands do not prompt for input.

## Privacy and offline use

The CLI reads local files and makes no network requests. It contains no telemetry. The website uses no analytics, trackers, third-party scripts, or remote fonts. The guide and browser sample reload offline after their first visit.

See the published [privacy policy](https://capture-clock-repair.sociobot.in/privacy/) and [terms](https://capture-clock-repair.sociobot.in/terms/).

## Develop, test, and package

From a clean checkout:

```sh
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
npm ci
npx playwright install chromium
npm test
npm run build:site
npm run build
cargo package --allow-dirty
```

`npm test` runs Rust, CLI-consumer, claim, browser-demo, privacy, and offline checks. Run one declared claim with `npm run test:claim -- CLAIM_ID`. Every public claim and command is listed in `.factory/claims.json`.

`npm run build` creates `dist/bin/capture-clock-repair` for the current platform and the static site in `dist/site`. The factory deploys `dist/site`; it owns release binaries and registry credentials.

## License

MIT. See [LICENSE](LICENSE). Changes are recorded in [CHANGELOG.md](CHANGELOG.md).
