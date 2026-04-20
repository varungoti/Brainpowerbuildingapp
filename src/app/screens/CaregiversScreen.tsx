import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { ROLE_LABELS, generateInviteCode, type CaregiverRole } from "../../lib/caregiver/caregiverSync";
import {
  acceptCaregiverInvite,
  createCaregiverInvite,
  type CaregiverScope,
} from "../../lib/caregiver/caregiverApi";
import { isSupabaseConfigured } from "../../utils/supabase/info";

export function CaregiversScreen() {
  const { activeChild, user, goBack, caregivers, addCaregiver, removeCaregiver } = useApp();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<CaregiverRole>("caregiver");
  const [copiedCode, setCopiedCode] = useState(false);
  const [serverInviteToken, setServerInviteToken] = useState<string | null>(null);
  const [serverInviteScope, setServerInviteScope] = useState<CaregiverScope>("log_only");
  const [serverInviteBusy, setServerInviteBusy] = useState(false);
  const [serverInviteError, setServerInviteError] = useState<string | null>(null);
  const [acceptInput, setAcceptInput] = useState("");
  const [acceptStatus, setAcceptStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  // Pending invite from a magic-link (App.tsx parsed ?token=… into sessionStorage).
  // Auto-prefill the accept input + try once. We never auto-accept silently —
  // we surface the success/error so the user knows what happened.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem("neurospark_pending_invite");
    } catch {
      pending = null;
    }
    if (!pending) return;
    setAcceptInput(pending);
    try {
      sessionStorage.removeItem("neurospark_pending_invite");
    } catch {
      /* ignore */
    }
    void (async () => {
      const r = await acceptCaregiverInvite(pending);
      setAcceptStatus(
        r.ok
          ? { kind: "ok", msg: `Linked to child ${r.childId?.slice(0, 6)}… (${r.scope})` }
          : { kind: "err", msg: r.errorMessage ?? "accept_failed" },
      );
      if (r.ok) setAcceptInput("");
    })();
  }, []);

  if (!activeChild) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500 text-sm">No child selected</p>
      </div>
    );
  }

  const childCaregivers = caregivers.filter(c => c.childId === activeChild.id);
  const inviteCode = user ? generateInviteCode(activeChild.id, user.id) : "";

  const handleAddCaregiver = () => {
    if (!inviteName.trim() || !inviteEmail.trim() || !user) return;
    addCaregiver({
      userId: crypto.randomUUID(),
      childId: activeChild.id,
      role: inviteRole,
      invitedBy: user.id,
      displayName: inviteName.trim(),
      email: inviteEmail.trim(),
    });
    setInviteName("");
    setInviteEmail("");
    setShowInvite(false);
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#F0EFFF" }}>
      <div className="rounded-b-3xl px-4 pt-3 pb-6"
        style={{ background: "linear-gradient(135deg,#0077B6,#4361EE)" }}>
        <button onClick={goBack} className="text-white/70 text-xs mb-3 flex items-center gap-1">
          <span>‹</span> Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">👨‍👩‍👧</span>
          <div>
            <div className="text-white font-black text-xl">Caregivers</div>
            <div className="text-white/60 text-xs">Manage who can track {activeChild.name}'s progress</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div>
          <div className="font-bold text-gray-800 text-sm mb-2">Current Caregivers</div>
          <div className="space-y-2">
            {user && (
              <div className="bg-white rounded-2xl p-3.5 border border-gray-100 flex items-center gap-3">
                <span className="text-2xl">{ROLE_LABELS.primary.emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 text-sm">{user.name} (You)</div>
                  <div className="text-gray-400 text-xs">{user.email}</div>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "rgba(67,97,238,0.1)", color: "#4361EE" }}>
                  Primary
                </span>
              </div>
            )}
            {childCaregivers.map(c => (
              <div key={c.id} className="bg-white rounded-2xl p-3.5 border border-gray-100 flex items-center gap-3">
                <span className="text-2xl">{ROLE_LABELS[c.role].emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 text-sm">{c.displayName}</div>
                  <div className="text-gray-400 text-xs">{c.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "rgba(114,9,183,0.1)", color: "#7209B7" }}>
                    {ROLE_LABELS[c.role].label}
                  </span>
                  <button onClick={() => removeCaregiver(c.id)}
                    className="text-red-400 text-xs">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!showInvite ? (
          <button onClick={() => setShowInvite(true)}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 font-semibold text-sm flex items-center justify-center gap-2">
            <span>➕</span> Add Caregiver
          </button>
        ) : (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
            <div className="font-bold text-gray-800 text-sm">Add Caregiver</div>
            <input type="text" placeholder="Name" value={inviteName}
              onChange={e => setInviteName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <input type="email" placeholder="Email" value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <div>
              <label className="text-gray-600 text-xs font-semibold block mb-1">Role</label>
              <div className="flex gap-2">
                {(["caregiver", "observer"] as const).map(role => (
                  <button key={role} onClick={() => setInviteRole(role)}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border text-center"
                    style={{
                      borderColor: inviteRole === role ? "#4361EE" : "#e5e7eb",
                      background: inviteRole === role ? "rgba(67,97,238,0.08)" : "white",
                    }}>
                    <span className="block">{ROLE_LABELS[role].emoji} {ROLE_LABELS[role].label}</span>
                    <span className="text-gray-400" style={{ fontSize: 9 }}>{ROLE_LABELS[role].desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowInvite(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm">Cancel</button>
              <button onClick={handleAddCaregiver}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}>Add</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="font-bold text-gray-800 text-sm mb-2">🔗 Invite Code</div>
          <p className="text-gray-500 text-xs mb-3">Share this code with another caregiver to let them link to {activeChild.name}.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-50 px-3 py-2 rounded-xl text-xs font-mono text-gray-700 truncate">
              {inviteCode.slice(0, 24)}...
            </code>
            <button onClick={() => {
              void navigator.clipboard?.writeText(inviteCode);
              setCopiedCode(true);
              setTimeout(() => setCopiedCode(false), 2000);
            }}
              className="px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: copiedCode ? "rgba(6,214,160,0.1)" : "rgba(67,97,238,0.1)", color: copiedCode ? "#06D6A0" : "#4361EE" }}>
              {copiedCode ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {isSupabaseConfigured() && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
            <div>
              <div className="font-bold text-gray-800 text-sm mb-1">🌐 Cloud invite (cross-device)</div>
              <p className="text-gray-500 text-xs">Share access with someone signed in on another device. The token is short-lived (7 days) and scoped.</p>
            </div>
            <div className="flex gap-2">
              {(["view", "log_only", "co_parent"] as const).map((s) => {
                const active = serverInviteScope === s;
                return (
                  <button
                    key={s}
                    onClick={() => setServerInviteScope(s)}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border text-center"
                    style={{
                      borderColor: active ? "#4361EE" : "#e5e7eb",
                      background: active ? "rgba(67,97,238,0.08)" : "white",
                    }}
                  >
                    {s === "view" ? "View" : s === "log_only" ? "Log only" : "Co-parent"}
                  </button>
                );
              })}
            </div>
            <button
              disabled={serverInviteBusy}
              onClick={async () => {
                setServerInviteBusy(true);
                setServerInviteError(null);
                const r = await createCaregiverInvite(activeChild.id, serverInviteScope);
                setServerInviteBusy(false);
                if (r.ok && r.token) setServerInviteToken(r.token);
                else setServerInviteError(r.errorMessage ?? "invite_failed");
              }}
              className="w-full py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#0077B6,#4361EE)" }}
            >
              {serverInviteBusy ? "Creating…" : "Create invite token"}
            </button>
            {serverInviteToken && (
              <div className="rounded-xl bg-gray-50 p-2 flex items-center gap-2">
                <code className="flex-1 text-[11px] font-mono text-gray-700 truncate">{serverInviteToken}</code>
                <button
                  onClick={() => void navigator.clipboard?.writeText(serverInviteToken)}
                  className="text-[11px] font-bold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700"
                >
                  Copy
                </button>
              </div>
            )}
            {serverInviteError && <div className="text-xs text-red-500">{serverInviteError}</div>}

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="text-gray-700 text-xs font-bold">Accept an invite</div>
              <input
                value={acceptInput}
                onChange={(e) => setAcceptInput(e.target.value)}
                placeholder="Paste invite token"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono"
              />
              <button
                disabled={!acceptInput.trim()}
                onClick={async () => {
                  const r = await acceptCaregiverInvite(acceptInput.trim());
                  setAcceptStatus(
                    r.ok
                      ? { kind: "ok", msg: `Linked to child ${r.childId?.slice(0, 6)}… (${r.scope})` }
                      : { kind: "err", msg: r.errorMessage ?? "accept_failed" },
                  );
                  if (r.ok) setAcceptInput("");
                }}
                className="w-full py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                style={{ background: "rgba(6,214,160,0.15)", color: "#059669" }}
              >
                Accept
              </button>
              {acceptStatus && (
                <div className="text-xs" style={{ color: acceptStatus.kind === "ok" ? "#059669" : "#DC2626" }}>
                  {acceptStatus.msg}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="font-bold text-gray-800 text-sm mb-2">🔒 Role Permissions</div>
          <div className="space-y-2">
            {(Object.entries(ROLE_LABELS) as [CaregiverRole, typeof ROLE_LABELS[CaregiverRole]][]).map(([role, info]) => (
              <div key={role} className="flex items-center gap-2 text-xs text-gray-600">
                <span>{info.emoji}</span>
                <span className="font-semibold">{info.label}:</span>
                <span>{info.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
