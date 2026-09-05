import test from "node:test";
import assert from "node:assert/strict";
import { analyzeSample, specimenMarkup } from "../site/demo.mjs";

test("filename evidence preserves the chosen offset", () => {
  const result = analyzeSample("whatsapp", "+05:30");
  assert.equal(result.proposed, "2025-04-18T19:42:11+05:30");
  assert.equal(result.action, "accept");
});

test("timezone conflict requires explicit review", () => {
  const result = analyzeSample("nikon", "+00:00");
  assert.equal(result.action, "review, then amend after confirmation");
  assert.equal(result.proposed, "2026-03-29T11:15:04+01:00");
  assert.match(specimenMarkup(result), /Protected conflict/);
});

test("the browser demo always starts with populated sample data", () => {
  assert.equal(analyzeSample("", "+00:00").file, "WhatsApp Image 2025-04-18 at 19.42.11.jpg");
});
