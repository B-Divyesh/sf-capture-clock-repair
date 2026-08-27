import { analyzeSample, specimenMarkup } from "./demo.mjs";

const slug = "capture-clock-repair";
const apiBase = "https://api.sociobot.in/api/v1";
const licenseKey = `sb_license:${slug}`;
const verdictKey = `${licenseKey}:verdict`;
const day = 86_400_000;

const byId = (id) => document.getElementById(id);
const setOffline = () => { const notice = byId("offline-notice"); if (notice) notice.hidden = navigator.onLine; };
setOffline();
window.addEventListener("online", setOffline);
window.addEventListener("offline", setOffline);

byId("demo-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const result = analyzeSample(byId("sample").value, byId("timezone").value);
  const output = byId("demo-result");
  if (!result) {
    output.innerHTML = '<div class="empty-mark" aria-hidden="true">⌖</div><p><b>No specimen selected</b></p><p>Choose an evidence pattern, then inspect again.</p>';
    output.classList.remove("is-filled");
    return;
  }
  output.innerHTML = specimenMarkup(result);
  output.classList.remove("is-filled");
  requestAnimationFrame(() => output.classList.add("is-filled"));
});

document.querySelectorAll("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    button.textContent = "Copied";
  } catch {
    button.textContent = "Select commands below";
  }
  window.setTimeout(() => { button.textContent = "Copy commands"; }, 1800);
}));

function stored(key) { try { return localStorage.getItem(key); } catch { return null; } }
function save(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode may deny storage */ } }

function showUnlocked(message = "License active on this device.") {
  byId("unlocked-kit").hidden = false;
  byId("license-form").hidden = true;
  byId("license-status").classList.remove("error");
  byId("license-status").textContent = message;
  byId("license-title").textContent = "Your field kit";
}

function showLocked(message) {
  byId("unlocked-kit").hidden = true;
  byId("license-form").hidden = false;
  byId("license-status").classList.add("error");
  byId("license-status").innerHTML = `${message} <a href="${apiBase}/products/${slug}/checkout">Buy a new license</a>.`;
}

async function verifyLicense(token, force = false) {
  const cachedRaw = stored(verdictKey);
  let cached = null;
  try { cached = JSON.parse(cachedRaw); } catch { /* ignore invalid cache */ }
  if (!force && cached?.valid && Date.now() - cached.checkedAt < day) {
    if (cached.token === token) {
      showUnlocked("License active · checked recently.");
      return;
    }
  }
  if (!navigator.onLine) {
    if (cached?.valid) showUnlocked("License active from the last check · currently offline.");
    else byId("license-status").textContent = "Offline. Your license will be checked when you reconnect.";
    return;
  }
  byId("license-status").textContent = "Checking license…";
  try {
    const response = await fetch(`${apiBase}/products/${slug}/verify?license=${encodeURIComponent(token)}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("service unavailable");
    const verdict = await response.json();
    save(verdictKey, JSON.stringify({ token, valid: Boolean(verdict.valid), checkedAt: Date.now() }));
    if (verdict.valid) showUnlocked();
    else showLocked("This license is no longer active.");
  } catch {
    if (cached?.valid) showUnlocked("License active from the last check; verification is temporarily unavailable.");
    else {
      byId("license-status").classList.add("error");
      byId("license-status").textContent = "The license service could not be reached. Check your connection and try again.";
    }
  }
}

const returnedLicense = new URLSearchParams(location.search).get("license");
if (returnedLicense) {
  save(licenseKey, returnedLicense);
  history.replaceState({}, "", `${location.pathname}${location.hash}`);
}
const existingLicense = returnedLicense || stored(licenseKey);
if (existingLicense) {
  const cachedRaw = stored(verdictKey);
  try { const cached = JSON.parse(cachedRaw); if (cached?.valid && cached.token === existingLicense) showUnlocked("License remembered; checking quietly…"); } catch { /* verify below */ }
  verifyLicense(existingLicense);
}

byId("license-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const token = byId("license").value.trim();
  if (!token) return;
  save(licenseKey, token);
  verifyLicense(token, true);
});

byId("download-checklist")?.addEventListener("click", () => {
  const checklist = `CAPTURE CLOCK REPAIR — ARCHIVE CHECKLIST\n\n[ ] Copy originals to a second location\n[ ] Scan with the correct filename timezone\n[ ] Inspect every conflict and low-confidence row\n[ ] Run apply with --dry-run first\n[ ] Keep undo.json beside the archive record\n[ ] Import XMP sidecars into a test catalog before the main catalog\n`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([checklist], { type: "text/plain" }));
  link.download = "capture-clock-repair-checklist.txt";
  link.click();
  URL.revokeObjectURL(link.href);
});

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
