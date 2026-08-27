import { copyFile, mkdir } from "node:fs/promises";
import { platform } from "node:os";

await mkdir("dist/bin", { recursive: true });
const extension = platform() === "win32" ? ".exe" : "";
await copyFile(`target/release/capture-clock-repair${extension}`, `dist/bin/capture-clock-repair${extension}`);
console.log("Copied release binary to dist/bin");
