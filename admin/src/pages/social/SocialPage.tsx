import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Inbox,
  Loader2,
  Megaphone,
  PenSquare,
  Plug,
  RefreshCw,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { api } from "../../lib/api.ts";

type PostizStatus = {
  configured: boolean;
  ok: boolean;
  status?: number;
  error?: string;
  ui?: string | null;
};

type Channel = {
  id: string;
  name?: string;
  identifier?: string;
  picture?: string;
  providerIdentifier?: string;
  disabled?: boolean;
};

type UpcomingPost = {
  id: string;
  state?: string;
  publishDate?: string;
  content?: string;
  integration?: { providerIdentifier?: string; name?: string };
};

type Summary = {
  channelCount: number;
  channels: Channel[];
  upcomingCount: number;
  upcoming: UpcomingPost[];
};

const TABS: Array<{ id: string; label: string; path: string; icon: React.FC<{ className?: string }> }> = [
  { id: "calendar", label: "Calendar", path: "/launches", icon: CalendarDays },
  { id: "compose", label: "Compose", path: "/launches?openModal=true", icon: PenSquare },
  { id: "channels", label: "Channels", path: "/launches/channels", icon: Plug },
  { id: "analytics", label: "Analytics", path: "/analytics", icon: Megaphone },
  { id: "settings", label: "Settings", path: "/settings", icon: Settings },
];

