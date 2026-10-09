import { handleOptions, json } from "../_shared/cors.ts";

type RecordValue = Record<string, unknown>;
export type PaymentEvent = {
  contract_version: 1;
  provider: "razorpay";
  account_id: string;
  event_id: string;
  body_sha256: string;
  event_type: "payment.captured" | "order.paid" | "refund.processed";
  occurred_at: number;
  payment_id: string;
  order_id: string | null;
  refund_id: string | null;
  amount_minor: number;
  payment_amount_minor: number | null;
  currency: "INR";
  plan_id: string | null;
  plan_name: string | null;
};

type Dependencies = {
  getSecret: () => string | undefined;
  // Resolves only after the single database transaction commits. The handler
  // validates the receipt; a truthy object is not sufficient acknowledgement.
  ingest: (event: PaymentEvent) => Promise<unknown>;
};

type Rpc = (name: string, args: { p_event: PaymentEvent }) => PromiseLike<{
  data: unknown;
  error: unknown;
}>;

export function createAtomicIngest(rpc: Rpc): Dependencies["ingest"] {
  return async (event) => {
    const { data, error } = await rpc("ingest_razorpay_payment_event_v1", { p_event: event });
    if (error) throw new Error("Atomic ledger unavailable");
    return data;
  };
}

const object = (value: unknown): RecordValue | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as RecordValue
    : null;
const id = (value: unknown, prefix: string): value is string =>
  typeof value === "string" && new RegExp(`^${prefix}_[a-zA-Z0-9]+$`).test(value) && value.length <= 128;
// INR is the currently documented account currency. Other currencies require
// an explicit currency/exponent/rollup contract, not an implicit /100 fallback.
const amount = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= 999_999_999_999;
const note = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 && value.length <= 256 ? value : null;
const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");

async function verified(body: ArrayBuffer, signature: string, secret: string) {
  if (!/^[a-fA-F0-9]{64}$/.test(signature)) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"],
  );
  const bytes = Uint8Array.from(signature.match(/../g)!, (pair) => parseInt(pair, 16));
  // Delegate constant-time MAC verification to WebCrypto. Do not compare hex
  // strings, reserialize JSON, or decode the body before authenticating it.
  return crypto.subtle.verify("HMAC", key, bytes, body);
}

function normalize(payload: RecordValue, eventId: string, digest: string): PaymentEvent | null {
  const eventType = payload.event;
  if (eventType !== "payment.captured" && eventType !== "order.paid" && eventType !== "refund.processed") return null;
  if (!id(payload.account_id, "acc") || !Number.isSafeInteger(payload.created_at) || (payload.created_at as number) <= 0) return null;
  const entities = object(payload.payload);
  const payment = object(object(entities?.payment)?.entity);
  const order = object(object(entities?.order)?.entity);
  const refund = object(object(entities?.refund)?.entity);
  const notes = object(payment?.notes);
  const base = {
    contract_version: 1 as const, provider: "razorpay" as const,
    account_id: payload.account_id, event_id: eventId, body_sha256: digest,
    event_type: eventType, occurred_at: payload.created_at as number,
    currency: "INR" as const, plan_id: note(notes?.plan_id), plan_name: note(notes?.plan_name),
  };

  if (eventType === "refund.processed") {
    if (!refund || !id(refund.id, "rfnd") || !id(refund.payment_id, "pay") ||
      refund.status !== "processed" || refund.currency !== "INR" || !amount(refund.amount)) return null;
    // A refund-only payload can be durably reconciled by the contract. If a
    // payment is supplied, it must agree; never substitute payment.amount for
    // the individual refund amount or add cumulative amount_refunded twice.
    if (entities?.payment !== undefined && (!payment || payment.id !== refund.payment_id ||
      payment.currency !== refund.currency || !amount(payment.amount) || refund.amount > payment.amount)) return null;
    if (payment?.order_id != null && !id(payment.order_id, "order")) return null;
    return {
      ...base, event_type: eventType, payment_id: refund.payment_id,
      order_id: id(payment?.order_id, "order") ? payment.order_id : null,
      refund_id: refund.id, amount_minor: refund.amount,
      payment_amount_minor: amount(payment?.amount) ? payment.amount : null,
    };
  }

  if (!payment || !id(payment.id, "pay") || payment.status !== "captured" ||
    payment.captured !== true || !amount(payment.amount) || payment.currency !== "INR") return null;
  if (payment.order_id != null && !id(payment.order_id, "order")) return null;
  if (eventType === "order.paid" && (!order || order.status !== "paid" ||
    !id(order.id, "order") || payment.order_id !== order.id || order.currency !== payment.currency)) return null;
  return {
    ...base, event_type: eventType, payment_id: payment.id,
    order_id: id(payment.order_id, "order") ? payment.order_id : null,
    refund_id: null, amount_minor: payment.amount, payment_amount_minor: payment.amount,
  };
}

