import React from "react";
import {
  Activity,
  Banknote,
  Bot,
  ClipboardList,
  Clapperboard,
  CreditCard,
  Home,
  Megaphone,
  MessageSquare,
  Network,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { supabase } from "../lib/supabase.ts";

const NAV: Array<{ id: string; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "families", label: "Families", icon: Users },
  { id: "activities", label: "Activities", icon: Activity },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "caregivers", label: "Caregivers", icon: UsersRound },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
  { id: "studio", label: "AI Video Studio", icon: Clapperboard },
  { id: "social", label: "Social publishing", icon: Megaphone },
  { id: "coverage", label: "Coverage partners", icon: Network },
  { id: "costs", label: "Costs", icon: Banknote },
  { id: "audit", label: "Audit log", icon: ClipboardList },
  { id: "users", label: "Admin users", icon: ShieldCheck },
];

interface Props {
  route: string;
  email: string;
}

export const Sidebar: React.FC<Props> = ({ route, email }) => {
  return (
    <aside className="w-64 shrink-0 bg-ink text-white flex flex-col">
      <div className="p-6 flex items-center gap-2 border-b border-white/10">
        <Bot className="text-accent" />
        <span className="font-display font-extrabold text-xl">NeuroSpark</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((n) => {
          const active = (route === "" && n.id === "overview") || route === n.id;
          return (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition ${
                active ? "bg-primary text-white" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <n.icon className="w-4 h-4" /> {n.label}
            </a>
          );
        })}
      </nav>
      <div className="p-5 border-t border-white/10 text-xs text-slate-400">
        <div className="truncate">{email}</div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-2 text-slate-200 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
};
