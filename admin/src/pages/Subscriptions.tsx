import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { DataTable, downloadCsv } from "../components/DataTable.tsx";

export const SubscriptionsPage: React.FC = () => {
  const { data } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => api<{ data: Array<Record<string, unknown>> }>("/admin/subscriptions"),
  });
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold">Subscriptions</h1>
      <DataTable
        rows={data?.data ?? []}
        cols={[
          { key: "user_id", label: "User" },
          { key: "plan", label: "Plan" },
          { key: "status", label: "Status" },
          { key: "source", label: "Source" },
          { key: "expires_at", label: "Expires" },
        ]}
        onExport={() => downloadCsv(data?.data ?? [], "subscriptions.csv")}
      />
    </div>
  );
};
