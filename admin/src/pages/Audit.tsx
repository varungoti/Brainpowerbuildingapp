import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { DataTable, downloadCsv } from "../components/DataTable.tsx";

export const AuditPage: React.FC = () => {
  const { data } = useQuery({
    queryKey: ["audit"],
    queryFn: () => api<{ data: Array<Record<string, unknown>> }>("/admin/audit?limit=200"),
  });
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold">Audit log</h1>
      <DataTable
        rows={data?.data ?? []}
        cols={[
          { key: "created_at", label: "When" },
          { key: "actor_email", label: "Actor" },
          { key: "action", label: "Action" },
          { key: "target_type", label: "Target type" },
          { key: "target_id", label: "Target id" },
          {
            key: "payload",
            label: "Payload",
            render: (r) => (
              <code className="text-xs">{JSON.stringify(r.payload ?? {})}</code>
            ),
          },
        ]}
        onExport={() => downloadCsv(data?.data ?? [], "audit.csv")}
      />
    </div>
  );
};
