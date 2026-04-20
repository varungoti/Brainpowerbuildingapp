import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { DataTable, downloadCsv } from "../components/DataTable.tsx";

export const FeedbackPage: React.FC = () => {
  const { data } = useQuery({
    queryKey: ["feedback"],
    queryFn: () => api<{ data: Array<Record<string, unknown>> }>("/admin/feedback"),
  });
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold">Feedback</h1>
      <DataTable
        rows={data?.data ?? []}
        cols={[
          { key: "user_id", label: "User" },
          { key: "rating", label: "Rating" },
          { key: "comment", label: "Comment" },
          { key: "created_at", label: "Submitted" },
        ]}
        onExport={() => downloadCsv(data?.data ?? [], "feedback.csv")}
      />
    </div>
  );
};
