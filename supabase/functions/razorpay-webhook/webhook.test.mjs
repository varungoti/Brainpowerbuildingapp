// Run with Node >=24 (native TypeScript stripping), no packages/network needed:
// node --test supabase/functions/razorpay-webhook/webhook.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import net from 'node:net';
import tls from 'node:tls';
import { createAtomicIngest, createRazorpayWebhookHandler } from './webhook.ts';

const blocked = () => { throw new Error('Network prohibited in synthetic tests'); };
globalThis.fetch = blocked;
net.connect = net.createConnection = tls.connect = blocked;
net.Socket.prototype.connect = blocked;
const secret = 'synthetic-webhook-secret-never-a-provider-credential';
const payment = () => ({
  id: 'pay_synthetic1', status: 'captured', captured: true, amount: 50000,
  currency: 'INR', order_id: 'order_synthetic1',
  notes: { plan_id: 'synthetic', plan_name: 'Synthetic ₹ plan' },
});
const capture = (event = 'payment.captured') => ({
  event, account_id: 'acc_synthetic1', created_at: 1700000000,
  payload: {
    payment: { entity: payment() },
    ...(event === 'order.paid' ? { order: { entity: { id: 'order_synthetic1', status: 'paid', currency: 'INR' } } } : {}),
  },
});
const refund = (refundId = 'rfnd_synthetic1', refundAmount = 10000) => ({
  event: 'refund.processed', account_id: 'acc_synthetic1', created_at: 1700000001,
  payload: {
    refund: { entity: { id: refundId, payment_id: 'pay_synthetic1', amount: refundAmount, currency: 'INR', status: 'processed' } },
    payment: { entity: { ...payment(), amount_refunded: 30000, refund_status: 'partial' } },
  },
});
function request(payload, { eventId = 'evt_synthetic1', signature, signingSecret = secret, body, method = 'POST' } = {}) {
  const bytes = body ?? JSON.stringify(payload);
  const headers = {};
  if (eventId !== null) headers['x-razorpay-event-id'] = eventId;
  if (signature !== null) headers['x-razorpay-signature'] = signature ?? createHmac('sha256', signingSecret).update(bytes).digest('hex');
  return new Request('https://synthetic.invalid/razorpay-webhook', { method, headers, ...(method === 'POST' ? { body: bytes } : {}) });
}
const receipt = (event, extra = {}) => ({
  ...event, processing_state: 'committed', outcome: 'processed',
  captured_amount_minor: event.payment_amount_minor ?? 50000,
  refunded_amount_minor: event.refund_id ? event.amount_minor : 0,
  ledger_state: event.refund_id ? 'partially_refunded' : 'captured', ...extra,
});
function harness({ getSecret = () => secret, ingest = async (event) => receipt(event) } = {}) {
  const calls = [];
  const handler = createRazorpayWebhookHandler({ getSecret, ingest: async (event) => { calls.push(event); return ingest(event); } });
  return { calls, handler };
}
async function check(response, status, fields = {}) {
  assert.equal(response.status, status);
  const body = await response.json();
  for (const [key, value] of Object.entries(fields)) assert.deepEqual(body[key], value, key);
  return body;
}

