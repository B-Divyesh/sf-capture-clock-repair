import test, { after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const executable = process.platform === "win32" ? "capture-clock-repair.exe" : "capture-clock-repair";
const binaryPath = join(repo, "target", "release", executable);
let built = false;
let previewProcess;
let previewBase;

function temp(label) {
  return mkdtempSync(join(tmpdir(), `ccr-${label}-`));
}

function command(program, args, options = {}) {
  return execFileSync(program, args, {
    cwd: repo,
    encoding: "utf8",
    env: { ...process.env, ...options.env },
    stdio: options.stdio || ["ignore", "pipe", "pipe"]
  });
}

function ensureBinary() {
  if (!built || !existsSync(binaryPath)) {
    command("cargo", ["build", "--release", "--locked"]);
    built = true;
  }
  return binaryPath;
}

function runCli(args, options = {}) {
  return command(ensureBinary(), args, options);
}

function sha(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function makeExifJpeg() {
  const bytes = [];
  const push16le = (value) => bytes.push(value & 255, value >> 8);
  const push32le = (value) => bytes.push(value & 255, value >> 8, value >> 16, value >> 24);
  const entry = (tag, kind, count, value) => { push16le(tag); push16le(kind); push32le(count); push32le(value); };
  bytes.push(...Buffer.from("II")); push16le(42); push32le(8); push16le(3);
  entry(0x010f, 2, 6, 50); entry(0x0110, 2, 5, 56); entry(0x8769, 4, 1, 62); push32le(0);
  bytes.push(...Buffer.from("NIKON\0D750\0\0")); push16le(2);
  entry(0x9003, 2, 20, 92); entry(0x9011, 2, 7, 112); push32le(0);
  bytes.push(...Buffer.from("2025:04:18 19:42:11\0+05:30\0"));
  const tiff = Buffer.from(bytes);
  const header = Buffer.alloc(12);
  header.set([0xff, 0xd8, 0xff, 0xe1]);
  header.writeUInt16BE(6 + tiff.length + 2, 4);
  header.set(Buffer.from("Exif\0\0"), 6);
  return Buffer.concat([header, tiff, Buffer.from([0xff, 0xd9])]);
}

function editFirstCsvRow(path, changes) {
  const lines = readFileSync(path, "utf8").trimEnd().split(/\r?\n/);
  const headers = lines[0].split(",");
  const values = lines[1].split(",");
  for (const [key, value] of Object.entries(changes)) values[headers.indexOf(key)] = value;
  writeFileSync(path, `${headers.join(",")}\r\n${values.join(",")}\r\n`);
}

async function startPreview() {
  if (previewBase) return previewBase;
  command("npm", ["run", "build:site"]);
  const port = 43100 + Math.floor(Math.random() * 1000);
  previewBase = `http://127.0.0.1:${port}`;
  previewProcess = spawn(join(repo, "node_modules", ".bin", process.platform === "win32" ? "vite.cmd" : "vite"), [
    "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"
  ], { cwd: repo, stdio: "ignore" });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(previewBase);
      if (response.ok) return previewBase;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error("Vite preview did not start");
}

after(() => {
  if (previewProcess && !previewProcess.killed) previewProcess.kill("SIGTERM");
});

test("@claim:source-install a clean source checkout installs a working CLI", { timeout: 180_000 }, () => {
  const root = temp("install");
  command("cargo", ["install", "--locked", "--path", repo, "--root", root]);
  const installed = join(root, "bin", executable);
  assert.match(command(installed, ["--version"]), /capture-clock-repair 0\.1\.1/);
  const result = JSON.parse(command(installed, ["demo", "--output", join(root, "sample-run"), "--json"]));
  assert.equal(result.summary.examined, 3);
  assert.ok(existsSync(result.review_csv));
});

test("@claim:mit-license the complete CLI is usable under the MIT License", () => {
  const metadata = JSON.parse(command("cargo", ["metadata", "--no-deps", "--format-version", "1"]));
  const product = metadata.packages.find((item) => item.name === "capture-clock-repair");
  assert.equal(product.license, "MIT");
  assert.match(readFileSync(join(repo, "LICENSE"), "utf8"), /Permission is hereby granted, free of charge/);
  const root = temp("free-core");
  const result = JSON.parse(runCli(["demo", "--output", join(root, "workspace"), "--json"]));
  assert.equal(result.summary.examined, 3);
});

test("@claim:cli-demo bundled demo creates a separate populated workspace", () => {
  const root = temp("demo");
  const workspace = join(root, "workspace");
  const result = JSON.parse(runCli(["demo", "--output", workspace, "--json"]));
  assert.match(result.mode, /^demo/i);
  assert.equal(result.summary.examined, 3);
  assert.equal(result.summary.review, 1);
  assert.equal(result.summary.unsupported, 1);
  assert.deepEqual(readdirSync(join(workspace, "sample-archive")).sort(), [
    "IMG_20250703_081522.jpg",
    "WhatsApp Image 2025-04-18 at 19.42.11.jpg",
    "summer-evening.jpg",
    "trip-export.png"
  ]);
  assert.ok(existsSync(result.review_csv));
  assert.ok(existsSync(result.plan_json));
  assert.equal(readdirSync(root).join(), "workspace");
});

test("@claim:archive-plan scan exports grouped CSV and JSON while reporting unsupported files", () => {
  const root = temp("scan");
  const archive = join(root, "archive");
  const nested = join(archive, "nested");
  const output = join(root, "review");
  mkdirSync(nested, { recursive: true });
  writeFileSync(join(archive, "WhatsApp Image 2025-04-18 at 19.42.11.jpg"), "photo");
  writeFileSync(join(nested, "IMG_20250703_081522.jpeg"), "photo");
  writeFileSync(join(archive, "export.png"), "unsupported");
  const plan = JSON.parse(runCli(["scan", archive, "--output", output, "--json"]));
  assert.equal(plan.summary.examined, 2);
  assert.equal(plan.summary.sources, 2);
  assert.equal(plan.summary.unsupported, 1);
  assert.equal(plan.unsupported_files.length, 1);
  assert.equal(readFileSync(join(output, "review.csv"), "utf8").trim().split(/\r?\n/).length, 3);
  assert.deepEqual(JSON.parse(readFileSync(join(output, "plan.json"), "utf8")).summary, plan.summary);

  const shallow = JSON.parse(runCli(["scan", archive, "--output", join(root, "shallow"), "--no-recursive", "--json"]));
  assert.equal(shallow.summary.examined, 1);
});

test("@claim:timezone-offset filename proposals preserve the selected negative offset", () => {
  const root = temp("offset");
  const archive = join(root, "archive");
  mkdirSync(archive);
  writeFileSync(join(archive, "IMG_20250418_194211.jpg"), "photo");
  const plan = JSON.parse(runCli(["scan", archive, "--output", join(root, "review"), "--timezone", "-04:00", "--json"]));
  assert.equal(plan.records[0].proposed_time, "2025-04-18T19:42:11-04:00");
  assert.equal(plan.records[0].offset, "-04:00");
});

test("@claim:trusted-exif apply rejects a CSV that disguises current trusted EXIF", () => {
  const root = temp("exif");
  const archive = join(root, "archive");
  const output = join(root, "review");
  mkdirSync(archive);
  const photo = join(archive, "IMG_20250418_194211.jpg");
  writeFileSync(photo, makeExifJpeg());
  runCli(["scan", archive, "--output", output]);
  const review = join(output, "review.csv");
  editFirstCsvRow(review, {
    status: "proposed",
    original_time: "",
    proposed_time: "2025-04-18T20:42:11+05:30",
    action: "accept"
  });
  const before = sha(photo);
  assert.throws(
    () => runCli(["apply", review, "--manifest", join(output, "undo.json"), "--json"]),
    (error) => error.status === 2 && error.stderr.includes("current file contains DateTimeOriginal")
  );
  assert.equal(sha(photo), before);
  assert.equal(existsSync(`${photo}.xmp`), false);
  assert.equal(existsSync(join(output, "undo.json")), false);
});

test("@claim:sidecar-undo apply changes only adjacent XMP and undo checks its checksum", () => {
  const root = temp("apply");
  const archive = join(root, "archive");
  const output = join(root, "review");
  mkdirSync(archive);
  const photo = join(archive, "IMG_20250418_194211.jpg");
  writeFileSync(photo, "original-photo-bytes");
  const before = sha(photo);
  runCli(["scan", archive, "--output", output, "--timezone", "+05:30"]);
  const manifest = join(output, "undo.json");
  const applied = JSON.parse(runCli(["apply", join(output, "review.csv"), "--manifest", manifest, "--json"]));
  const sidecar = `${photo}.xmp`;
  assert.equal(applied.created, 1);
  assert.equal(sha(photo), before);
  assert.match(readFileSync(sidecar, "utf8"), /ccr:Inference="filename".*ccr:Confidence="high".*ccr:Inferred="true"/s);
  const manifestData = JSON.parse(readFileSync(manifest, "utf8"));
  assert.equal(manifestData.created[0].sha256, sha(sidecar));
  const originalSidecar = readFileSync(sidecar);
  writeFileSync(sidecar, Buffer.concat([originalSidecar, Buffer.from("changed")]));
  assert.throws(() => runCli(["undo", manifest]), (error) => error.status === 2 && error.stderr.includes("refusing to remove changed sidecar"));
  assert.ok(existsSync(sidecar));
  writeFileSync(sidecar, originalSidecar);
  const undone = JSON.parse(runCli(["undo", manifest, "--json"]));
  assert.equal(undone.removed, 1);
  assert.equal(existsSync(sidecar), false);
  assert.equal(sha(photo), before);
  writeFileSync(sidecar, "existing user sidecar");
  assert.throws(
    () => runCli(["apply", join(output, "review.csv"), "--manifest", join(output, "second-undo.json")]),
    (error) => error.status === 2 && error.stderr.includes("already exists")
  );
  assert.equal(readFileSync(sidecar, "utf8"), "existing user sidecar");
});

test("@claim:script-interface JSON output and documented exit codes work without prompts", () => {
  const root = temp("json");
  const archive = join(root, "archive");
  mkdirSync(archive);
  writeFileSync(join(archive, "20250102_030405.jpg"), "photo");
  const value = JSON.parse(runCli(["scan", archive, "--output", join(root, "review"), "--json"]));
  assert.equal(value.summary.examined, 1);
  assert.throws(
    () => runCli(["scan", archive, "--output", join(root, "bad"), "--timezone", "+24:00", "--json"]),
    (error) => error.status === 2 && JSON.parse(error.stderr).exit_code === 2
  );
});

test("@claim:cli-private CLI demo completes when network system calls are blocked", () => {
  assert.equal(process.platform, "linux", "the clean claim sandbox must be Linux");
  const root = temp("network");
  const source = join(root, "block-network.c");
  const library = join(root, "block-network.so");
  const marker = join(root, "network-called");
  writeFileSync(source, `#include <sys/socket.h>\n#include <fcntl.h>\n#include <unistd.h>\n#include <stdlib.h>\n#include <errno.h>\nint socket(int domain,int type,int protocol){const char *p=getenv("CCR_NETWORK_MARKER");if(p){int f=open(p,O_WRONLY|O_CREAT|O_APPEND,0600);if(f>=0){write(f,"socket\\n",7);close(f);}}errno=EPERM;return -1;}\n`);
  command("cc", ["-shared", "-fPIC", source, "-o", library]);
  const result = JSON.parse(runCli(["demo", "--output", join(root, "workspace"), "--json"], {
    env: { LD_PRELOAD: library, CCR_NETWORK_MARKER: marker }
  }));
  assert.equal(result.summary.examined, 3);
  assert.equal(existsSync(marker), false);
});

test("@claim:web-demo one click opens a filled, resettable sample without browser data", { timeout: 120_000 }, async () => {
  const base = await startPreview();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Try it with sample data" }).click();
  await page.waitForURL("**/demo/");
  await assert.doesNotReject(() => page.getByText("Demo — sample data, nothing is saved", { exact: true }).waitFor());
  assert.match(await page.locator("#demo-result").innerText(), /WhatsApp Image 2025-04-18.*2025-04-18T19:42:11-04:00/s);
  await page.selectOption("#sample", "nikon");
  await page.getByRole("button", { name: "Update sample plan" }).click();
  assert.match(await page.locator("#demo-result").innerText(), /protected conflict/i);
  await page.getByRole("button", { name: "Reset demo" }).click();
  assert.equal(await page.locator("#sample").inputValue(), "whatsapp");
  assert.match(await page.locator("#demo-result").innerText(), /ready to review/i);
  assert.deepEqual(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })), { local: {}, session: {} });
  await context.close();
  await browser.close();
});

test("@claim:site-private browser sample sends requests only to its own origin", { timeout: 120_000 }, async () => {
  const base = await startPreview();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const origins = new Set();
  page.on("request", (request) => origins.add(new URL(request.url()).origin));
  await page.goto(`${base}/demo/`, { waitUntil: "networkidle" });
  await page.selectOption("#sample", "unknown");
  await page.getByRole("button", { name: "Update sample plan" }).click();
  assert.deepEqual([...origins], [new URL(base).origin]);
  assert.deepEqual(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })), { local: 0, session: 0 });
  await context.close();
  await browser.close();
});

test("@claim:offline-site guide and demo reload offline after the first visit", { timeout: 120_000 }, async () => {
  const base = await startPreview();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${base}/demo/`, { waitUntil: "networkidle" });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#demo-result")?.textContent.includes("WhatsApp Image") && !document.querySelector("#offline-notice")?.hidden);
  assert.equal(await page.locator("h1").innerText(), "Review a sample capture-time plan");
  assert.match(await page.locator("#demo-result").innerText(), /WhatsApp Image 2025-04-18/);
  assert.equal(await page.locator("#offline-notice").isVisible(), true);
  await context.close();
  await browser.close();
});
