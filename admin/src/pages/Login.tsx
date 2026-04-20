import React, { useState } from "react";
import { supabase } from "../lib/supabase.ts";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form onSubmit={send} className="card w-[380px] space-y-4">
        <h1 className="font-display text-2xl font-extrabold">NeuroSpark Admin</h1>
        <p className="text-sm text-slate-600">
          Sign in with the magic link we email you. Access is gated by the{" "}
          <code>admin_users</code> table.
        </p>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@neurospark.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button className="btn-primary w-full" type="submit">
          {sent ? "Check your inbox" : "Send magic link"}
        </button>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
      </form>
    </div>
  );
};
