// node script/test-plans.mjs
// Pins the plan prices and the payments.referenceId round-trip.
// It reads the helpers out of api/index.ts instead of importing them: that module opens a pg
// Pool and starts a setInterval at import time, so importing it here would hang the check.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const src = readFileSync(new URL('../api/index.ts', import.meta.url), 'utf8');
const block = src
  .match(/const PLANS = \[[\s\S]*?planFromReference = [\s\S]*?;\r?\n/)[0]
  .replace(/\(([a-z]+)\?: string \| null\)/g, '($1)'); // strip the TS annotations

const { PLANS, planById, planFromReference } = new Function(
  block + ' return { PLANS, planById, planFromReference };'
)();

// The prices H.H confirmed — the site charged a third of these until 2026-07-23.
assert.deepEqual(PLANS.map(p => p.price), [299000, 599000, 1299000]);
assert.deepEqual(PLANS.map(p => p.durationDays), [30, 90, 365]);

assert.equal(planById('gold').price, 1299000);
assert.equal(planById('nope'), undefined);

assert.equal(planFromReference('PLAN-bronze').id, 'bronze');           // manual card/crypto submit
assert.equal(planFromReference('PLAN-gold-1753000000').id, 'gold');    // ZarinPal seed
assert.equal(planFromReference('A0000000000000000000000000000000'), undefined); // ZarinPal authority
assert.equal(planFromReference(null), undefined);

console.log('OK — plan pricing + PLAN- reference round-trip');
