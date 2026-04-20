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
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold">AI/Infra costs (30d)</h1>
        <div className="text-2xl font-display font-bold">${total.toFixed(2)}</div>
      </div>
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
