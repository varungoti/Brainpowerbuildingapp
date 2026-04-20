import { useEffect, useState } from "react";

/**
 * React wrapper for the public Open AI-Age verifier badge.
 *
 * For the web-component version (embeddable on any partner site), use the
 * `<neurospark-verified>` custom element from `marketing-site/public/badge.js`.
 *
 * This React component hits the same `/standard/verify/:product` endpoint
 * and renders an inline pill that links to the public report.
 */

type VerifyData = {
  product: string;
  status: "audited" | "self-attested";
  reportCount: number;
  average: Record<string, number> | null;
  specVersion: string;
};

interface Props {
  product: string;
  /** Override base URL (defaults to env or production). */
  apiBase?: string;
  className?: string;
}

export function NeuroSparkVerified({ product, apiBase, className }: Props) {
  const [state, setState] = useState<{ status: "loading" | "ok" | "error"; data?: VerifyData }>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const base = apiBase
      ?? import.meta.env.VITE_STANDARD_API_BASE
      ?? "https://standard.neurospark.app";
    fetch(`${String(base).replace(/\/$/, "")}/standard/verify/${encodeURIComponent(product)}`, {
      headers: { accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: VerifyData) => { if (!cancelled) setState({ status: "ok", data }); })
      .catch(() => { if (!cancelled) setState({ status: "error" }); });
    return () => { cancelled = true; };
  }, [product, apiBase]);

  const color = state.status === "ok" && state.data?.status === "audited" ? "#16A34A" : "#D97706";
  const label = state.status === "loading"
    ? "Verifying…"
    : state.status === "error"
      ? "Unverified"
      : state.data?.status === "audited" ? "Audited" : "Self-attested";
  const count = state.status === "ok" && state.data ? `${state.data.reportCount} reports` : "";
  const version = state.status === "ok" && state.data ? `spec v${state.data.specVersion}` : "spec v1.0";

  return (
    <a
      href={`https://standard.neurospark.app/verify/${encodeURIComponent(product)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px",
        border: `1px solid ${color}`, borderRadius: 999, color,
        fontSize: 12, fontWeight: 600, textDecoration: "none", background: "#fff",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} aria-hidden />
      <span>NeuroSpark Verified · {label}</span>
      <span style={{ color: "#6B7280", fontWeight: 500 }}>
        {count ? `${count} · ` : ""}{version}
      </span>
    </a>
  );
}
