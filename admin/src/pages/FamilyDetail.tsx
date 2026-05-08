import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { DataTable } from "../components/DataTable.tsx";

type FamilyDetail = {
  profile: Record<string, unknown> | null;
  children: Array<Record<string, unknown>>;
  sessions: Array<Record<string, unknown>>;
  subscription: Record<string, unknown> | null;
};

export const FamilyDetailPage: React.FC<{ userId: string }> = ({ userId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["family-detail", userId],
    queryFn: () => api<FamilyDetail>(`/admin/families/${encodeURIComponent(userId)}`),
  });

  if (isLoading) return <div className="card">Loading family detail…</div>;
  if (error) return <div className="card text-red-600">Could not load family detail.</div>;

  const profile = data?.profile ?? {};
  const children = data?.children ?? [];
  const sessions = data?.sessions ?? [];
  const subscription = data?.subscription ?? null;

  return (
    <div className="space-y-6">
      <div>
        <a href="#families" className="text-sm text-primary hover:underline">
          Back to families
        </a>
        <h1 className="font-display text-3xl font-extrabold mt-2">Family detail</h1>
        <p className="text-sm text-slate-500 font-mono">{userId}</p>
      </div>

      <section className="card">
        <h2 className="font-semibold mb-3">Profile</h2>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <Detail label="Email" value={profile.email} />
          <Detail label="Display name" value={profile.display_name} />
          <Detail label="Joined" value={profile.created_at} />
          <Detail label="Subscription" value={subscription?.status ?? "none"} />
        </dl>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Children</h2>
        <DataTable
          rows={children}
          empty="No children found for this family."
          cols={[
            { key: "name", label: "Name" },
            { key: "age", label: "Age" },
            { key: "created_at", label: "Created" },
          ]}
        />
      </section>

      <section>
        <h2 className="font-semibold mb-3">Recent sessions</h2>
        <DataTable
          rows={sessions}
          empty="No recent sessions."
          cols={[
            { key: "created_at", label: "Started" },
            { key: "device", label: "Device" },
            { key: "duration_seconds", label: "Duration seconds" },
          ]}
        />
      </section>
    </div>
  );
};

const Detail: React.FC<{ label: string; value: unknown }> = ({ label, value }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-1 font-medium">{String(value ?? "—")}</dd>
  </div>
);
