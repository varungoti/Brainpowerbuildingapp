import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type RemoteAppFlags,
  fetchRemoteAppFlags,
  peekCachedRemoteFlags,
} from "@/utils/remoteAppConfig";
import { isSupabaseConfigured } from "@/utils/supabase/info";

type Ctx = {
  remoteFlags: RemoteAppFlags;
  refreshRemoteFlags: () => Promise<void>;
  remoteFlagsLoading: boolean;
};

const RemoteConfigCtx = createContext<Ctx | null>(null);

export function RemoteConfigProvider({ children }: { children: ReactNode }) {
  const [remoteFlags, setRemoteFlags] = useState<RemoteAppFlags>(() => peekCachedRemoteFlags());
  const [remoteFlagsLoading, setRemoteFlagsLoading] = useState(false);

  const refreshRemoteFlags = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setRemoteFlagsLoading(true);
    try {
      const next = await fetchRemoteAppFlags();
      setRemoteFlags({ ...next });
    } finally {
      setRemoteFlagsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshRemoteFlags();
  }, [refreshRemoteFlags]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void refreshRemoteFlags();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refreshRemoteFlags]);

  const value = useMemo(
    () => ({ remoteFlags, refreshRemoteFlags, remoteFlagsLoading }),
    [remoteFlags, refreshRemoteFlags, remoteFlagsLoading],
  );

  return <RemoteConfigCtx.Provider value={value}>{children}</RemoteConfigCtx.Provider>;
}

export function useRemoteAppFlags(): RemoteAppFlags {
  const c = useContext(RemoteConfigCtx);
  if (!c) throw new Error("useRemoteAppFlags must be used inside RemoteConfigProvider");
  return c.remoteFlags;
}

export function useRemoteConfigActions(): Pick<Ctx, "refreshRemoteFlags" | "remoteFlagsLoading"> {
  const c = useContext(RemoteConfigCtx);
  if (!c) throw new Error("useRemoteConfigActions must be used inside RemoteConfigProvider");
  return { refreshRemoteFlags: c.refreshRemoteFlags, remoteFlagsLoading: c.remoteFlagsLoading };
}
