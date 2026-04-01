import React, { useEffect, useRef, useState } from "react";
import { AppProvider, useApp, AppView } from "./context/AppContext";
import { RemoteConfigProvider } from "./context/RemoteConfigContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { FULL_SCREEN_VIEWS, getActiveNavTab, getScreenTitle, shouldHideHeader } from "./logic/viewConfig";
import { useOnlineStatus } from "../utils/networkStatus";
import { hydrateTextScaleFromNativePreferences } from "../utils/textScale";

// Screens
import { LandingScreen }     from "./screens/LandingScreen";
import { AuthScreen }        from "./screens/AuthScreen";
import { OnboardingScreen }  from "./screens/OnboardingScreen";
import { HomeScreen }        from "./screens/HomeScreen";
import { GeneratorScreen }   from "./screens/GeneratorScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { StatsScreen } from "./screens/StatsScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { AddChildScreen } from "./screens/AddChildScreen";
import { PaywallScreen } from "./screens/PaywallScreen";
import { YearPlanScreen } from "./screens/YearPlanScreen";
import { AICounselorScreen } from "./screens/AICounselorScreen";
import { BrainMapScreen } from "./screens/BrainMapScreen";
import { MilestonesScreen } from "./screens/MilestonesScreen";
import { LegalInfoScreen } from "./screens/LegalInfoScreen";
import { ActivityDetailScreen } from "./screens/ActivityDetailScreen";
import { BlueprintDocsScreen } from "./screens/BlueprintDocsScreen";

// ─── Bottom Nav ────────────────────────────────────────────────────────────────
const NAV_TABS = [
  { id:"home",        icon:"🏠", label:"Home"    },
  { id:"generate",    icon:"⚡", label:"Today"   },
  { id:"brain_map",   icon:"🧠", label:"Brain"   },
  { id:"ai_counselor",icon:"🤖", label:"AI Help" },
  { id:"profile",     icon:"👤", label:"Profile" },
];

