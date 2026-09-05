# Landing-page copy audit

Audited 5 September 2026 against `site/index.html`. Word counts treat code tokens and the product name as written words. No sentence exceeds 22 words. No banned marketing word appears.

## First screen

| Copy | Words | Result |
|---|---:|---|
| Repair missing and shifted photo times | 6 | Pass |
| For photographers combining camera, phone, messenger, and travel archives into one accurate timeline. | 13 | Pass |
| Try it with sample data | 5 | Pass |
| Install from source | 3 | Pass |
| The sample opens a filled review plan. | 7 | Pass |
| It does not read or save your files. | 8 | Pass |
| Runs offline after installation. | 4 | Pass |
| Original photo files stay unchanged. | 5 | Pass |
| Free under the MIT License. | 5 | Pass |
| The tool adds XMP sidecars beside photos. | 7 | Pass |
| It does not rewrite the photo. | 6 | Pass |

The first screen can be read aloud in one breath: it repairs photo times for photographers, and the first action opens sample data.

## Remaining sentences

| Copy | Words | Result |
|---|---:|---|
| This recording comes from the bundled capture-clock-repair demo command. | 9 | Pass |
| Demo — sample data in an isolated temporary workspace. | 8 | Pass |
| Examined 3 JPEGs across 2 source groups: 3 proposed, 1 needs review, 1 unsupported. | 14 | Pass |
| No personal photos or existing files were read or changed. | 10 | Pass |
| Read JPEG EXIF, filename clocks, filesystem time, camera make, and model. | 11 | Pass |
| Check trusted dates, filename proposals, weak fallbacks, and timezone conflicts in CSV. | 12 | Pass |
| Create adjacent XMP sidecars for approved rows. | 8 | Pass |
| Remove unchanged sidecars with the undo manifest. | 7 | Pass |
| The CLI reads local JPEG metadata and filenames. | 8 | Pass |
| It does not upload photos or collect telemetry. | 8 | Pass |
| It reports RAW, HEIC, video, TIFF, and PNG files as unsupported without changing them. | 14 | Pass |
| Proposals are evidence for review, not proof of when a photo was taken. | 13 | Pass |
| Trusted EXIF is checked again during apply. | 7 | Pass |
| Each inferred date includes its source and confidence. | 8 | Pass |
| Each write has a checksummed undo record. | 7 | Pass |
| Install Rust, then run these commands. | 6 | Pass |

## Interface phrases

These headings and controls are fragments, not sentences. Each one names a task or result directly: `CLI sample`, `See the CLI finish a sample scan`, `Open the filled browser sample`, `How it works`, `Review every change before writing`, `Scan the archive`, `Review the plan`, `Apply or undo`, `Scope and privacy`, `Know what the CLI reads and writes`, `Install`, `Install from the public source repository`, `Copy install commands`, `Scan`, `Preview writes`, and `Undo`.

## Terminology

| Concept | One term used |
|---|---|
| Source image file | photo |
| Proposed changes | review plan |
| Metadata output file | XMP sidecar |
| Original embedded capture date | trusted EXIF |
| Rollback record | undo manifest |
| No-account example | sample |
| Input collection | archive |
