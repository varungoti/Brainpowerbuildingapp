import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { clearPrintableGuideCache, createPrintableGuide, type PrintableGuideCacheScope } from "./guideClient";
import { buildPrintableGuideFallback } from "./guideFallback";
import { printableGuideRequestIdentity } from "./guideValidation";
import type { PrintableGuide, PrintableGuideRequest } from "./guideTypes";

type GuideState = {
  guide: PrintableGuide | null;
  loading: boolean;
  status: string | null;
};
const EMPTY: GuideState = { guide: null, loading: false, status: null };

/** Keep visible state and async completions within the current committed view. */
export function usePrintableGuide(
  request: PrintableGuideRequest | null,
  cacheScope: PrintableGuideCacheScope,
  enabled: boolean,
) {
  // Include the full projected revision, not the legacy pack hash. The identity
  // and scope remain local and are never added to a provider request.
  const identity = request ? printableGuideRequestIdentity(request) : null;
  const context = useMemo(() => ({}), [cacheScope, identity, enabled]);
  const activeContext = useRef<object | null>(null);
  const latestOperation = useRef<symbol | null>(null);
  const [stored, setStored] = useState<{ context: object; value: GuideState } | null>(null);

  useLayoutEffect(() => {
    activeContext.current = context;
    setStored(null);
    return () => {
      activeContext.current = null;
      latestOperation.current = null;
      clearPrintableGuideCache(cacheScope);
    };
  }, [context, cacheScope]);

  const begin = () => {
    if (!enabled || !request || request.activities.length === 0 || activeContext.current !== context) return null;
    const operation = Symbol();
    latestOperation.current = operation;
    return () => activeContext.current === context && latestOperation.current === operation;
  };

  const publish = (isCurrent: () => boolean, value: GuideState | ((current: GuideState) => GuideState)) => {
    if (!isCurrent()) return;
    // Recheck when React applies a queued update, too. A newer event can occur
    // between scheduling this update and committing its render.
    setStored(previous => isCurrent() ? {
      context,
      value: typeof value === "function" ? value(previous?.context === context ? previous.value : EMPTY) : value,
    } : previous);
  };

  const createGuide = async (options?: { includeImages?: boolean; forceRefresh?: boolean }) => {
    const isCurrent = begin();
    if (!isCurrent || !request) return;
    const snapshot = structuredClone({ ...request, ...options });
    publish(isCurrent, current => ({ ...current, loading: true, status: "Creating parent guide: text, steps, and illustrations..." }));
    try {
      let guide: PrintableGuide;
      try {
        guide = await createPrintableGuide(snapshot, cacheScope);
      } catch {
        if (!isCurrent()) return;
        guide = buildPrintableGuideFallback(snapshot);
      }
      publish(isCurrent, {
        guide,
        loading: false,
        status: guide.provider === "fallback" ? "Using simple offline guide." : "Guide ready.",
      });
    } finally {
      if (isCurrent()) {
        setStored(previous => isCurrent() && previous?.context === context
          ? { context, value: { ...previous.value, loading: false } }
          : previous);
      }
    }
  };

  const useIconGuide = () => {
    const isCurrent = begin();
    if (!isCurrent || !request) return;
    // Supersede both UI and cache writes from previously started remote work.
    // This does not abort or recall a request already sent to the provider.
    clearPrintableGuideCache(cacheScope);
    const guide = buildPrintableGuideFallback(structuredClone({ ...request, includeImages: false }));
    publish(isCurrent, { guide, loading: false, status: "Simple icon version ready." });
  };

  // Mask in render, before effect cleanup. Never expose an old account/child or
  // pack's guide, status, or loading state for even the first changed render.
  const visible = enabled && stored?.context === context ? stored.value : EMPTY;
  return { ...visible, createGuide, useIconGuide };
}
