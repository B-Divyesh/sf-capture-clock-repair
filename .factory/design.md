# Visual thesis — the timestamp herbarium

Capture Clock Repair uses a **botanical field guide** as its visual language. A mixed photo archive resembles a specimen collection: each file has provenance, some labels survive, and uncertain observations must be annotated without damaging the specimen. The interface therefore feels like a careful naturalist's worktable rather than a generic software dashboard.

## Palette

The light treatment is deliberately paper-first: herbarium paper `#F3EBDD`, pressed-leaf ink `#24382C`, muted graphite `#5D675F`, specimen-card `#FFFDF6`, fern `#2F6348`, fern-dark `#214A35`, ochre warning `#8A5A16`, carmine error `#993D32`, and sapling success `#2F6B49`. The dark treatment uses night-field `#142019`, leaf-card `#1D2B22`, parchment text `#F3EBDD`, muted lichen `#B9C4BA`, and spring accent `#8BC49E`. All body and control combinations meet WCAG AA contrast. Color is always paired with a word, icon, or border pattern.

## Type and spacing

Headings use the local Georgia serif stack for the engraved authority of an old field manual. Body, code, controls, and tabular data use a system sans/monospace stack; no font files or third-party requests are needed. The type scale is 14, 16, 20, 25, 40, and 58 px. A strict 4/8 px rhythm gives 4, 8, 12, 16, 24, 32, 48, 64, and 96 px spacing tokens. Reading width tops out at 72 characters.

## Form, assets, and interaction grammar

Fine rules, clipped label corners, index numerals, cross-reference marks, and dotted leader lines evoke specimen sheets. Cards are reserved for real independent objects: the scan plan, safety guarantees, and command stages. The primary action is a deep fern button; secondary actions are paper links with an underlined offset. Controls visibly depress by 1 px. Focus uses a 3 px ochre ring.

The original hero artwork is a generated editorial botanical plate: a fern whose fronds transition into orderly timestamp labels around an undamaged photographic negative. It explains the product promise—repair the catalogue, preserve the specimen—with useful negative space for the CLI transcript. Final prompt: “Use case: scientific-educational. Asset type: wide landing-page hero illustration. Primary request: a botanical field-guide plate on warm archival paper, showing one pressed fern specimen whose fronds subtly transition into orderly timestamp tick marks beside a pristine 35mm photographic negative in a paper specimen sleeve. Style/medium: refined hand-drawn scientific plate, fine graphite and muted forest-green ink, tactile paper grain, delicate registration marks. Composition/framing: wide landscape with the specimen concentrated toward the right and calm usable negative space; balanced, quiet, archival. Lighting/mood: soft natural worktable light, careful and trustworthy. Color palette: parchment, deep fern, charcoal, restrained ochre. Constraints: preserve a clearly undamaged negative; no readable text, no people, no logos, no watermark, no glossy 3D rendering.” Generated with `/opt/fleet/lib/gen-image.sh` using the `factory-image` deployment on 2026-08-27 and licensed as part of this MIT project. The committed WebP is optimized below 300 KB.

## Motion and responsive policy

Motion is restrained and physical: the demo result lifts 6 px into place over 220 ms, and status changes cross-fade over 180 ms. Nothing loops. With `prefers-reduced-motion: reduce`, transitions and scroll behavior are instant. At 390 px the botanical plate becomes a shallow banner, the command steps stack, table-like specimens become labeled rows, and nonessential marginal folio numbers disappear. Targets remain at least 44 px.

## Why it fits

The metaphor reinforces the safety model instead of decorating it. Originals are specimens; metadata is a removable label; confidence is an observation note; an undo manifest is the accession record. That makes conservative behavior understandable before a user reads a command.

## Repair 2 copy and route policy

The botanical direction remains visual, but public copy now uses literal photo and metadata terms. Headings name the task or section. The first screen states the job, audience, sample action, and three concrete facts before the illustration.

The static site uses Vite with plain HTML, CSS, and JavaScript. Separate HTML entries provide `/`, `/demo/`, `/privacy/`, `/terms/`, and the product 404. This keeps the CLI documentation fast and usable without a client framework.

The 1200×630 social card is a center crop of the original generated hero plate. The 180×180 Apple touch icon is a crop of the same plate. Both were made with ImageMagick from the committed original on 2026-09-05. The favicon is an original hand-written SVG using the product palette. No external asset or font was added.
