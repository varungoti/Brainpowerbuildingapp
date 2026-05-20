import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase.ts";
import type { Session } from "@supabase/supabase-js";
import { Sidebar } from "./components/Sidebar.tsx";
import { LoginPage } from "./pages/Login.tsx";
import { OverviewPage } from "./pages/Overview.tsx";
import { FamiliesPage } from "./pages/Families.tsx";
import { ActivitiesPage } from "./pages/Activities.tsx";
import { SubscriptionsPage } from "./pages/Subscriptions.tsx";
import { CaregiversPage } from "./pages/Caregivers.tsx";
import { FeedbackPage } from "./pages/Feedback.tsx";
import { CostsPage } from "./pages/Costs.tsx";
import { AuditPage } from "./pages/Audit.tsx";
import { AdminUsersPage } from "./pages/AdminUsers.tsx";
import { FamilyDetailPage } from "./pages/FamilyDetail.tsx";
import { StudioPage } from "./pages/studio/StudioPage.tsx";
import { StudioJobPage } from "./pages/studio/StudioJobPage.tsx";
import { SocialPage } from "./pages/social/SocialPage.tsx";
import { CoveragePartnersPage } from "./pages/coverage/CoveragePartnersPage.tsx";
import { GrowthCommandCenterPage } from "./pages/growth/GrowthCommandCenterPage.tsx";
import { MissionHQPage } from "./pages/missions/MissionHQPage.tsx";
import { MarketingOsPage } from "./pages/marketing/MarketingOsPage.tsx";

const ROUTES: Record<string, React.FC> = {
  "": OverviewPage,
  overview: OverviewPage,
  families: FamiliesPage,
  activities: ActivitiesPage,
  subscriptions: SubscriptionsPage,
  caregivers: CaregiversPage,
  feedback: FeedbackPage,
  costs: CostsPage,
  audit: AuditPage,
  users: AdminUsersPage,
  studio: StudioPage,
  social: SocialPage,
  coverage: CoveragePartnersPage,
  growth: GrowthCommandCenterPage,
  missions: MissionHQPage,
  marketing: MarketingOsPage,
};

function normalizeHashFragment(raw: string): string {
  let h = raw.startsWith("#") ? raw.slice(1) : raw;
  if (h.startsWith("/")) h = h.slice(1);
  return h;
}

function useHashRoute(): { route: string; param?: string } {
  const [hash, setHash] = useState(() => normalizeHashFragment(window.location.hash));
  useEffect(() => {
    const onHash = () => setHash(normalizeHashFragment(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const [route, param] = hash.split("/");
  return { route: route ?? "", param };
}

function getDevE2ESession(): Session | null {
  if (!import.meta.env.DEV) return null;
  if (window.localStorage.getItem("neurospark.admin.e2e.session") !== "1") return null;
  return {
    access_token: "admin-e2e-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "admin-e2e-refresh",
    user: {
      id: "admin-e2e",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
      email: "admin.e2e@neurospark.test",
    },
  } as Session;
}

export const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const e2eSession = getDevE2ESession();
    if (e2eSession) {
      setSession(e2eSession);
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  const { route, param } = useHashRoute();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }
  if (!session) return <LoginPage />;

  let Page = ROUTES[route] ?? OverviewPage;
  if (route === "studio" && param) Page = () => <StudioJobPage jobId={param} />;
  if (route === "families" && param) Page = () => <FamilyDetailPage userId={param} />;

  return (
    <div className="min-h-screen flex">
      <Sidebar route={route} email={session.user.email ?? ""} />
      <main className="flex-1 p-8 overflow-y-auto bg-slate-50">
        <Page />
      </main>
    </div>
  );
};
