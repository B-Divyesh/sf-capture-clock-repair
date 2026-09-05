import { analyzeSample, specimenMarkup } from "./demo.mjs";

const byId = (id) => document.getElementById(id);

function setOffline() {
  const notice = byId("offline-notice");
  if (notice) notice.hidden = navigator.onLine;
}

function renderSample() {
  const output = byId("demo-result");
  if (!output) return;
  const result = analyzeSample(byId("sample")?.value, byId("timezone")?.value);
  output.innerHTML = specimenMarkup(result);
  output.classList.remove("is-filled");
  requestAnimationFrame(() => output.classList.add("is-filled"));
}

setOffline();
window.addEventListener("online", setOffline);
window.addEventListener("offline", setOffline);

byId("demo-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  renderSample();
});

byId("reset-demo")?.addEventListener("click", () => {
  byId("sample").value = "whatsapp";
  byId("timezone").value = "-04:00";
  renderSample();
  byId("sample").focus();
});

if (byId("demo-result")) renderSample();

document.querySelectorAll("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    button.textContent = "Install commands copied";
  } catch {
    button.textContent = "Select the commands below";
  }
  window.setTimeout(() => { button.textContent = "Copy install commands"; }, 1800);
}));

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
