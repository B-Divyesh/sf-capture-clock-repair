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
  assert.equal(result.action, "review → amend after confirmation");
  assert.equal(result.proposed, "2026-03-29T11:15:04+01:00");
  assert.match(specimenMarkup(result), /Protected conflict/);
});

test("unknown samples use the empty state", () => {
  assert.equal(analyzeSample("", "+00:00"), null);
});
