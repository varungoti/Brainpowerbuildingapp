import React, { Component, ReactNode, ErrorInfo } from "react";
import { reportClientError } from "../../utils/monitoring";

interface Props { children: ReactNode; }
interface State { hasError: boolean; message: string; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[NeuroSpark ErrorBoundary]", error, info);
    reportClientError(error, { componentStack: info.componentStack ?? undefined });
  }

  handleReset = () => {
    // Clear persisted state that might be corrupt then reload
    try { localStorage.removeItem("neurospark_v2"); } catch { /* ignore */ }
    this.setState({ hasError: false, message: "" });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    const isDev = import.meta.env.DEV;
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center gap-5"
        style={{ background: "linear-gradient(135deg,#1a1a2e,#302b63)" }}>
        <div className="text-5xl animate-bounce">🧠</div>
        <div>
          <div className="text-white font-black text-xl mb-1">Something went wrong</div>
          <div className="text-white/60 text-xs mb-2">
            The app hit an unexpected problem. Your data is safe — tap below to restart.
          </div>
          {isDev && this.state.message && (
            <div className="text-white/30 text-xs font-mono break-all max-w-xs bg-black/30 rounded-xl p-2 mt-1">
              {this.state.message}
            </div>
          )}
        </div>
        <button
          onClick={this.handleReset}
          className="px-6 py-3 rounded-2xl text-white font-bold text-sm"
          style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}>
          Restart NeuroSpark
        </button>
        <div className="text-white/30 text-xs">If this keeps happening, try reinstalling the app</div>
      </div>
    );
  }
}
