import React from "react";

interface Col<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface Props<T> {
  rows: T[];
  cols: Col<T>[];
  empty?: string;
  onExport?: () => void;
}

export function DataTable<T extends Record<string, unknown>>({
  rows,
  cols,
  empty,
  onExport,
}: Props<T>) {
  return (
    <div className="card">
      {onExport ? (
        <div className="flex justify-end mb-3">
          <button onClick={onExport} className="btn-ghost text-xs">Export CSV</button>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              {cols.map((c) => (
                <th key={String(c.key)} className="py-2 pr-4 font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="py-12 text-center text-slate-500">
                  {empty ?? "No data."}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  {cols.map((c) => (
                    <td key={String(c.key)} className="py-2 pr-4 align-top">
                      {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function downloadCsv<T extends Record<string, unknown>>(rows: T[], filename: string) {
  if (rows.length === 0) return;
  const cols = Object.keys(rows[0]);
  const csv = [
    cols.join(","),
    ...rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
