import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { DataTable, downloadCsv } from "../components/DataTable.tsx";

interface Profile extends Record<string, unknown> {
  user_id: string;
  email: string;
  display_name?: string;
  created_at: string;
}

export const FamiliesPage: React.FC = () => {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["families", q],
    queryFn: () => api<{ data: Profile[]; count: number }>(`/admin/families?limit=100${q ? `&q=${encodeURIComponent(q)}` : ""}`),
  });
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl font-extrabold">Families</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search by email…"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-72"
        />
      </div>
      <DataTable
        rows={data?.data ?? []}
        cols={[
          { key: "email", label: "Email" },
          { key: "display_name", label: "Display name" },
          { key: "created_at", label: "Joined" },
          {
            key: "user_id",
            label: "",
            render: (r) => (
              <a
                className="text-primary hover:underline"
                href={`#families/${(r as Profile).user_id}`}
              >
                Open
              </a>
            ),
          },
        ]}
        onExport={() => downloadCsv(data?.data ?? [], "families.csv")}
      />
    </div>
  );
};
