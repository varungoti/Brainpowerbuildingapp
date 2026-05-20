// Razorpay webhook → crm_payments ledger row.
//
// Public endpoint (verify_jwt = false in config.toml). Authenticates by HMAC
// signature instead of JWT. Razorpay dashboard → Settings → Webhooks → add
// `https://<project>.supabase.co/functions/v1/razorpay-webhook` and store the
// signing secret as `RAZORPAY_WEBHOOK_SECRET`.

import { handleOptions, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";

async function verifyRazorpaySignature(req: Request, bodyText: string) {
  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!secret) return { verified: false, skipped: true as const };
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(bodyText));
  const hex = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { verified: hex === signature, skipped: false as const };
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    if (req.method !== "POST") return json({ error: "Use POST" }, 405);
    const bodyText = await req.text();

    const verification = await verifyRazorpaySignature(req, bodyText);
    if (!verification.skipped && !verification.verified) {
      return json({ error: "Invalid Razorpay signature" }, 401);
    }

    const payload = JSON.parse(bodyText || "{}");
    const event = String(payload?.event ?? "");
    const paymentEntity = payload?.payload?.payment?.entity ?? {};
    const orderEntity = payload?.payload?.order?.entity ?? {};

    // Only ingest authorized / captured / refunded events. Razorpay also fires
    // `order.paid` and `payment.failed`; we only ledger successful payments.
    const isPaymentSuccess = event === "payment.captured" || event === "payment.authorized" || event === "order.paid";
    const isRefund = event === "payment.refunded" || event === "refund.processed";
    if (!isPaymentSuccess && !isRefund) {
      return json({ ok: true, ignored: true, event });
    }

    const amountPaise = Number(paymentEntity.amount ?? orderEntity.amount ?? 0);
    const amount = amountPaise / 100;
    const currency = paymentEntity.currency ?? orderEntity.currency ?? "INR";
    const planId = paymentEntity.notes?.plan_id ?? orderEntity.notes?.plan_id ?? "unknown";
    const planName = paymentEntity.notes?.plan_name ?? orderEntity.notes?.plan_name ?? "Razorpay Payment";
    const status = isRefund ? "Refunded" : "Paid";

    const sb = adminClient();
    const { data, error } = await sb
      .from("crm_payments")
      .insert({
        provider: "razorpay",
        provider_payment_id: paymentEntity.id ?? orderEntity.id ?? `${event}_${crypto.randomUUID()}`,
        plan_id: planId,
        plan_name: planName,
        amount,
        currency,
        status,
        paid_at: new Date().toISOString(),
        raw_payload: payload,
      })
      .select("*")
      .single();
    if (error) throw error;

    return json({ ok: true, verification, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: "Razorpay webhook failed", detail: msg }, 500);
  }
});
