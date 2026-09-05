# Demo sandbox

## Browser

- URL: `https://capture-clock-repair.sociobot.in/demo/`
- Local URL: `http://127.0.0.1:4173/demo/` after `npm run build:site` and `npx vite preview`
- Entry: the landing page's `Try it with sample data` link opens the filled WhatsApp example in one click.
- Samples: a WhatsApp image without EXIF, a Nikon filename and EXIF conflict, and a renamed JPEG with a filesystem-time fallback.
- Reset: `Reset demo` restores the WhatsApp sample and `-04:00` offset.
- Exit: `Start for real` opens the source-install instructions.
- Storage: the browser demo writes no local storage, session storage, IndexedDB, OPFS, or application data. It only changes in-memory form state. The service worker caches public site assets, not demo input or user data.

The persistent banner reads `Demo — sample data, nothing is saved` while demo mode is active.

## CLI

Run:

```sh
capture-clock-repair demo
```

The command embeds the files committed under `examples/sample-archive/`. The four synthetic image fixtures were drawn locally with ImageMagick gradients and patterns on 5 September 2026. They contain no personal data or third-party material. The command creates a new `capture-clock-repair-demo-*` folder under the system temporary directory and prints its path. It never reads a personal archive. Pass `--output NEW_FOLDER` to place the sample in a specific new folder. Existing output folders are refused.

The workspace contains:

- three sample JPEGs;
- one PNG that demonstrates unsupported-file reporting;
- `clock-review/review.csv`;
- `clock-review/plan.json`.

Use `capture-clock-repair demo --json` for a machine-readable summary.