for (const value of [undefined, '', '   ']) test(`missing/blank secret ${JSON.stringify(value)} fails closed`, async () => {
  const h = harness({ getSecret: () => value });
  await check(await h.handler(request(capture(), { signature: null })), 503, { ok: false, status: 'unavailable', reason: 'configuration_unavailable' });
  assert.equal(h.calls.length, 0);
});
for (const signature of [null, '', '00', 'g'.repeat(64), '0'.repeat(64)]) test(`bad HMAC ${signature?.slice(0, 5)} is denied`, async () => {
  const h = harness(); await check(await h.handler(request(capture(), { signature })), 401); assert.equal(h.calls.length, 0);
});
test('valid HMAC uses exact original whitespace and unicode bytes', async () => {
  const h = harness(); const body = JSON.stringify(capture(), null, 2) + '\n';
  await check(await h.handler(request(null, { body })), 200, { status: 'processed' });
  assert.equal(h.calls[0].plan_name, 'Synthetic ₹ plan');
});
test('changing a signed body or secret is denied', async () => {
  const h = harness(); const signature = createHmac('sha256', secret).update(JSON.stringify(capture())).digest('hex');
  await check(await h.handler(request(null, { body: JSON.stringify(capture()) + ' ', signature })), 401);
  await check(await h.handler(request(capture(), { signingSecret: 'different-synthetic-secret' })), 401);
  assert.equal(h.calls.length, 0);
});
for (const body of ['{', '', 'null', '[]', '{}', Buffer.from([0xff])]) test(`authentic malformed body ${String(body)} is not ingested`, async () => {
  const h = harness(); await check(await h.handler(request(null, { body })), 400); assert.equal(h.calls.length, 0);
});
for (const event of ['payment.authorized', 'payment.failed', 'payment.pending', 'refund.created', 'refund.failed', 'refund.speed_changed']) test(`${event} does not count as settled`, async () => {
  const h = harness(); await check(await h.handler(request(capture(event))), 200, { status: 'ignored', reason: 'non_settlement_event' }); assert.equal(h.calls.length, 0);
});
for (const event of ['payment.refunded', 'unrecognized.event']) test(`${event} is reconciliation-required, never silently acknowledged`, async () => {
  const h = harness(); await check(await h.handler(request(capture(event))), 503, { reason: 'reconciliation_required' }); assert.equal(h.calls.length, 0);
});
for (const eventId of [null, '', 'bad event', 'x'.repeat(201)]) test(`missing/invalid event identity ${eventId?.slice(0, 5)} is unavailable`, async () => {
  const h = harness(); await check(await h.handler(request(capture(), { eventId })), 503, { reason: 'reconciliation_required' }); assert.equal(h.calls.length, 0);
});
for (const [name, modify] of [
  ['missing payment', (p) => { delete p.payload.payment; }],
  ['order id substituted for payment id', (p) => { p.payload.payment.entity.id = 'order_synthetic1'; }],
  ['authorized state with capture event', (p) => { p.payload.payment.entity.status = 'authorized'; }],
  ['captured false', (p) => { p.payload.payment.entity.captured = false; }],
  ['zero amount', (p) => { p.payload.payment.entity.amount = 0; }],
  ['negative amount', (p) => { p.payload.payment.entity.amount = -1; }],
  ['fractional amount', (p) => { p.payload.payment.entity.amount = 1.5; }],
  ['string amount', (p) => { p.payload.payment.entity.amount = '50000'; }],
  ['overflow amount', (p) => { p.payload.payment.entity.amount = 1e15; }],
  ['unsupported currency', (p) => { p.payload.payment.entity.currency = 'JPY'; }],
  ['missing account', (p) => { delete p.account_id; }],
  ['missing occurrence time', (p) => { delete p.created_at; }],
]) test(`${name} cannot create revenue`, async () => {
  const h = harness(); const p = capture(); modify(p);
  await check(await h.handler(request(p)), 503, { reason: 'reconciliation_required' }); assert.equal(h.calls.length, 0);
});
test('capture and order.paid both use the payment business identity, not the order', async () => {
  const h = harness();
  await check(await h.handler(request(capture())), 200);
  await check(await h.handler(request(capture('order.paid'), { eventId: 'evt_order' })), 200);
  assert.equal(h.calls[0].payment_id, h.calls[1].payment_id);
  assert.equal(h.calls[1].amount_minor, 50000);
  const invalid = capture('order.paid'); invalid.payload.order.entity.id = 'order_other';
  await check(await h.handler(request(invalid)), 503); assert.equal(h.calls.length, 2);
});
test('processed partial refund uses refund id and amount, not payment total or cumulative refund', async () => {
  const h = harness(); await check(await h.handler(request(refund())), 200);
  assert.equal(h.calls[0].refund_id, 'rfnd_synthetic1');
  assert.equal(h.calls[0].amount_minor, 10000);
  assert.equal(h.calls[0].payment_amount_minor, 50000);
  assert.ok(!('raw_payload' in h.calls[0]));
});
test('full refund needs a fully refunded terminal projection', async () => {
  const h = harness({ ingest: async (event) => receipt(event, { ledger_state: 'refunded' }) });
  await check(await h.handler(request(refund('rfnd_full', 50000))), 200);
});
for (const [name, modify] of [
  ['missing refund id', (p) => { delete p.payload.refund.entity.id; }],
  ['refund/payment mismatch', (p) => { p.payload.refund.entity.payment_id = 'pay_other'; }],
  ['refund not processed', (p) => { p.payload.refund.entity.status = 'created'; }],
  ['refund currency mismatch', (p) => { p.payload.refund.entity.currency = 'USD'; }],
  ['refund above capture', (p) => { p.payload.refund.entity.amount = 60000; }],
]) test(`${name} cannot affect ledger`, async () => {
  const h = harness(); const p = refund(); modify(p);
  await check(await h.handler(request(p)), 503); assert.equal(h.calls.length, 0);
});
test('refund before missing capture remains unavailable until transaction reports reconciliation complete', async () => {
  const h = harness({ ingest: async () => ({ outcome: 'pending', processing_state: 'pending_capture' }) });
  const p = refund(); delete p.payload.payment;
  await check(await h.handler(request(p)), 503, { reason: 'ledger_unavailable' });
  assert.equal(h.calls[0].payment_amount_minor, null);
});
for (const [field, value] of [
  ['contract_version', 2], ['processing_state', 'pending'], ['outcome', 'accepted'],
  ['provider', 'other'], ['account_id', 'acc_other'], ['event_id', 'evt_other'],
  ['body_sha256', '0'.repeat(64)], ['event_type', 'order.paid'], ['payment_id', 'pay_other'],
  ['order_id', 'order_other'], ['amount_minor', 1],
  ['refund_id', 'rfnd_other'], ['currency', 'USD'], ['captured_amount_minor', 1],
  ['refunded_amount_minor', -1], ['refunded_amount_minor', 50001], ['ledger_state', 'Paid'],
]) test(`mismatched receipt ${field}=${value} is never acknowledged`, async () => {
  const h = harness({ ingest: async (event) => receipt(event, { [field]: value }) });
  await check(await h.handler(request(capture())), 503, { reason: 'ledger_unavailable' });
});
for (const payload of [capture(), refund()]) for (const field of ['order_id', 'amount_minor']) test(`${payload.event} receipt missing ${field} is unavailable`, async () => {
  const h = harness({ ingest: async (event) => {
    const result = receipt(event); delete result[field]; return result;
  } });
  await check(await h.handler(request(payload)), 503, { reason: 'ledger_unavailable' });
});
test('refund receipt cannot replace the individual applied amount with a larger cumulative total', async () => {
  const h = harness({ ingest: async (event) => receipt(event, {
    amount_minor: 20000, refunded_amount_minor: 20000,
  }) });
  await check(await h.handler(request(refund('rfnd_synthetic1', 10000))), 503, { reason: 'ledger_unavailable' });
});
test('refund-only null order binding must be echoed explicitly, not invented or omitted', async () => {
  const payload = refund(); delete payload.payload.payment;
  for (const orderId of ['order_invented', undefined]) {
    const h = harness({ ingest: async (event) => receipt(event, { order_id: orderId }) });
    await check(await h.handler(request(payload)), 503, { reason: 'ledger_unavailable' });
  }
});
for (const value of [null, true, {}, [], { ok: true }]) test(`nonreceipt ${JSON.stringify(value)} fails closed`, async () => {
  const h = harness({ ingest: async () => value });
  await check(await h.handler(request(capture())), 503, { reason: 'ledger_unavailable' });
});
test('database failure and missing RPC return sanitized503, no fallback INSERT', async () => {
  let count = 0;
  const h = harness({ ingest: createAtomicIngest(async (name, args) => {
    count++; assert.equal(name, 'ingest_razorpay_payment_event_v1'); assert.equal(args.p_event.payment_id, 'pay_synthetic1');
    return { data: null, error: { code: 'PGRST202', message: 'synthetic sensitive detail' } };
  }) });
  const response = await check(await h.handler(request(capture())), 503, { reason: 'ledger_unavailable' });
  assert.equal(count, 1); assert.ok(!JSON.stringify(response).includes('sensitive'));
});
test('RPC throwing after an uncertain commit is unavailable, allowing idempotent retry', async () => {
  const h = harness({ ingest: createAtomicIngest(async () => { throw new Error('synthetic connection failure'); }) });
  await check(await h.handler(request(capture())), 503, { status: 'unavailable' });
});
test('only a matching committed duplicate receipt acknowledges a replay', async () => {
  const h = harness({ ingest: async (event) => receipt(event, { outcome: 'duplicate' }) });
  await check(await h.handler(request(capture())), 200, { status: 'duplicate', event_id: 'evt_synthetic1' });
});
test('OPTIONS and nonPOST do not instantiate persistence', async () => {
  const h = harness(); assert.equal((await h.handler(request(null, { method: 'OPTIONS' }))).status, 200);
  await check(await h.handler(request(null, { method: 'GET' })), 405); assert.equal(h.calls.length, 0);
});