function BottomNav() {
  const { view, navigate, credits, hasCreditForToday } = useApp();
  const activeTab = getActiveNavTab(view);
  return (
    <nav className="flex-shrink-0 flex border-t border-gray-100 bg-white px-1 pb-1 pt-1" aria-label="Primary navigation">
      {NAV_TABS.map(tab => {
        const active = activeTab === tab.id;
        const isGenerate = tab.id === "generate";
        const genCredits = isGenerate && credits > 0 ? `, ${credits} day credits remaining` : "";
        return (
          <button key={tab.id}
            type="button"
            aria-label={`${tab.label}${genCredits}`}
            aria-current={active ? "page" : undefined}
            onClick={() => {
              if (isGenerate) {
                if (hasCreditForToday()) navigate("generate");
                else navigate("paywall");
              } else {
                navigate(tab.id as AppView);
              }
            }}
            className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all relative"
            style={{ background:active?"rgba(67,97,238,0.08)":"transparent" }}>
            <span style={{ fontSize:18, filter:active?"none":"grayscale(0.3)", transform:active?"scale(1.1)":"scale(1)", transition:"transform 0.2s" }}>
              {tab.icon}
            </span>
            <span style={{ fontSize:9, fontWeight:active?700:500, color:active?"#4361EE":"#9CA3AF" }}>{tab.label}</span>
            {active && <div className="w-1 h-1 rounded-full" style={{ background:"#4361EE" }}/>}
            {isGenerate && credits > 0 && (
              <div className="absolute -top-0.5 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background:"#06D6A0", fontSize:8, color:"white", fontWeight:700 }}>
                {credits > 9 ? "9+" : credits}
              </div>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function AppHeader() {
  const { view, goBack, canGoBack, activeChild } = useApp();
  const title = getScreenTitle(view);
  const needsBack = canGoBack && view !== "home";
  if (shouldHideHeader(view)) return null;
  return (
    <div className="flex-shrink-0 flex items-center px-4 py-2.5 border-b border-gray-100 bg-white">
      {needsBack
        ? <button type="button" onClick={goBack} aria-label="Go back"
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
            <span className="text-gray-600 font-bold" aria-hidden style={{ fontSize:18 }}>‹</span>
          </button>
        : <div className="w-8 mr-3"/>
      }
      <span className="font-bold text-gray-900 text-sm flex-1">{title}</span>
      {activeChild && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-base"
          style={{ background:`${activeChild.avatarColor}30` }}>
          {activeChild.avatarEmoji}
        </div>
      )}
    </div>
  );
}

function OfflineBanner() {
  return (
    <div
      className="mx-3 mt-2 rounded-2xl border px-3 py-2 text-xs"
      style={{ background: "rgba(251,191,36,0.14)", borderColor: "rgba(245,158,11,0.35)", color: "#92400E" }}
    >
      Offline mode: local profiles, history, and backups still work. AI Counselor, analytics, and checkout need an internet connection.
    </div>
  );
}

// ─── Screen Router ─────────────────────────────────────────────────────────────
function ScreenContent() {
  const { view } = useApp();
  switch(view) {
    case "landing":           return <LandingScreen />;
    case "auth":              return <AuthScreen />;
    case "onboard_welcome":
    case "onboard_child":
    case "onboard_materials":
    case "onboard_ready":     return <OnboardingScreen />;
    case "home":              return <HomeScreen />;
    case "generate":
    case "pack_result":       return <GeneratorScreen />;
    case "activity_detail":   return <ActivityDetailScreen />;
    case "history":           return <HistoryScreen />;
    case "stats":             return <StatsScreen />;
    case "profile":           return <ProfileScreen />;
    case "add_child":         return <AddChildScreen />;
    case "blueprint":         return <BlueprintDocsScreen />;
    case "paywall":           return <PaywallScreen />;
    case "year_plan":         return <YearPlanScreen />;
    case "ai_counselor":      return <AICounselorScreen />;
    case "brain_map":
    case "know_your_child":   return <BrainMapScreen />;
    case "milestones":        return <MilestonesScreen />;
    case "legal_info":        return <LegalInfoScreen />;
    default:                  return <HomeScreen />;
  }
}

function AppShell() {
  const { view, user } = useApp();
  const mainRef = useRef<HTMLDivElement | null>(null);
  const isOnline = useOnlineStatus();
  const isFullScreen = FULL_SCREEN_VIEWS.includes(view);
  const isAuthenticated = !!user;
  const [isCompactViewport, setIsCompactViewport] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 480 || window.innerHeight < 760 : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateViewportMode = () => {
      setIsCompactViewport(window.innerWidth < 480 || window.innerHeight < 760);
    };
    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);
    return () => window.removeEventListener("resize", updateViewportMode);
  }, []);

  useEffect(() => {
    mainRef.current?.focus();
  }, [view]);

  useEffect(() => {
    void hydrateTextScaleFromNativePreferences();
  }, []);

  const shellStyle = isCompactViewport
    ? {
        width: "100vw",
        height: "100dvh",
        maxWidth: "100vw",
        maxHeight: "100dvh",
        borderRadius: 0,
        boxShadow: "none",
        background: "#F0EFFF",
      }
    : {
        width: 393,
        height: 852,
        maxHeight: "98vh",
        maxWidth: "calc(98vw)",
        borderRadius: 50,
        boxShadow: "0 0 0 10px #1a1a2e, 0 0 0 12px #2d2d3e, 0 0 80px rgba(67,97,238,0.4), inset 0 0 30px rgba(0,0,0,0.5)",
        background: "#F0EFFF",
      };
  return (
    <div className={`min-h-screen ${isCompactViewport ? "" : "flex items-center justify-center p-2"}`}
      style={{ background:"linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)" }}>

      {/* Ambient orbs */}
      {!isCompactViewport && (
        <>
          <div className="absolute w-96 h-96 rounded-full opacity-10 pointer-events-none"
            style={{ background:"radial-gradient(circle,#4361EE,transparent)", top:"10%", right:"10%" }}/>
          <div className="absolute w-80 h-80 rounded-full opacity-10 pointer-events-none"
            style={{ background:"radial-gradient(circle,#F72585,transparent)", bottom:"10%", left:"10%" }}/>
        </>
      )}

      {/* Phone frame */}
      <div className="relative flex flex-col overflow-hidden"
        style={shellStyle}>

        {/* Status bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 h-10 z-10"
          style={{ background: isFullScreen ? "transparent" : "white", color: isFullScreen ? "white" : "#374151" }}>
          <span style={{ fontSize:11, fontWeight:700 }}>9:41</span>
          <div className="absolute left-1/2 -translate-x-1/2 w-24 h-6 rounded-full"
            style={{ background:isFullScreen?"rgba(255,255,255,0.1)":"#f3f3f5" }}/>
          <div className="flex items-center gap-1">
            <span style={{ fontSize:11 }}>▮▮▮</span>
            <span style={{ fontSize:11 }}>📶</span>
            <span style={{ fontSize:11 }}>🔋</span>
          </div>
        </div>

        {isAuthenticated && !isFullScreen && (
          <a
            href="#app-main"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:left-3 focus:top-12 focus:px-3 focus:py-2 focus:rounded-xl focus:bg-white focus:text-gray-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#4361EE]"
          >
            Skip to main content
          </a>
        )}

        {/* Header */}
        {isAuthenticated && !isFullScreen && <AppHeader />}
        {isAuthenticated && !isOnline && <OfflineBanner />}

        {/* Main content */}
        <div id="app-main" ref={mainRef} role="main" tabIndex={-1} className="flex-1 overflow-hidden relative outline-none">
          <ScreenContent />
        </div>

        {/* Bottom nav */}
        {isAuthenticated && !isFullScreen && <BottomNav />}

        {/* Bottom home indicator */}
        <div className="flex-shrink-0 flex justify-center pb-1.5 pt-0.5"
          style={{ background:isFullScreen?"transparent":"white" }}>
          <div className="w-28 h-1 rounded-full"
            style={{ background:isFullScreen?"rgba(255,255,255,0.3)":"#e5e7eb" }}/>
        </div>
      </div>

      {/* External label */}
      {!isCompactViewport && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="glass rounded-full px-4 py-1.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-white/60 text-xs">NeuroSpark · v{import.meta.env.VITE_APP_VERSION ?? "1.0"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <RemoteConfigProvider>
          <AppShell />
        </RemoteConfigProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}