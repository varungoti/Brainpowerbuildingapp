// Public webhook: JWT is intentionally replaced by raw-body HMAC validation.
// DEPLOYMENT GATE: requires the reviewed, tested atomic v1 database contract.
// There is deliberately no fallback to a non-idempotent crm_payments insert.
import { adminClient } from "../_shared/supabase.ts";
import { createAtomicIngest, createRazorpayWebhookHandler } from "./webhook.ts";

Deno.serve(createRazorpayWebhookHandler({
  getSecret: () => Deno.env.get("RAZORPAY_WEBHOOK_SECRET"),
  ingest: createAtomicIngest((name, args) => adminClient().rpc(name, args)),
}));
