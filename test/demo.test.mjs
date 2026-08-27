import test from "node:test";
import assert from "node:assert/strict";
import { analyzeSample, specimenMarkup } from "../site/demo.mjs";

test("filename evidence preserves the chosen offset", () => {
  const result = analyzeSample("whatsapp", "+05:30");
  assert.equal(result.proposed, "2025-04-18T19:42:11+05:30");
  assert.equal(result.action, "accept");
});

test("trusted timezone conflict remains protected", () => {
  const result = analyzeSample("nikon", "+00:00");
  assert.equal(result.action, "keep");
  assert.equal(result.proposed, "No patch proposed");
  assert.match(specimenMarkup(result), /Protected conflict/);
});

test("unknown samples use the empty state", () => {
  assert.equal(analyzeSample("", "+00:00"), null);
});