function terminalReceipt(value: unknown, event: PaymentEvent): value is RecordValue {
  const receipt = object(value);
  if (!receipt || receipt.contract_version !== 1 || receipt.processing_state !== "committed" ||
    (receipt.outcome !== "processed" && receipt.outcome !== "duplicate")) return false;
  for (const field of ["provider", "account_id", "event_id", "body_sha256", "event_type", "payment_id", "order_id", "refund_id", "amount_minor", "currency"] as const) {
    if (receipt[field] !== event[field]) return false;
  }
  const captured = receipt.captured_amount_minor;
  const refunded = receipt.refunded_amount_minor;
  if (!amount(captured) || typeof refunded !== "number" || !Number.isSafeInteger(refunded) || refunded < 0 || refunded > captured) return false;
  if (event.payment_amount_minor !== null && captured !== event.payment_amount_minor) return false;
  if (event.refund_id !== null && refunded < event.amount_minor) return false;
  const expected = refunded === 0 ? "captured" : refunded === captured ? "refunded" : "partially_refunded";
  return receipt.ledger_state === expected;
}

const noSettlement = new Set([
  "payment.authorized", "payment.failed", "payment.pending",
  "refund.created", "refund.failed", "refund.speed_changed",
]);
const unavailable = (reason: "ledger_unavailable" | "reconciliation_required" | "configuration_unavailable") =>
  json({ ok: false, status: "unavailable", reason }, 503);

export function createRazorpayWebhookHandler(deps: Dependencies) {
  return async (req: Request): Promise<Response> => {
    const opt = handleOptions(req);
    if (opt) return opt;
    if (req.method !== "POST") return json({ error: "Use POST" }, 405);
    try {
      const secret = deps.getSecret();
      if (!secret || !secret.trim()) return unavailable("configuration_unavailable");
      const body = await req.arrayBuffer();
      if (!await verified(body, req.headers.get("x-razorpay-signature") ?? "", secret)) {
        return json({ error: "Invalid Razorpay signature" }, 401);
      }
      let payload: RecordValue | null;
      try {
        payload = object(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body)));
      } catch {
        return json({ error: "Invalid webhook payload" }, 400);
      }
      if (!payload || typeof payload.event !== "string") return json({ error: "Invalid webhook payload" }, 400);
      if (noSettlement.has(payload.event)) {
        return json({ ok: true, status: "ignored", reason: "non_settlement_event", event: payload.event });
      }
      const eventId = req.headers.get("x-razorpay-event-id") ?? "";
      if (!/^[a-zA-Z0-9_-]{1,200}$/.test(eventId)) return unavailable("reconciliation_required");
      const digest = hex(await crypto.subtle.digest("SHA-256", body));
      const event = normalize(payload, eventId, digest);
      // Includes unsupported authentic events (e.g. legacy payment.refunded).
      // A 503 asks for retry; it is NOT a durable inbox or unlimited retention.
      if (!event) return unavailable("reconciliation_required");
      const receipt = await deps.ingest(event);
      if (!terminalReceipt(receipt, event)) return unavailable("ledger_unavailable");
      return json({ ok: true, status: receipt.outcome, event_id: event.event_id });
    } catch {
      // Never return raw database errors, payment payloads, or credentials.
      return unavailable("ledger_unavailable");
    }
  };
}
