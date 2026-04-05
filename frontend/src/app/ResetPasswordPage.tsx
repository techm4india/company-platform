import { useState } from "react";
import { supabase } from "../lib/supabase";

export function ResetPasswordPage() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function update() {
    setMsg("");
    if (!pw.trim() || pw.length < 8) return setMsg("Password must be at least 8 characters.");
    if (pw !== pw2) return setMsg("Passwords do not match.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setMsg("Password updated. You can close this page and continue.");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[--radius-card] border border-slate-200 bg-white shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="text-2xl font-black text-slate-900">Reset password</div>
          <div className="mt-1 text-sm text-slate-500">Set a new password for your account.</div>
        </div>
        <div className="p-6 space-y-4">
          <label className="block">
            <div className="text-xs font-bold text-slate-600">New password</div>
            <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500" />
          </label>
          <label className="block">
            <div className="text-xs font-bold text-slate-600">Confirm new password</div>
            <input value={pw2} onChange={(e) => setPw2(e.target.value)} type="password" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500" />
          </label>
          {msg && <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{msg}</div>}
          <button onClick={update} disabled={busy} className="w-full rounded-xl bg-emerald-600 text-white font-extrabold py-2.5 disabled:opacity-60">
            {busy ? "Updating..." : "Update password"}
          </button>
        </div>
      </div>
    </div>
  );
}

