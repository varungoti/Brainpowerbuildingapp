import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../lib/api.ts";

interface Row { service: string; provider: string; sum: string }

export const CostsPage: React.FC = () => {
  const { data } = useQuery({
    queryKey: ["costs"],
    queryFn: () => api<{ data: Row[] }>("/admin/costs"),
  });
  const rows = data?.data ?? [];
  const total = rows.reduce((s, r) => s + Number(r.sum ?? 0), 0);
  const aiRows = rows.filter((r) => r.service.startsWith("ai:"));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold">AI/Infra costs (30d)</h1>
        <div className="text-2xl font-display font-bold">${total.toFixed(2)}</div>
      </div>
      {aiRows.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-3">AI route labels</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {aiRows.map((row) => (
              <div key={`${row.service}:${row.provider}`} className="rounded-xl border border-slate-200 p-3">
                <div className="text-sm font-semibold">{row.service.replace("ai:", "")}</div>
                <div className="text-xs text-slate-500">{row.provider}</div>
                <div className="mt-1 font-bold">${Number(row.sum ?? 0).toFixed(4)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="card">
        <h2 className="font-semibold mb-3">By provider</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows.map((r) => ({ ...r, sum: Number(r.sum) }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="provider" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sum" fill="#7C3AED" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
