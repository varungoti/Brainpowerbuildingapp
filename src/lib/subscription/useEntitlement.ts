// ============================================================================
// useEntitlement — React hook that reflects the server-side premium contract.
// ----------------------------------------------------------------------------
// Refreshes once on mount, on Supabase session change, and whenever the tab
// becomes visible (so a purchase made on another device propagates within a
// few seconds). Falls back to the local `hasCreditForToday()` heuristic so
// the app degrades gracefully when there is no internet or no Supabase.
//
// Usage:
//   const { isActive, plan, source, isLoading, refresh } = useEntitlement();
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { fetchEntitlement, type Entitlement } from "./entitlement";
import { getSupabaseBrowserClient } from "../../utils/supabase/client";

const EMPTY: Entitlement = { isActive: false, plan: null, expiresAt: null, source: null };

export interface UseEntitlementResult extends Entitlement {
  isLoading: boolean;
  refresh: () => Promise<Entitlement>;
}

export function useEntitlement(): UseEntitlementResult {
  const [state, setState] = useState<Entitlement>(EMPTY);
  const [isLoading, setLoading] = useState<boolean>(false);

  const refresh = useCallback(async (): Promise<Entitlement> => {
    setLoading(true);
    try {
      const next = await fetchEntitlement();
      setState(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Refresh on Supabase session change so a sign-in/sign-out flips premium
  // immediately rather than after the next visibility tick.
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const { data: { subscription } } = client.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED") return;
      void refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  // Refresh on tab visibility — covers "I just bought premium on my phone,
  // come back to the laptop" scenarios.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  return { ...state, isLoading, refresh };
}
