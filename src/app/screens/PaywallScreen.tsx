import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { ACTIVITIES, getAgeTierConfig } from "../data/activities";
import { projectId, publicAnonKey } from "@/utils/supabase/info";
import { captureProductEvent } from "@/utils/productAnalytics";
import { useOnlineStatus } from "@/utils/networkStatus";

const PLANS = [
  { id:"day1",   days:1,   price:100,   pricePerDay:100, label:"1 Day",   badge:null,           color:"#64748b" },
  { id:"day7",   days:7,   price:600,   pricePerDay:86,  label:"7 Days",  badge:"Save ₹100",    color:"#4361EE" },
  { id:"day30",  days:30,  price:2000,  pricePerDay:67,  label:"30 Days", badge:"Most Popular",  color:"#7209B7" },
  { id:"day365", days:365, price:18000, pricePerDay:49,  label:"1 Year",  badge:"Best Value",    color:"#F72585" },
];

const VALUE_PROPS = [
  { emoji:"🧠", title:"Research-Backed",  desc:"7 global traditions, 13 intelligences, 300+ expert activities" },
  { emoji:"🏠", title:"Zero Extra Cost",  desc:"100% household materials — no kits or classes" },
  { emoji:"📈", title:"Proven Results",   desc:"Kids score 18+ months ahead after 300 activities" },
  { emoji:"🤖", title:"AI-Personalised", desc:"AGE Algorithm tailors every pack to your child" },
];

// ─── Razorpay loader ──────────────────────────────────────────────────────────
function loadRazorpaySDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.head.appendChild(s);
  });
}

type PayStep = "plan" | "success";

