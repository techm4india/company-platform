import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

// Parked demo-only login page (not wired).
// We can re-enable it later by swapping the import in `AppRoot.tsx`.

const DEMO = {
  student: {
    email: "student@demo.techm4schools.local",
    password: "ChangeMe_Student_12345"
  },
  admin: {
    email: "admin@demo.techm4schools.local",
    password: "ChangeMe_Admin_12345"
  }
} as const;

export function AuthPageDemo() {
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const troubleshooting = useMemo(() => {
    if (!msg) return "";
    if (!/failed to fetch/i.test(msg)) return "";
    return [
      "Cannot reach Supabase from the browser.",
      "Fix checklist:",
      "1) Vercel → Project → Settings → Environment Variables: set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY and redeploy.",
      "2) Supabase → Authentication → URL Configuration: set Site URL to your Vercel domain and add Redirect URL: https://<your-domain>/reset-password.",
      "3) Supabase project must be running (not paused)."
    ].join("\n");
  }, [msg]);

  async function enterDemo(kind: "student" | "admin") {
    setMsg("");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO[kind].email,
        password: DEMO[kind].password
      });
      if (error) throw error;
      setMsg("Signed in.");
    } catch (e: any) {
      const m = e?.message ?? "Demo sign-in failed";
      setMsg(
        `${m}\n\nSetup required:\n- Supabase → Auth → Providers → Email: enable Password\n- Supabase → Auth → Users: create these two users (same emails) and set the passwords to match the demo.\n- Supabase SQL Editor: add admin allowlist entry for admin@demo.techm4schools.local BEFORE first admin login.`
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center p-4">
        <div className="grid w-full grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_120px_rgba(2,6,23,0.14)] md:grid-cols-2">
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_30%_20%,rgba(16,185,129,0.28),transparent_60%),radial-gradient(50%_50%_at_70%_80%,rgba(14,165,233,0.18),transparent_65%)]" />
            <div className="relative h-full p-10">
              <div className="text-xs font-black tracking-[0.28em] text-slate-500">
                TECH<span className="text-[--color-brand-600]">M4</span>SCHOOLS
              </div>
              <div className="mt-3 text-3xl font-black text-slate-900">Student OS</div>
              <div className="mt-2 text-sm text-slate-600">Demo access (parked).</div>
            </div>
          </div>

          <div className="p-6 md:p-10">
            <div className="md:hidden">
              <div className="text-xs font-black tracking-[0.25em] text-slate-500">
                TECH<span className="text-[--color-brand-600]">M4</span>SCHOOLS
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">Student OS Demo</div>
              <div className="mt-1 text-sm text-slate-500">One-click demo access.</div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-extrabold text-slate-900">Demo access</div>
                <div className="mt-4 grid gap-2">
                  <button
                    onClick={() => enterDemo("student")}
                    disabled={busy}
                    className="w-full rounded-2xl bg-emerald-600 text-white font-extrabold py-3 shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {busy ? "Signing in..." : "Enter as Demo Student"}
                  </button>
                  <button
                    onClick={() => enterDemo("admin")}
                    disabled={busy}
                    className="w-full rounded-2xl bg-slate-900 text-white font-extrabold py-3 shadow-sm transition hover:bg-slate-950 disabled:opacity-60"
                  >
                    {busy ? "Signing in..." : "Enter as Demo Admin"}
                  </button>
                </div>
              </div>

              {msg && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 whitespace-pre-line">
                  <div className="font-bold text-slate-900">{msg}</div>
                  {troubleshooting && <div className="mt-2 text-xs text-slate-600 whitespace-pre-line">{troubleshooting}</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

