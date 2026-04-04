import type { AppView } from "../context/AppContext";

export const SCREEN_TITLES: Partial<Record<AppView, string>> = {
  home: "NeuroSpark",
  generate: "Activity Generator",
  history: "Brain Journey",
  stats: "Dev. Stats",
  profile: "Profile",
  add_child: "Add Child",
  blueprint: "Blueprint Docs",
  feeds: "Community feeds",
  paywall: "Unlock Activities",
  year_plan: "Year Roadmap",
  ai_counselor: "AI Counselor",
  brain_map: "Brain Map",
  activity_detail: "Activity Detail",
  legal_info: "Legal & Trust",
  weekly_report: "Weekly Report",
  sibling_mode: "Sibling Mode",
  portfolio: "Creation Portfolio",
  settings_language: "Language",
  settings_sensory: "Sensory Settings",
  seasonal_library: "Seasonal Activities",
};

export const FULL_SCREEN_VIEWS: AppView[] = [
  "landing",
  "auth",
  "onboard_welcome",
  "onboard_child",
  "onboard_materials",
  "onboard_ready",
];

const HEADERLESS_VIEWS: AppView[] = [
  "home",
  "generate",
  "pack_result",
  "paywall",
  "year_plan",
  "ai_counselor",
  "brain_map",
  "milestones",
];

export function getScreenTitle(view: AppView): string {
  return SCREEN_TITLES[view] ?? "NeuroSpark";
}

export function shouldHideHeader(view: AppView): boolean {
  return HEADERLESS_VIEWS.includes(view);
}

export function getActiveNavTab(view: AppView): AppView | null {
  if (view === "pack_result" || view === "paywall" || view === "activity_detail") return "generate";
  if (view === "know_your_child") return "brain_map";
  if (view === "legal_info" || view === "stats" || view === "history" || view === "add_child" || view === "blueprint" || view === "feeds"
    || view === "settings_language" || view === "settings_sensory" || view === "portfolio"
    || view === "weekly_report") return "profile";
  if (view === "sibling_mode" || view === "seasonal_library") return "generate";
  return view;
}
