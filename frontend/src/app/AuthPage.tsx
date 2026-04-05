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
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[--radius-card] border border-slate-200 bg-white shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="text-xs font-black tracking-[0.25em] text-slate-500">
            TECH<span className="text-[--color-brand-600]">M4</span>SCHOOLS
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">Student OS Login</div>
          <div className="mt-1 text-sm text-slate-500">Sign in with email OTP (recommended) or password.</div>
        </div>

        <div className="p-6 space-y-4">
          <label className="block">
            <div className="text-xs font-bold text-slate-600">Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@school.com"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
            />
          </label>

          {step === "otp" && (
            <label className="block">
              <div className="text-xs font-bold text-slate-600">OTP</div>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
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
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
              />
            </label>
          )}

          {msg && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {msg}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {step !== "otp" ? (
              <button
                onClick={sendOtp}
                disabled={busy}
                className="w-full rounded-xl bg-emerald-600 text-white font-extrabold py-2.5 disabled:opacity-60"
              >
                {busy ? "Sending..." : "Send OTP"}
              </button>
            ) : (
              <button
                onClick={verifyOtp}
                disabled={busy}
                className="w-full rounded-xl bg-emerald-600 text-white font-extrabold py-2.5 disabled:opacity-60"
              >
                {busy ? "Verifying..." : "Verify & Login"}
              </button>
            )}

            {step !== "password" ? (
              <button
                onClick={() => setStep("password")}
                className="w-full rounded-xl border border-slate-200 bg-white font-extrabold py-2.5 text-slate-700"
              >
                Use password instead
              </button>
            ) : (
              <button
                onClick={signInPassword}
                disabled={busy}
                className="w-full rounded-xl bg-slate-900 text-white font-extrabold py-2.5 disabled:opacity-60"
              >
                {busy ? "Signing in..." : "Login with password"}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <button onClick={() => { setStep("email"); setOtp(""); setPassword(""); }} className="font-bold text-slate-600 hover:text-slate-900">
              Back
            </button>
            <button onClick={sendReset} className="font-bold text-emerald-700 hover:text-emerald-900">
              Forgot password?
            </button>
          </div>

          <div className="text-xs text-slate-400">
            Admins can promote roles from the Admin panel after first login (RLS-controlled).
          </div>
        </div>
      </div>
    </div>
  );
}

