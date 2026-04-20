import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { DataTable, downloadCsv } from "../components/DataTable.tsx";

export const ActivitiesPage: React.FC = () => {
  const { data } = useQuery({
    queryKey: ["activities"],
    queryFn: () => api<{ data: Array<Record<string, unknown>> }>("/admin/activities"),
  });
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold">Activities</h1>
      <DataTable
        rows={data?.data ?? []}
        cols={[
          { key: "activity_id", label: "Activity" },
          { key: "count", label: "Attempts" },
          { key: "avg_rating", label: "Avg rating" },
        ]}
        onExport={() => downloadCsv(data?.data ?? [], "activities.csv")}
      />
    </div>
  );
};