export function PaywallScreen() {
  const { activeChild, navigate, addCredits, activityLogs } = useApp();
  const isOnline = useOnlineStatus();
  const [selected, setSelected]   = useState("day30");
  const [step, setStep]           = useState<PayStep>("plan");
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError]   = useState<string | null>(null);

  const tier    = activeChild?.ageTier ?? 3;
  const tierCfg = getAgeTierConfig(tier);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const hadYesterday = activityLogs.some(
    l => l.childId === activeChild?.id && new Date(l.date).toDateString() === yesterday.toDateString()
  );
  const missedActivities = ACTIVITIES.filter(a => a.ageTiers.includes(tier > 0 ? tier : 1)).slice(0, 3);

  const plan = PLANS.find(p => p.id === selected)!;

  useEffect(() => {
    if (step !== "plan") return;
    captureProductEvent("paywall_view", { age_tier: tier });
  }, [step, tier]);

  // ─── Real Razorpay payment ─────────────────────────────────────────────────
  const handleRazorpay = async () => {
    if (!isOnline) {
      setPayError("You're offline. Checkout and payment verification need an internet connection.");
      return;
    }
    setProcessing(true);
    setPayError(null);
    captureProductEvent("paywall_checkout_start", {
      age_tier: tier,
      plan_id: plan.id,
      days: plan.days,
      amount_inr: plan.price,
    });
    try {
      // 1. Load Razorpay SDK
      await loadRazorpaySDK();

      // 2. Create order on server
      const orderRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-76b0ba9a/razorpay/create-order`,
        {
          method: "POST",
          headers: { "Authorization": `Bearer ${publicAnonKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ amount: plan.price }),
        }
      );
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error ?? "Order creation failed");

      // 3. Open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key:         orderData.keyId,
          amount:      orderData.amount,
          currency:    orderData.currency,
          name:        "NeuroSpark",
          description: `${plan.label} Brain Activity Pack for ${activeChild?.name ?? "Child"}`,
          order_id:    orderData.orderId,
          prefill:     { name: "Parent" },
          theme:       { color: plan.color },
          modal:       { ondismiss: () => {
            captureProductEvent("paywall_checkout_dismiss", { plan_id: plan.id, age_tier: tier });
            reject(new Error("Payment cancelled"));
          } },
          handler: async (response: any) => {
            try {
              // 4. Verify signature on server
              const verRes = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-76b0ba9a/razorpay/verify-payment`,
                {
                  method: "POST",
                  headers: { "Authorization": `Bearer ${publicAnonKey}`, "Content-Type": "application/json" },
                  body: JSON.stringify(response),
                }
              );
              const verData = await verRes.json();
              if (!verData.success) throw new Error(verData.error ?? "Payment verification failed");
              captureProductEvent("paywall_purchase_success", {
                age_tier: tier,
                plan_id: plan.id,
                days: plan.days,
                amount_inr: plan.price,
              });
              addCredits(plan.days);
              setStep("success");
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        });
        rzp.open();
      });

    } catch (err: unknown) {
      const msg = String(err instanceof Error ? err.message : err);
      if (!msg.includes("cancelled")) {
        console.error("Razorpay payment error:", err);
        setPayError(msg);
        captureProductEvent("paywall_purchase_fail", {
          age_tier: tier,
          plan_id: plan.id,
          fail_reason: msg.slice(0, 80),
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  // ─── Success screen ────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center gap-6"
        style={{ background: "linear-gradient(135deg,#1a1a2e,#302b63)" }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
          style={{ background: "rgba(6,214,160,0.15)", border: "3px solid #06D6A0" }}>
          ✅
        </div>
        <div>
          <div className="text-white font-black text-2xl mb-2">Payment Successful!</div>
          <div className="text-white/70 text-sm">
            {plan.days} day{plan.days > 1 ? "s" : ""} unlocked for {activeChild?.name}
          </div>
        </div>
        <div className="rounded-2xl p-4 w-full" style={{ background:"rgba(6,214,160,0.1)", border:"1px solid rgba(6,214,160,0.3)" }}>
          <div className="text-emerald-400 font-bold text-sm mb-3">🧠 What you just unlocked:</div>
          {[
            `${plan.days} personalised brain packs`,
            `${plan.days * 3}–${plan.days * 5} research-backed activities`,
            `Full Brain Map progress tracking`,
            `AI Counselor unlimited access`,
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 mb-1.5">
              <span className="text-emerald-400 text-xs">✓</span>
              <span className="text-white/80 text-xs">{item}</span>
            </div>
          ))}
        </div>
        <button onClick={() => navigate("generate")}
          className="w-full py-4 rounded-2xl font-black text-white text-base"
          style={{ background:"linear-gradient(135deg,#4361EE,#7209B7)", boxShadow:"0 8px 24px rgba(67,97,238,0.4)" }}>
          ⚡ Generate Today's Pack
        </button>
        <button onClick={() => navigate("home")} className="text-white/40 text-xs">Back to Home</button>
      </div>
    );
  }

  // ─── Plan selection screen ─────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto" style={{ background:"#0f0f1a" }}>
      {/* Hero */}
      <div className="relative overflow-hidden px-4 pt-5 pb-6 mb-1"
        style={{ background:"linear-gradient(135deg,#1a0533,#302b63,#0f3460)" }}>
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-20"
          style={{ background:"radial-gradient(circle,#7209B7,transparent)", transform:"translate(30%,-30%)" }}/>
        <button onClick={() => navigate("home")} className="flex items-center gap-1 mb-4">
          <span className="text-white/50 text-xs">‹ Back</span>
        </button>
        <div className="text-4xl mb-2">⚡</div>
        <div className="text-white font-black text-xl mb-1">Unlock Today's Brain Pack</div>
        <div className="text-white/60 text-xs">Personalised for {activeChild?.name} · {tierCfg.label} · AGE Algorithm</div>
      </div>

      <div className="px-4 pb-8 space-y-5">
        {!isOnline && (
          <div className="rounded-2xl p-3" style={{ background:"rgba(251,191,36,0.12)", border:"1px solid rgba(245,158,11,0.3)" }}>
            <div className="text-amber-300 font-semibold text-xs mb-1">Offline mode</div>
            <div className="text-amber-100/90 text-xs">You can still review plan options, but payment starts only after you reconnect.</div>
          </div>
        )}

        {/* Missed yesterday */}
        {!hadYesterday && activeChild && (
          <div className="rounded-2xl overflow-hidden" style={{ border:"1px solid rgba(247,37,133,0.3)" }}>
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ background:"rgba(247,37,133,0.15)" }}>
              <span className="text-base">😢</span>
              <span className="text-white font-bold text-xs">{activeChild.name} missed yesterday's brain session</span>
            </div>
            <div className="px-4 pb-3 pt-1" style={{ background:"rgba(247,37,133,0.05)" }}>
              <div className="text-white/50 text-xs mb-2">These opportunities were missed:</div>
              {missedActivities.map(act => (
                <div key={act.id} className="flex items-center gap-2 mb-1.5 opacity-60">
                  <span className="text-lg blur-sm">{act.emoji}</span>
                  <div className="flex-1">
                    <div className="text-white/50 text-xs font-medium blur-sm">{act.name}</div>
                    <div className="flex gap-1">
                      {act.intelligences.slice(0, 2).map(i => (
                        <span key={i} className="text-white/30 rounded-full px-1.5 py-0.5 blur-sm"
                          style={{ fontSize:9, background:"rgba(255,255,255,0.05)" }}>
                          {i.split("-")[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-white/20 text-xs">🔒</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Value comparison */}
        <div className="rounded-2xl p-4" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="text-white/50 text-xs font-semibold mb-3 uppercase tracking-wider">Why ₹100/day is exceptional value</div>
          <div className="space-y-2">
            {[
              { label:"Traditional tutor",    price:"₹1,500–3,000/mo", cross:true  },
              { label:"Enrichment class",      price:"₹2,000–5,000/mo", cross:true  },
              { label:"NeuroSpark 30 days",   price:"₹67/day (₹2,000)", cross:false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className={`text-xs ${item.cross?"text-white/30 line-through":"text-emerald-400 font-semibold"}`}>{item.label}</span>
                <span className={`text-xs font-bold ${item.cross?"text-white/30":"text-emerald-400"}`}>{item.price} {!item.cross&&"✓"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div>
          <div className="text-white font-bold text-sm mb-3">Choose Your Plan</div>
          <div className="space-y-2.5">
            {PLANS.map(p => (
              <button key={p.id} type="button" onClick={() => {
                setSelected(p.id);
                captureProductEvent("paywall_plan_select", {
                  age_tier: tier,
                  plan_id: p.id,
                  days: p.days,
                  amount_inr: p.price,
                });
              }}
                className="w-full rounded-2xl p-4 text-left transition-all"
                style={{
                  background: selected===p.id ? `${p.color}18` : "rgba(255,255,255,0.03)",
                  border: `2px solid ${selected===p.id ? p.color : "rgba(255,255,255,0.08)"}`,
                  boxShadow: selected===p.id ? `0 0 20px ${p.color}25` : "none",
                }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: selected===p.id ? p.color : "rgba(255,255,255,0.3)" }}>
                      {selected===p.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background:p.color }}/>}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">{p.label}</div>
                      <div className="text-white/40" style={{ fontSize:11 }}>₹{p.pricePerDay}/day</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-black text-lg">₹{p.price.toLocaleString()}</div>
                    {p.badge && (
                      <div className="rounded-full px-2 py-0.5 text-white font-bold text-center mt-0.5"
                        style={{ background:p.color, fontSize:10 }}>{p.badge}</div>
                    )}
                  </div>
                </div>
                {selected===p.id && p.id==="day30" && (
                  <div className="mt-3 pt-3 grid grid-cols-2 gap-2" style={{ borderTop:`1px solid ${p.color}30` }}>
                    {["30 daily packs","90–150 activities","All 13 intelligences","Brain Map tracking"].map(f => (
                      <div key={f} className="flex items-center gap-1">
                        <span style={{ color:p.color, fontSize:10 }}>✓</span>
                        <span className="text-white/60" style={{ fontSize:10 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Value props */}
        <div className="grid grid-cols-2 gap-2">
          {VALUE_PROPS.map(vp => (
            <div key={vp.title} className="rounded-2xl p-3"
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-2xl mb-1">{vp.emoji}</div>
              <div className="text-white font-bold text-xs mb-0.5">{vp.title}</div>
              <div className="text-white/40" style={{ fontSize:10 }}>{vp.desc}</div>
            </div>
          ))}
        </div>

        {/* Error message */}
        {payError && (
          <div className="rounded-xl p-3" style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)" }}>
            <div className="text-red-400 text-xs font-semibold mb-0.5">Payment failed</div>
            <div className="text-red-300/70 text-xs">{payError}</div>
          </div>
        )}

        {/* Razorpay CTA */}
        <button onClick={handleRazorpay} disabled={processing || !isOnline}
          className="w-full py-4 rounded-2xl font-black text-white text-base relative overflow-hidden"
          style={{ background: (processing || !isOnline) ? "rgba(67,97,238,0.4)" : `linear-gradient(135deg,${plan.color},#4361EE)`, boxShadow: (processing || !isOnline) ? "none" : "0 8px 24px rgba(67,97,238,0.4)" }}>
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              Connecting to Razorpay...
            </span>
          ) : (
            `Pay ₹${plan.price.toLocaleString()} via Razorpay →`
          )}
        </button>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-3 pb-2">
          <div className="flex items-center gap-1">
            <span className="text-white/25 text-xs">🔒</span>
            <span className="text-white/25 text-xs">256-bit SSL</span>
          </div>
          <div className="w-px h-3 bg-white/10"/>
          <div className="flex items-center gap-1">
            <span className="text-white/25 text-xs">🏦</span>
            <span className="text-white/25 text-xs">Razorpay secured</span>
          </div>
          <div className="w-px h-3 bg-white/10"/>
          <div className="flex items-center gap-1">
            <span className="text-white/25 text-xs">↩️</span>
            <span className="text-white/25 text-xs">No auto-renewal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
