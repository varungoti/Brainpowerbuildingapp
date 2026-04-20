import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { DataTable } from "../components/DataTable.tsx";

const ROLES = ["readonly", "support", "marketing", "analyst", "superadmin"] as const;
type Role = (typeof ROLES)[number];

interface AdminUser extends Record<string, unknown> {
  user_id: string;
  email: string;
  role: Role;
  disabled_at?: string | null;
}

export const AdminUsersPage: React.FC = () => {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api<{ data: AdminUser[] }>("/admin/users"),
  });
  const upsert = useMutation({
    mutationFn: (b: { user_id: string; email: string; role: Role }) =>
      api("/admin/users", { method: "POST", body: JSON.stringify(b) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
  const disable = useMutation({
    mutationFn: (id: string) => api(`/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const [form, setForm] = useState({ user_id: "", email: "", role: "readonly" as Role });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Admin users</h1>
      <form
        className="card flex gap-3 flex-wrap items-end"
        onSubmit={(e) => {
          e.preventDefault();
          upsert.mutate(form);
        }}
      >
        <Field label="user_id (UUID)">
          <input
            value={form.user_id}
            onChange={(e) => setForm({ ...form, user_id: e.target.value })}
            className="input w-80"
            required
          />
        </Field>
        <Field label="email">
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input w-72"
            required
          />
        </Field>
        <Field label="role">
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            className="input"
          >
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <button className="btn-primary">Add / update</button>
      </form>
      <DataTable
        rows={data?.data ?? []}
        cols={[
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          {
            key: "disabled_at",
            label: "Status",
            render: (r) => (r.disabled_at ? "disabled" : "active"),
          },
          {
            key: "user_id",
            label: "",
            render: (r) =>
              r.disabled_at ? null : (
                <button
                  className="text-red-600 hover:underline text-xs"
                  onClick={() => disable.mutate((r as AdminUser).user_id)}
                >
                  Disable
                </button>
              ),
          },
        ]}
      />
      <style>{`.input{ @apply rounded-lg border border-slate-300 px-3 py-2 text-sm; }`}</style>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="text-xs text-slate-600 flex flex-col gap-1">
    {label}
    {children}
  </label>
);
