# Visual thesis — the timestamp herbarium

Capture Clock Repair uses a **botanical field guide** as its visual language. A mixed photo archive resembles a specimen collection: each file has provenance, some labels survive, and uncertain observations must be annotated without damaging the specimen. The interface therefore feels like a careful naturalist's worktable rather than a generic software dashboard.

## Palette

The light treatment is deliberately paper-first: herbarium paper `#F3EBDD`, pressed-leaf ink `#24382C`, muted graphite `#5D675F`, specimen-card `#FFFDF6`, fern `#2F6348`, fern-dark `#214A35`, ochre warning `#8A5A16`, carmine error `#993D32`, and sapling success `#2F6B49`. The dark treatment uses night-field `#142019`, leaf-card `#1D2B22`, parchment text `#F3EBDD`, muted lichen `#B9C4BA`, and spring accent `#8BC49E`. All body and control combinations meet WCAG AA contrast. Color is always paired with a word, icon, or border pattern.

## Type and spacing

Headings use the local Georgia serif stack for the engraved authority of an old field manual. Body, code, controls, and tabular data use a system sans/monospace stack; no font files or third-party requests are needed. The type scale is 14, 16, 20, 25, 40, and 58 px. A strict 4/8 px rhythm gives 4, 8, 12, 16, 24, 32, 48, 64, and 96 px spacing tokens. Reading width tops out at 72 characters.

## Form, assets, and interaction grammar

Fine rules, clipped label corners, index numerals, cross-reference marks, and dotted leader lines evoke specimen sheets. Cards are reserved for real independent objects: the scan plan, safety guarantees, and command stages. The primary action is a deep fern button; secondary actions are paper links with an underlined offset. Controls visibly depress by 1 px. Focus uses a 3 px ochre ring.

The original hero artwork is a generated editorial botanical plate: a fern whose fronds transition into orderly timestamp labels around an undamaged photographic negative. It explains the product promise—repair the catalogue, preserve the specimen—with useful negative space for the CLI transcript. Prompt: “Botanical field-guide plate on warm archival paper, pressed fern specimen whose fronds subtly become timestamp tick marks, a pristine 35mm negative in a paper specimen sleeve, fine graphite and muted forest-green ink, small unlabeled catalog marks, quiet scientific composition, no readable text, no logos, no watermark, wide landscape editorial illustration.” Generated with the factory `factory-image` deployment on 2026-08-27 and licensed as part of this MIT project. The committed WebP is optimized below 300 KB.

## Motion and responsive policy

Motion is restrained and physical: the demo result lifts 6 px into place over 220 ms, and status changes cross-fade over 180 ms. Nothing loops. With `prefers-reduced-motion: reduce`, transitions and scroll behavior are instant. At 390 px the botanical plate becomes a shallow banner, the command steps stack, table-like specimens become labeled rows, and nonessential marginal folio numbers disappear. Targets remain at least 44 px.

## Why it fits

The metaphor reinforces the safety model instead of decorating it. Originals are specimens; metadata is a removable label; confidence is an observation note; an undo manifest is the accession record. That makes conservative behavior understandable before a user reads a command.