export const SocialPage: React.FC = () => {
  const status = useQuery({
    queryKey: ["postiz-status"],
    queryFn: () => api<PostizStatus>("/admin/postiz/status"),
    refetchInterval: 60_000,
  });
  const summary = useQuery({
    queryKey: ["postiz-summary"],
    queryFn: () => api<Summary>("/admin/postiz/summary").catch(() => null),
    enabled: status.data?.ok === true,
    refetchInterval: 60_000,
  });

  const ui = status.data?.ui?.replace(/\/$/, "") ?? "";
  const [activeTab, setActiveTab] = useState<string>("calendar");
  const iframeSrc = useMemo(() => {
    if (!ui) return "";
    const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0];
    return `${ui}${tab.path}`;
  }, [ui, activeTab]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-extrabold flex items-center gap-3">
            <Megaphone className="text-primary" /> Social publishing
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Powered by self-hosted{" "}
            <a
              href="https://github.com/gitroomhq/postiz-app"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Postiz
            </a>
            . Schedule, draft, and analyse posts across 30+ channels — all from this tab.
            n8n workflows (Daily Shorts, YouTube Clipper, SEO Blog Engine) publish through the
            same Postiz instance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status.data} loading={status.isLoading} />
          <button
            className="btn-ghost"
            onClick={() => {
              status.refetch();
              summary.refetch();
            }}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {ui ? (
            <a className="btn-primary" href={ui} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4" /> Open in new tab
            </a>
          ) : null}
        </div>
      </header>

      {!status.data?.configured ? (
        <SetupCard />
      ) : status.data?.ok === false ? (
        <DownCard error={status.data?.error} ui={ui} />
      ) : (
        <>
          <SummaryStrip summary={summary.data ?? undefined} loading={summary.isLoading} />

          <div className="card p-0 overflow-hidden">
            <div className="flex items-center gap-1 border-b border-slate-200 px-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                    activeTab === t.id
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
              <span className="ml-auto pr-3 text-xs text-slate-400 hidden md:flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> If a panel stays blank, your Postiz instance
                may block being framed — use "Open in new tab".
              </span>
            </div>
            <iframe
              key={iframeSrc /* force reload on tab change */}
              src={iframeSrc}
              title="Postiz"
              className="w-full bg-white"
              style={{ height: "calc(100vh - 320px)", minHeight: 520 }}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status?: PostizStatus; loading: boolean }> = ({ status, loading }) => {
  if (loading) {
    return (
      <span className="pill bg-slate-100 text-slate-600">
        <Loader2 className="w-3 h-3 animate-spin mr-1" /> checking…
      </span>
    );
  }
  if (!status?.configured) {
    return (
      <span className="pill bg-amber-100 text-amber-700">
        <AlertTriangle className="w-3 h-3 mr-1" /> not configured
      </span>
    );
  }
  if (!status.ok) {
    return (
      <span className="pill bg-red-100 text-red-700">
        <AlertTriangle className="w-3 h-3 mr-1" /> unreachable
      </span>
    );
  }
  return (
    <span className="pill bg-green-100 text-green-700">
      <CheckCircle2 className="w-3 h-3 mr-1" /> connected
    </span>
  );
};

const SummaryStrip: React.FC<{ summary?: Summary; loading: boolean }> = ({ summary, loading }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="card flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">Connected channels</div>
          <div className="text-3xl font-display font-extrabold">
            {loading ? "—" : (summary?.channelCount ?? 0)}
          </div>
        </div>
        <Plug className="w-8 h-8 text-primary/50" />
      </div>
      <div className="card flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">Scheduled (next 7 days)</div>
          <div className="text-3xl font-display font-extrabold">
            {loading ? "—" : (summary?.upcomingCount ?? 0)}
          </div>
        </div>
        <CalendarDays className="w-8 h-8 text-primary/50" />
      </div>
      <div className="card">
        <div className="text-xs text-slate-500 mb-2">Active providers</div>
        <div className="flex flex-wrap gap-1.5">
          {summary?.channels && summary.channels.length > 0 ? (
            uniqProviders(summary.channels).map((p) => (
              <span key={p} className="pill bg-slate-100 text-slate-700">
                {p}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-400">
              <Inbox className="w-4 h-4 inline mr-1" /> Connect channels in the Channels tab.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

function uniqProviders(channels: Channel[]): string[] {
  const set = new Set<string>();
  for (const c of channels) if (c.providerIdentifier) set.add(c.providerIdentifier);
  return Array.from(set).sort();
}

const SetupCard: React.FC = () => (
  <div className="card border-amber-200 bg-amber-50">
    <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
      <AlertTriangle className="text-amber-600" /> Postiz isn't wired up yet
    </h2>
    <p className="mt-2 text-sm text-slate-700 max-w-2xl">
      Set <code className="bg-white border px-1 rounded">POSTIZ_BASE_URL</code>,{" "}
      <code className="bg-white border px-1 rounded">POSTIZ_API_KEY</code>, and{" "}
      <code className="bg-white border px-1 rounded">POSTIZ_FRONTEND_URL</code> in your Edge Function
      environment, then reload this page. Full guide:{" "}
      <a
        href="https://docs.postiz.com/quickstart"
        target="_blank"
        rel="noreferrer"
        className="text-primary hover:underline"
      >
        Postiz quickstart
      </a>
      . Inside this repo see <code>automation/postiz/README.md</code>.
    </p>
    <ol className="mt-3 text-sm text-slate-700 space-y-1.5 list-decimal list-inside">
      <li>
        <code>cd automation/postiz &amp;&amp; cp .env.example .env</code>
      </li>
      <li>
        <code>docker compose up -d</code> &nbsp;or&nbsp;
        <code>railway up --service neurospark-postiz</code>
      </li>
      <li>
        Sign in at the Postiz UI → <strong>Settings → Developers → Public API</strong> → generate an
        API key.
      </li>
      <li>Drop the key + URL into your Edge Function secrets and reload.</li>
    </ol>
  </div>
);

const DownCard: React.FC<{ error?: string; ui?: string }> = ({ error, ui }) => (
  <div className="card border-red-200 bg-red-50">
    <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
      <AlertTriangle className="text-red-600" /> Postiz is unreachable
    </h2>
    <p className="mt-2 text-sm text-slate-700">
      The proxy returned an error contacting your Postiz instance. n8n workflows that publish
      through Postiz will fall back to Buffer if <code>USE_POSTIZ=false</code>; otherwise they
      will retry. Check the Railway service logs first.
    </p>
    {error ? (
      <pre className="mt-2 text-xs bg-white border rounded p-2 overflow-auto">{error}</pre>
    ) : null}
    {ui ? (
      <a href={ui} target="_blank" rel="noreferrer" className="btn-primary mt-3">
        <ExternalLink className="w-4 h-4" /> Open Postiz directly
      </a>
    ) : null}
  </div>
);