// This executable contract MODEL tests the handler/adapter protocol and needed
// invariants. It is NOT a database, migration, locking, RLS, or durability test.
function contractModel() {
  const captures = new Map(); const refunds = new Map(); const receipts = new Map();
  return {
    captures, refunds,
    async ingest(event) {
      const receiptKey = `${event.account_id}/${event.event_id}`;
      const old = receipts.get(receiptKey);
      if (old && old !== event.body_sha256) throw new Error('event identity conflict');
      receipts.set(receiptKey, event.body_sha256);
      const paymentKey = `${event.account_id}/${event.payment_id}`;
      let duplicate = false;
      if (event.refund_id) {
        const refundKey = `${event.account_id}/${event.refund_id}`;
        const prior = refunds.get(refundKey);
        if (prior && (prior.amount_minor !== event.amount_minor || prior.payment_id !== event.payment_id)) throw new Error('refund identity conflict');
        duplicate = Boolean(prior); refunds.set(refundKey, event);
      } else {
        const prior = captures.get(paymentKey);
        if (prior && prior.amount_minor !== event.amount_minor) throw new Error('capture identity conflict');
        duplicate = Boolean(prior); captures.set(paymentKey, event);
      }
      const captureEvent = captures.get(paymentKey);
      if (!captureEvent) return { processing_state: 'pending_capture' };
      const refunded = [...refunds.values()].filter((r) => r.account_id === event.account_id && r.payment_id === event.payment_id).reduce((sum, r) => sum + r.amount_minor, 0);
      return receipt(event, {
        outcome: duplicate ? 'duplicate' : 'processed', captured_amount_minor: captureEvent.amount_minor,
        refunded_amount_minor: refunded,
        ledger_state: refunded === 0 ? 'captured' : refunded === captureEvent.amount_minor ? 'refunded' : 'partially_refunded',
      });
    },
  };
}
test('contract model: capture aliases, changed unsigned event header and concurrent replays credit once', async () => {
  const model = contractModel(); const h = harness({ ingest: model.ingest });
  const requests = [request(capture()), request(capture('order.paid'), { eventId: 'evt_alias' }),
    request(capture(), { eventId: 'evt_changed_header' }), ...Array.from({ length: 4 }, () => request(capture()))];
  const responses = await Promise.all(requests.map(h.handler));
  for (const r of responses) await check(r, 200);
  assert.equal(model.captures.size, 1);
});
test('contract model: partial refunds accumulate once despite out-of-order capture and late aliases', async () => {
  const model = contractModel(); const h = harness({ ingest: model.ingest });
  await check(await h.handler(request(refund('rfnd_first', 10000), { eventId: 'evt_refund1' })), 503);
  await check(await h.handler(request(capture())), 200);
  await check(await h.handler(request(refund('rfnd_second', 15000), { eventId: 'evt_refund2' })), 200);
  await check(await h.handler(request(refund('rfnd_first', 10000), { eventId: 'evt_refund1' })), 200, { status: 'duplicate' });
  await check(await h.handler(request(capture('order.paid'), { eventId: 'evt_late_alias' })), 200);
  assert.equal(model.captures.size, 1); assert.equal(model.refunds.size, 2);
  assert.equal([...model.refunds.values()].reduce((sum, r) => sum + r.amount_minor, 0), 25000);
});
test('contract model: event-id reuse with changed signed content must not return duplicate success', async () => {
  const model = contractModel(); const h = harness({ ingest: model.ingest });
  await check(await h.handler(request(capture())), 200);
  const p = capture(); p.payload.payment.entity.amount = 40000;
  await check(await h.handler(request(p)), 503, { reason: 'ledger_unavailable' });
});
