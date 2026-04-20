import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../lib/api.ts";

interface DauRow {
  day: string;
  dau: number;
}

export const OverviewPage: React.FC = () => {
  const dau = useQuery({
    queryKey: ["dau"],
    queryFn: () => api<{ data: DauRow[] }>("/admin/metrics/dau").catch(() => ({ data: [] })),
  });
  const families = useQuery({
    queryKey: ["families-count"],
    queryFn: () => api<{ count: number }>("/admin/families?limit=1"),
  });
  const subs = useQuery({
    queryKey: ["subs-count"],
    queryFn: () => api<{ count: number }>("/admin/subscriptions?status=active"),
  });
  const costs = useQuery({
    queryKey: ["costs-30d"],
    queryFn: () =>
      api<{ data: Array<{ service: string; provider: string; sum: number }> }>("/admin/costs"),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Families" value={families.data?.count ?? "—"} />
        <Stat label="Active subs" value={subs.data?.count ?? "—"} />
        <Stat
          label="DAU (last)"
          value={dau.data?.data?.at(-1)?.dau ?? "—"}
        />
        <Stat
          label="30d ai-spend"
          value={
            costs.data
              ? `$${costs.data.data.reduce((s, r) => s + Number(r.sum ?? 0), 0).toFixed(2)}`
              : "—"
          }
        />
      </div>
      <div className="card">
        <h2 className="font-semibold mb-4">DAU (30 days)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dau.data?.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="dau" stroke="#7C3AED" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="card">
    <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
    <div className="text-3xl font-display font-extrabold mt-2">{value}</div>
  </div>
);
