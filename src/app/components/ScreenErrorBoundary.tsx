import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { reportClientError } from "../../utils/monitoring";

interface Props {
  /** Human label for the crashing screen — surfaced in the fallback UI. */
  screenName: string;
  /** Optional way back, e.g. app.goBack or navigate("home"). */
  onRetry?: () => void;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Localised error boundary for individual screens. Unlike the top-level
 * ErrorBoundary this does NOT clear localStorage or force a full reload —
 * it just isolates a single screen's crash so the nav shell, background sync
 * and user data remain intact.
 */
export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[NeuroSpark ScreenErrorBoundary:${this.props.screenName}]`, error, info);
    reportClientError(error, {
      componentStack: info.componentStack ?? undefined,
      screen: this.props.screenName,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: "" });
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    const isDev = import.meta.env.DEV;
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center gap-4 bg-slate-50">
        <div className="text-4xl">⚠️</div>
        <div>
          <div className="text-slate-900 font-bold text-base mb-1">
            This screen had a problem
          </div>
          <div className="text-slate-500 text-xs max-w-xs">
            Your data is safe — you can go back and try again. Other screens are still working.
          </div>
          {isDev && this.state.message && (
            <div className="mt-2 max-w-xs rounded-xl bg-slate-900/90 p-2 font-mono text-[10px] text-white/70 break-all">
              {this.state.message}
            </div>
          )}
        </div>
        <button
          onClick={this.handleRetry}
          className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}
        >
          Try again
        </button>
      </div>
    );
  }
}
