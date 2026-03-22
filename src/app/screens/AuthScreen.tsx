import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { getSupabaseBrowserClient, isSupabaseAuthConfigured } from "../../utils/supabase/client";

export function AuthScreen() {
  const { loginUser, navigate, authMode, setAuthMode } = useApp();
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const valid = email.includes("@") && pass.length >= 6 && (authMode === "login" || name.trim().length >= 2);
  const useRemoteAuth = isSupabaseAuthConfigured();

  const handleSubmit = async () => {
    if (!valid) { setError("Please fill all fields correctly."); return; }
    setError("");
    setLoading(true);

    const client = getSupabaseBrowserClient();
    if (client) {
      try {
        if (authMode === "signup") {
          const { data, error: e } = await client.auth.signUp({
            email: email.trim(),
            password: pass,
            options: {
              data: { full_name: name.trim() },
              emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
            },
          });
          if (e) throw e;
          if (data.session?.user && data.user) {
            loginUser(email.trim(), name.trim(), { supabaseUid: data.user.id });
          } else {
            setError(
              "Check your email to confirm your account, then sign in. (For local dev: disable email confirmation in Supabase → Authentication → Providers → Email.)",
            );
          }
        } else {
          const { data, error: e } = await client.auth.signInWithPassword({
            email: email.trim(),
            password: pass,
          });
          if (e) throw e;
          const u = data.user;
          const nm =
            (typeof u.user_metadata?.full_name === "string" && u.user_metadata.full_name) ||
            u.email?.split("@")[0] ||
            "Parent";
          loginUser(u.email!, nm, { supabaseUid: u.id });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    await new Promise((r) => setTimeout(r, 600));
    loginUser(email.trim(), authMode === "signup" ? name.trim() : email.split("@")[0]);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col" style={{ background:"linear-gradient(160deg,#0f0c29 0%,#1a1a2e 100%)" }}>
      {/* Back */}
      <button onClick={() => navigate("landing")} className="m-4 self-start w-9 h-9 rounded-full glass flex items-center justify-center">
        <span className="text-white text-lg">‹</span>
      </button>

      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="text-4xl mb-3 animate-float">🧠</div>
          <div className="text-white font-black mb-1" style={{ fontSize:26 }}>
            {authMode === "signup" ? "Create Your Account" : "Welcome Back"}
          </div>
          <p className="text-white/50 text-sm">
            {authMode === "signup" ? "Start your child's brain journey today" : "Continue your child's journey"}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex mb-6 p-1 rounded-2xl animate-slide-up stagger-1"
          style={{ background:"rgba(255,255,255,0.08)" }}>
          {(["signup","login"] as const).map(mode => (
            <button key={mode} onClick={() => { setAuthMode(mode); setError(""); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: authMode === mode ? "linear-gradient(135deg,#4361EE,#7209B7)" : "transparent",
                color: authMode === mode ? "white" : "rgba(255,255,255,0.5)",
              }}>
              {mode === "signup" ? "Sign Up" : "Login"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-4 animate-slide-up stagger-2">
          {authMode === "signup" && (
            <Field label="Your Name" value={name} onChange={setName} placeholder="e.g. Priya Sharma" type="text"
              valid={name.trim().length >= 2} icon="👤" />
          )}
          <Field label="Email Address" value={email} onChange={setEmail} placeholder="parent@email.com" type="email"
            valid={email.includes("@")} icon="✉️" />
          <div>
            <label className="text-white/70 mb-1.5 block" style={{ fontSize:12 }}>Password</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">🔒</span>
              <input
                type={showPass ? "text" : "password"}
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-10 pr-12 py-3.5 rounded-2xl outline-none text-white text-sm"
                style={{ background:"rgba(255,255,255,0.1)", border:`1px solid ${pass.length >= 6 ? "rgba(6,214,160,0.5)" : "rgba(255,255,255,0.15)"}`, caretColor:"white" }}
              />
              <button onClick={() => setShowPass(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base">
                {showPass ? "🙈" : "👁️"}
              </button>
              {pass.length >= 6 && <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs" style={{ color:"#06D6A0" }}>✓</span>}
            </div>
            {authMode === "signup" && (
              <div className="flex gap-1 mt-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex-1 h-1 rounded-full transition-all"
                    style={{ background: pass.length > i * 3 ? (pass.length < 6 ? "#FFB703" : "#06D6A0") : "rgba(255,255,255,0.1)" }}/>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-xs text-center animate-fade-in">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!valid || loading}
            className="w-full py-4 rounded-2xl font-bold transition-all relative overflow-hidden mt-2"
            style={{
              background: valid && !loading ? "linear-gradient(135deg,#F72585,#7209B7)" : "rgba(255,255,255,0.1)",
              color: valid && !loading ? "white" : "rgba(255,255,255,0.4)",
              boxShadow: valid && !loading ? "0 8px 24px rgba(247,37,133,0.4)" : "none",
            }}>
            {loading
              ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⚙️</span> Signing you in...</span>
              : authMode === "signup" ? "Create Account & Start 🚀" : "Sign In →"
            }
            {valid && !loading && <div className="absolute inset-0 animate-shimmer"/>}
          </button>
        </div>

        {/* Social proof */}
        <div className="mt-8 text-center animate-slide-up stagger-3">
          <div className="flex justify-center gap-1 mb-2">
            {["🌍","🇮🇳","🇯🇵","🇨🇳","🇰🇷"].map((e, i) => <span key={i} className="text-xl">{e}</span>)}
          </div>
          <p className="text-white/30 text-xs">Research from 5 global traditions · 16 methods · 13 intelligence types</p>
        </div>

        <p className="text-center text-white/20 mt-4" style={{ fontSize:10 }}>
          {useRemoteAuth
            ? "Account is secured with Supabase. Child activity data still stays in this app on your device until you enable cloud backup."
            : "By continuing, NeuroSpark stores your data locally on this device only. We never sell personal information."}
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type, valid, icon }: {
  label:string; value:string; onChange:(v:string)=>void; placeholder:string; type:string; valid:boolean; icon:string;
}) {
  return (
    <div>
      <label className="text-white/70 mb-1.5 block" style={{ fontSize:12 }}>{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">{icon}</span>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3.5 rounded-2xl outline-none text-white text-sm"
          style={{ background:"rgba(255,255,255,0.1)", border:`1px solid ${valid ? "rgba(6,214,160,0.5)" : "rgba(255,255,255,0.15)"}`, caretColor:"white" }}
        />
        {valid && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs" style={{ color:"#06D6A0" }}>✓</span>}
      </div>
    </div>
  );
}
