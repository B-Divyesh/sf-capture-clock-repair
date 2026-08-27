# Capture Clock Repair

Capture Clock Repair is a conservative, offline-first CLI for photographers rebuilding a trustworthy timeline from mixed camera, phone, messenger, and travel archives. It inventories JPEG metadata, groups files by likely source, flags filename/date and timezone conflicts, and proposes inferred capture times in an editable review CSV. Approved repairs are written as adjacent XMP sidecars. Original photos are never modified.

## Install

Download a release binary for your platform, or build from source with Rust 1.85+:

```sh
cargo install --path .
capture-clock-repair --help
```

## Usage

Start by creating a review folder. Add an offset when filename clocks should be interpreted in a known local timezone:

```sh
capture-clock-repair scan ~/Pictures/Trip \
  --output clock-review \
  --timezone +05:30
```

This writes `clock-review/review.csv` and `clock-review/plan.json`. Rows with a trustworthy EXIF `DateTimeOriginal` use `keep` and can never become sidecar writes. Missing dates inferred from a filename are proposed as `accept`; weaker filesystem-time guesses remain `review`. Conflicts remain `review` until you explicitly change their action to `amend`.

Open `review.csv` in a spreadsheet or text editor. Set `action` to `accept` for an unchanged proposal, or use `amend` with an ISO 8601 `proposed_time` such as `2025-04-18T19:42:11+05:30`. Leave uncertain rows as `review` or `skip`. Then preview and apply:

```sh
capture-clock-repair apply clock-review/review.csv --dry-run
capture-clock-repair apply clock-review/review.csv \
  --manifest clock-review/undo.json
```

Each accepted repair creates `<original filename>.xmp`; it does not touch the source file. Existing sidecars are refused. The manifest records every created file and its checksum. Undo removes a sidecar only if it is still byte-for-byte identical:

```sh
capture-clock-repair undo clock-review/undo.json
```

All commands support `--json` for scripting. Diagnostics go to stderr and successful JSON goes to stdout. Exit code `0` means success, `2` means invalid input or a safety refusal, and `1` means an unexpected I/O failure.

### Public library surface

The crate exposes a small typed API used by the binary:

```rust
use capture_clock_repair::{scan_archive, ScanOptions};

let plan = scan_archive("tests/fixtures/archive", ScanOptions::default())?;
assert_eq!(plan.summary.trusted, 1);
# Ok::<(), capture_clock_repair::Error>(())
```

`scan_archive` is read-only. `apply_review` and `undo_manifest` are the only write APIs; both operate on sidecars, never originals.

## What it recognizes

- JPEG/JPG files, including EXIF `DateTimeOriginal`, `OffsetTimeOriginal`, camera make, and model
- Common camera and messenger filename clocks such as `IMG_20250418_194211.jpg`, `2025-04-18 19.42.11.jpg`, and `WhatsApp Image 2025-04-18 at 19.42.11.jpg`
- Existing trusted times, missing times, filename-versus-EXIF conflicts, and likely whole-hour timezone drift
- Recursive archives by default (`--no-recursive` is available)

Capture Clock Repair does not claim forensic certainty and does not rewrite embedded EXIF. RAW, HEIC, video, and PNG metadata are reported as unsupported in v0.1.0; those files remain untouched.

## Develop

```sh
cargo test
cargo build --release
npm install
npm test
npm run build:site       # static site -> dist/site
npm run build            # release binary + static site -> dist/
cargo package --allow-dirty
```

The landing site is dependency-free and can be served locally with `npm run dev`. It stores a pasted or returned Sociobot license and its daily verification verdict in local storage; the CLI itself performs no network calls and collects no telemetry.

## Privacy and deployment

Photo inspection is entirely local. No filenames, timestamps, metadata, or plans leave the machine. The website uses no analytics, third-party scripts, or CDN assets. Static deployment serves `dist/site` at [capture-clock-repair.sociobot.in](https://capture-clock-repair.sociobot.in); the factory owns deployment and registry credentials.

## License

MIT. See [LICENSE](LICENSE). Changes are recorded in [CHANGELOG.md](CHANGELOG.md).
npm run dev
npm test
npm run build   # -> dist/
```
