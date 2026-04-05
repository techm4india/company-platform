import { Link } from "react-router-dom";

export function PublicHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs font-black tracking-[0.28em] text-slate-500">
            TECH<span className="text-emerald-600">M4</span>SCHOOLS
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/demo"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-emerald-700"
            >
              Open Demo (No Login)
            </Link>
            <Link
              to="/auth"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-50"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              Student OS for{" "}
              <span className="text-emerald-700">20,000+</span> learners.
            </h1>
            <p className="mt-4 text-slate-600 text-lg">
              A production-style training platform with Supabase-first architecture, Admin panel, assignments, quizzes, gamification, and certificates.
            </p>

            <div className="mt-6 flex gap-3 flex-wrap">
              <Link
                to="/demo"
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-950"
              >
                Enter Demo Experience
              </Link>
              <Link
                to="/auth"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-800 hover:bg-slate-50"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-6 text-xs text-slate-500">
              If Supabase isn’t configured yet, use the demo page above — it works without any backend.
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_30px_120px_rgba(2,6,23,0.12)] overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="text-sm font-extrabold text-slate-900">What you get</div>
              <div className="mt-1 text-sm text-slate-600">Premium UI + scalable architecture.</div>
            </div>
            <div className="p-6 grid gap-3">
              {[
                { t: "Live classes", d: "YouTube Live embed + schedule + recordings" },
                { t: "Assignments", d: "Upload PDF/Image + submissions workflow" },
                { t: "Quizzes", d: "Timer exams + RPC grading" },
                { t: "Admin panel", d: "Students, content, payments, broadcast" },
                { t: "Certificates", d: "Generate & download PDF certificate" }
              ].map((x) => (
                <div key={x.t} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-extrabold text-slate-900">{x.t}</div>
                  <div className="mt-1 text-sm text-slate-600">{x.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-extrabold text-slate-900">Deployment status</div>
          <div className="mt-2 text-sm text-slate-600">
            If you see login errors like <span className="font-black">“Failed to fetch”</span>, it’s a Supabase configuration issue (env vars / URL config).
            The <span className="font-black">Demo (No Login)</span> page will still work.
          </div>
        </div>
      </div>
    </div>
  );
}

