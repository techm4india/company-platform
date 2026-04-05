import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Step = "email" | "otp" | "password" | "reset";

export function AuthPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
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

  async function sendOtp() {
    setMsg("");
    if (!emailOk) return setMsg("Enter a valid email address.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true }
      });
      if (error) throw error;
      setStep("otp");
      setMsg("OTP sent to your email.");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setMsg("");
    if (!emailOk) return setMsg("Enter a valid email address.");
    if (!otp.trim()) return setMsg("Enter the OTP.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: "email"
      });
      if (error) throw error;
      setMsg("Signed in.");
    } catch (e: any) {
      setMsg(e?.message ?? "OTP verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function signInPassword() {
    setMsg("");
    if (!emailOk) return setMsg("Enter a valid email address.");
    if (!password.trim()) return setMsg("Enter your password.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) throw error;
      setMsg("Signed in.");
    } catch (e: any) {
      setMsg(e?.message ?? "Password sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendReset() {
    setMsg("");
    if (!emailOk) return setMsg("Enter a valid email address.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      setMsg("Password reset email sent.");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to send reset email");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center p-4">
        <div className="grid w-full grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_120px_rgba(2,6,23,0.14)] md:grid-cols-2">
          {/* Brand / value prop */}
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_30%_20%,rgba(16,185,129,0.28),transparent_60%),radial-gradient(50%_50%_at_70%_80%,rgba(14,165,233,0.18),transparent_65%)]" />
            <div className="relative h-full p-10">
              <div className="text-xs font-black tracking-[0.28em] text-slate-500">
                TECH<span className="text-[--color-brand-600]">M4</span>SCHOOLS
              </div>
              <div className="mt-3 text-3xl font-black text-slate-900">Student OS</div>
              <div className="mt-2 text-sm text-slate-600">
                A production-style training platform with Supabase-first architecture, Admin panel, and mobile-first UI.
              </div>

              <div className="mt-8 space-y-3">
                {[
                  { title: "OTP login", desc: "Fast sign-in with email code." },
                  { title: "Admin controls", desc: "Roles and access governed by RLS." },
                  { title: "Certificates", desc: "Generate PDF certificate after completion." }
                ].map((x) => (
                  <div key={x.title} className="rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur">
                    <div className="text-sm font-extrabold text-slate-900">{x.title}</div>
                    <div className="mt-1 text-sm text-slate-600">{x.desc}</div>
                  </div>
                ))}
              </div>

              <div className="absolute bottom-8 left-10 right-10 text-xs text-slate-500">
                If you don’t have access, contact your admin to provision your account.
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 md:p-10">
            <div className="md:hidden">
              <div className="text-xs font-black tracking-[0.25em] text-slate-500">
                TECH<span className="text-[--color-brand-600]">M4</span>SCHOOLS
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">Student OS Login</div>
              <div className="mt-1 text-sm text-slate-500">Sign in with email OTP (recommended) or password.</div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <div className="text-xs font-bold text-slate-600">Email</div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@school.com"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              {step === "otp" && (
                <label className="block">
                  <div className="text-xs font-bold text-slate-600">OTP</div>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
              )}

              {step === "password" && (
                <label className="block">
                  <div className="text-xs font-bold text-slate-600">Password</div>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
              )}

              {msg && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 whitespace-pre-line">
                  <div className="font-bold text-slate-900">{msg}</div>
                  {troubleshooting && (
                    <div className="mt-2 text-xs text-slate-600 whitespace-pre-line">{troubleshooting}</div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {step !== "otp" ? (
                  <button
                    onClick={sendOtp}
                    disabled={busy}
                    className="w-full rounded-2xl bg-emerald-600 text-white font-extrabold py-3 shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {busy ? "Sending..." : "Send OTP"}
                  </button>
                ) : (
                  <button
                    onClick={verifyOtp}
                    disabled={busy}
                    className="w-full rounded-2xl bg-emerald-600 text-white font-extrabold py-3 shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {busy ? "Verifying..." : "Verify & Login"}
                  </button>
                )}

                {step !== "password" ? (
                  <button
                    onClick={() => setStep("password")}
                    className="w-full rounded-2xl border border-slate-200 bg-white font-extrabold py-3 text-slate-800 transition hover:bg-slate-50"
                  >
                    Use password instead
                  </button>
                ) : (
                  <button
                    onClick={signInPassword}
                    disabled={busy}
                    className="w-full rounded-2xl bg-slate-900 text-white font-extrabold py-3 shadow-sm transition hover:bg-slate-950 disabled:opacity-60"
                  >
                    {busy ? "Signing in..." : "Login with password"}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setPassword("");
                  }}
                  className="font-bold text-slate-600 hover:text-slate-900"
                >
                  Back
                </button>
                <button onClick={sendReset} className="font-bold text-emerald-700 hover:text-emerald-900">
                  Forgot password?
                </button>
              </div>

              <div className="text-xs text-slate-400">
                Admin can provision accounts in Supabase Auth. Google OAuth can be added later.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

