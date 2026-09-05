export const samples = {
  whatsapp: {
    file: "WhatsApp Image 2025-04-18 at 19.42.11.jpg",
    source: "WhatsApp",
    original: "Missing",
    baseTime: "2025-04-18T19:42:11",
    inference: "Filename",
    status: "Proposed, high confidence",
    badge: "Ready to review",
    warning: false,
    action: "accept"
  },
  nikon: {
    file: "2026-03-29_11.15.04_DSC_1842.JPG",
    source: "Nikon D750",
    original: "2026-03-29T10:15:04+01:00",
    proposed: "2026-03-29T11:15:04+01:00",
    inference: "Embedded EXIF compared with filename",
    status: "Possible one-hour timezone shift",
    badge: "Protected conflict",
    warning: true,
    action: "review, then amend after confirmation"
  },
  unknown: {
    file: "summer-evening.jpg",
    source: "Imported folder",
    original: "Missing",
    proposed: "2025-08-11T16:08:22Z",
    inference: "Filesystem modified time",
    status: "Needs a decision, low confidence",
    badge: "Review required",
    warning: true,
    action: "review"
  }
};

export function analyzeSample(key, timezone = "+00:00") {
  const sample = samples[key] || samples.whatsapp;
  return { ...sample, proposed: sample.baseTime ? `${sample.baseTime}${timezone}` : sample.proposed };
}

export function specimenMarkup(result) {
  const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  return `<div class="result-top"><div><p class="eyebrow">Filled review row</p><p><b>${esc(result.file)}</b></p></div><span class="badge${result.warning ? " warning" : ""}">${esc(result.badge)}</span></div><dl class="result-grid"><dt>Source group</dt><dd>${esc(result.source)}</dd><dt>Original time</dt><dd>${esc(result.original)}</dd><dt>Proposed time</dt><dd>${esc(result.proposed)}</dd><dt>Evidence</dt><dd>${esc(result.inference)}</dd><dt>Status</dt><dd>${esc(result.status)}</dd><dt>CSV action</dt><dd>${esc(result.action)}</dd></dl>`;
}
