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
import { StudioPage } from "./pages/studio/StudioPage.tsx";
import { StudioJobPage } from "./pages/studio/StudioJobPage.tsx";
import { SocialPage } from "./pages/social/SocialPage.tsx";
import { CoveragePartnersPage } from "./pages/coverage/CoveragePartnersPage.tsx";

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
};

function useHashRoute(): { route: string; param?: string } {
  const [hash, setHash] = useState(window.location.hash.slice(1));
  useEffect(() => {
    const onHash = () => setHash(window.location.hash.slice(1));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const [route, param] = hash.split("/");
  return { route: route ?? "", param };
}

export const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
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

  return (
    <div className="min-h-screen flex">
      <Sidebar route={route} email={session.user.email ?? ""} />
      <main className="flex-1 p-8 overflow-y-auto bg-slate-50">
        <Page />
      </main>
    </div>
  );
};
