import React, { useMemo, useState } from "react";
import {
  OUTCOME_QUESTIONS,
  currentMonthKey,
  defaultAnswers,
  type OutcomeChecklistMonth,
} from "../data/outcomeChecklist";

type Props = {
  childName: string;
  months: OutcomeChecklistMonth[] | undefined;
  onSave: (answers: Record<string, number>) => void;
};

export function OutcomeChecklistCard({ childName, months, onSave }: Props) {
  const monthKey = useMemo(() => currentMonthKey(), []);
  const thisMonth = months?.find((m) => m.monthKey === monthKey);
  const [editing, setEditing] = useState(!thisMonth);
  const [answers, setAnswers] = useState<Record<string, number>>(() =>
    thisMonth ? { ...thisMonth.answers } : defaultAnswers(),
  );

  const history = useMemo(() => {
    const list = [...(months ?? [])].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    return list.slice(-6);
  }, [months]);

  const maxHist = Math.max(...history.map((h) => h.compositeScore), 1);

  const submit = () => {
    onSave(answers);
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 animate-slide-up">
      <div className="font-bold text-gray-800 text-sm mb-1">📋 Monthly development check-in</div>
      <p className="text-gray-500 text-xs leading-relaxed mb-3">
        Quick parent snapshot for <strong>{childName}</strong> — not a medical test. Rate how often you&apos;ve
        seen each behavior <strong>this month</strong> (1 = rarely · 5 = very often).
      </p>

      {thisMonth && !editing && (
        <div className="rounded-2xl p-3 mb-3" style={{ background: "linear-gradient(135deg,#06D6A015,#4361EE12)" }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-600">This month ({monthKey})</span>
            <span className="text-lg font-black" style={{ color: "#4361EE" }}>
              {thisMonth.compositeScore.toFixed(1)}<span className="text-xs font-normal text-gray-400">/5</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setAnswers({ ...thisMonth.answers });
              setEditing(true);
            }}
            className="text-xs font-semibold text-violet-600"
          >
            Update answers
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 mb-2">Last {history.length} month(s)</div>
          <div className="flex items-end gap-1 h-14">
            {history.map((h) => (
              <div key={h.monthKey} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-md transition-all"
                  style={{
                    height: `${Math.max((h.compositeScore / maxHist) * 40, 6)}px`,
                    background: "linear-gradient(180deg,#4361EE,#7209B7)",
                  }}
                  title={`${h.monthKey}: ${h.compositeScore}`}
                />
                <span className="text-gray-400 text-[8px] leading-none">{h.monthKey.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <div className="space-y-4">
          {OUTCOME_QUESTIONS.map((q) => (
            <div key={q.id}>
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <div>
                  <div className="text-xs font-semibold text-gray-800">{q.label}</div>
                  <div className="text-[10px] text-gray-500 leading-snug">{q.hint}</div>
                  <span className="text-[9px] text-violet-500 font-medium">{q.pillar}</span>
                </div>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: n }))}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: answers[q.id] === n ? "#4361EE" : "#f3f4f6",
                      color: answers[q.id] === n ? "#fff" : "#6b7280",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={submit}
            className="w-full py-3 rounded-2xl text-white font-bold text-sm"
            style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}
          >
            Save {monthKey} check-in
          </button>
          {thisMonth && (
            <button type="button" onClick={() => setEditing(false)} className="w-full py-2 text-xs text-gray-500">
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
