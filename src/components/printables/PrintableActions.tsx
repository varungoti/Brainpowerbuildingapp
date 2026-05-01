import type { PrintableGuide } from "../../lib/printables/guideTypes";

export function PrintableActions({
  guide,
  onRegenerate,
  onUseIcons,
  loading,
}: {
  guide: PrintableGuide;
  onRegenerate: () => void;
  onUseIcons: () => void;
  loading?: boolean;
}) {
  const print = () => window.print();
  const download = () => {
    const html = document.getElementById("printable-guide-preview")?.outerHTML ?? "";
    const blob = new Blob([
      `<!doctype html><html><head><meta charset="utf-8"><title>${guide.title}</title></head><body>${html}</body></html>`,
    ], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${guide.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-3xl p-3 bg-white border border-violet-100 shadow-sm flex flex-wrap gap-2">
      <ActionButton label="Print" onClick={print} color="#4361EE" />
      <ActionButton label="Download" onClick={download} color="#7209B7" />
      <ActionButton label={loading ? "Regenerating..." : "Regenerate illustrations"} onClick={onRegenerate} color="#F72585" disabled={loading} />
      <ActionButton label="Use simple icon version" onClick={onUseIcons} color="#047857" disabled={loading} />
    </div>
  );
}

function ActionButton({ label, onClick, color, disabled }: { label: string; onClick: () => void; color: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 min-w-[130px] rounded-2xl px-3 py-2.5 text-white font-bold text-xs disabled:opacity-50"
      style={{ background: color }}
    >
      {label}
    </button>
  );
}
