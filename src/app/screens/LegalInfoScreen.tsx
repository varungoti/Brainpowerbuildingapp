import React, { useState } from "react";

const TABS = [
  { id: "terms" as const, label: "Terms", emoji: "📜" },
  { id: "privacy" as const, label: "Privacy", emoji: "🔒" },
  { id: "refunds" as const, label: "Refunds", emoji: "💳" },
  { id: "ai" as const, label: "AI", emoji: "🤖" },
];

const EFFECTIVE_DATE = "1 April 2026";
const SUPPORT_EMAIL = "support@neurospark.app";

/**
 * Non-binding draft copy for in-app transparency. Replace with counsel-reviewed text before public marketing.
 */
export function LegalInfoScreen() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("terms");

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#F0EFFF" }}>
      <div className="px-4 pt-2 pb-3">
        <p className="text-amber-800 text-xs font-semibold text-center py-2 px-3 rounded-xl mb-3"
          style={{ background: "rgba(251,191,36,0.2)", border: "1px solid rgba(245,158,11,0.35)" }}>
          Draft summary for families — not a substitute for legal advice. Review with counsel before launch campaigns.
        </p>
        <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-white border border-gray-200">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="flex-1 min-w-[4.5rem] py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: tab === t.id ? "linear-gradient(135deg,#4361EE,#7209B7)" : "transparent",
                color: tab === t.id ? "white" : "#6b7280",
                boxShadow: tab === t.id ? "0 4px 12px rgba(67,97,238,0.25)" : "none",
              }}
            >
              <span className="mr-1">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-8 space-y-4 text-gray-700 text-sm leading-relaxed">
        <p className="text-gray-400 text-xs text-center">Effective {EFFECTIVE_DATE}</p>
        {tab === "terms" && (
          <article className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
            <h2 className="font-black text-gray-900 text-base">Terms of use (summary)</h2>
            <ul className="list-disc pl-4 space-y-2 text-xs">
              <li>NeuroSpark provides educational activity ideas and parent guidance — not medical, diagnostic, or therapeutic services.</li>
              <li>Parents remain responsible for supervision, safety, and age-appropriate adaptation of every activity.</li>
              <li>Digital goods (e.g. credits) follow the refund policy you publish at payment time; keep this in sync with your payment provider.</li>
              <li>Content may change as the product evolves; continued use after updates means acceptance of the current terms.</li>
            </ul>
          </article>
        )}

        {tab === "privacy" && (
          <article className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
            <h2 className="font-black text-gray-900 text-base">Privacy (summary)</h2>
            <ul className="list-disc pl-4 space-y-2 text-xs">
              <li>Today, child profiles and activity logs are stored <strong>locally on your device</strong> unless you enable optional cloud features.</li>
              <li>Optional Supabase sign-in stores account identity with Supabase under their policies; still align your DPIA / COPPA stance before collecting children&apos;s data at scale.</li>
              <li>Do not ask children for personal data in-app; parent is the account holder.</li>
              <li>Optional analytics: the app can POST coarse events (no child names or emails) to a URL you configure — see <strong>docs/PRODUCT_ANALYTICS.md</strong>.</li>
            </ul>
          </article>
        )}

        {tab === "refunds" && (
          <article className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
            <h2 className="font-black text-gray-900 text-base">Payments &amp; refunds (summary)</h2>
            <ul className="list-disc pl-4 space-y-2 text-xs">
              <li>
                Credits and subscriptions are processed by our payment partner (e.g. <strong>Razorpay</strong>). Charges, receipts, and dispute flows may appear under their branding.
              </li>
              <li>
                <strong>Digital access:</strong> align your published refund and cancellation rules with Indian consumer norms, your Razorpay settings, and counsel advice — then replace this summary before marketing.
              </li>
              <li>Keep the in-app paywall copy consistent with the final Terms and refund policy.</li>
              <li>For failed or duplicate charges, parents should contact support with the transaction reference from their receipt.</li>
            </ul>
          </article>
        )}

        {tab === "ai" && (
          <article className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
            <h2 className="font-black text-gray-900 text-base">AI counselor &amp; tools</h2>
            <ul className="list-disc pl-4 space-y-2 text-xs">
              <li>The AI Counselor produces general research-style guidance. It is <strong>not</strong> a clinician, therapist, or dietitian.</li>
              <li>Always consult qualified professionals for health, mental health, or nutrition decisions.</li>
              <li>Citations may be incomplete or outdated; verify critical claims independently.</li>
              <li>Activity Generator &quot;AI literacy&quot; tracks are <strong>unplugged</strong> habits (verification, clear instructions) — they do not train children on specific products.</li>
            </ul>
          </article>
        )}

        {/* Contact footer */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center space-y-1">
          <p className="text-gray-500 text-xs">Questions about these policies?</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=NeuroSpark%20Legal%20Query`}
            className="text-blue-600 font-semibold text-sm underline underline-offset-2"
          >
            {SUPPORT_EMAIL}
          </a>
          <p className="text-gray-400 text-xs mt-1">
            This is a draft summary. Replace with counsel-reviewed text before public launch.
          </p>
        </div>
      </div>
    </div>
  );
}
