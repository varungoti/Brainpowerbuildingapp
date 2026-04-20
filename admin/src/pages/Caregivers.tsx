import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { DataTable, downloadCsv } from "../components/DataTable.tsx";

export const CaregiversPage: React.FC = () => {
  const { data } = useQuery({
    queryKey: ["caregivers"],
    queryFn: () => api<{ data: Array<Record<string, unknown>> }>("/admin/caregivers"),
  });
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold">Caregivers</h1>
      <DataTable
        rows={data?.data ?? []}
        cols={[
          { key: "owner_user_id", label: "Owner" },
          { key: "caregiver_user_id", label: "Caregiver" },
          { key: "role", label: "Role" },
          { key: "created_at", label: "Linked" },
        ]}
        onExport={() => downloadCsv(data?.data ?? [], "caregivers.csv")}
      />
    </div>
  );
};
