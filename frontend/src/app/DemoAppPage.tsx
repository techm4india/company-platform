import { Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

const sample = {
  live: { title: "Live Class: Day 7 · Servo & Sensors", time: "Today · 10:00 AM", mentor: "Mentor Team" },
  upcoming: [
    { title: "Day 8 · JS & DOM", time: "Tomorrow · 9:00 AM" },
    { title: "Day 9 · Drone Flight Basics", time: "Wed · 9:00 AM" },
    { title: "Day 10 · ML Basics", time: "Thu · 9:00 AM" }
  ],
  notifs: [
    { type: "info", title: "Demo Day registration opens soon", at: "Today" },
    { type: "urgent", title: "Submit Day 7 assignment before 6 PM", at: "2 hours ago" },
    { type: "success", title: "You earned the 🔥 Streak badge!", at: "Yesterday" }
  ]
};

export function DemoAppPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs font-black tracking-[0.28em] text-slate-500">
              TECH<span className="text-emerald-600">M4</span>SCHOOLS
            </div>
            <div className="mt-2 text-3xl font-black text-slate-900">Demo (No Login)</div>
            <div className="mt-1 text-sm text-slate-600">
              This is a UI-only demo so the website works even when Supabase isn’t configured yet.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-50">
              Home
            </Link>
            <Link to="/auth" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-emerald-700">
              Login
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm font-extrabold text-slate-900">Today’s class</div>
                <div className="mt-1 text-sm text-slate-600">{sample.live.title}</div>
                <div className="mt-1 text-xs text-slate-500">{sample.live.time} · {sample.live.mentor}</div>
              </div>
              <Button>Join / View</Button>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-extrabold text-slate-900">Progress</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="text-3xl font-black text-slate-900">48%</div>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-600" style={{ width: "48%" }} />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">Demo progress bar (static).</div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-extrabold text-slate-900">Upcoming sessions</div>
              <Button variant="secondary">Schedule</Button>
            </div>
            <div className="mt-3 space-y-2">
              {sample.upcoming.map((s) => (
                <div key={s.title} className="rounded-xl border border-slate-100 p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-extrabold truncate">{s.title}</div>
                    <div className="text-xs text-slate-500">{s.time}</div>
                  </div>
                  <span className="text-xs text-slate-400">—</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-extrabold text-slate-900">Notifications</div>
              <Button variant="secondary">Open (2)</Button>
            </div>
            <div className="mt-3 space-y-2">
              {sample.notifs.map((n) => (
                <div key={n.title} className="rounded-xl border border-slate-100 p-3">
                  <div className="text-xs font-black tracking-[0.18em] text-slate-400">{n.type.toUpperCase()}</div>
                  <div className="mt-1 font-extrabold text-slate-900">{n.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{n.at}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-extrabold text-slate-900">Want the real app?</div>
          <div className="mt-1 text-sm text-slate-600">
            Configure Supabase env vars on Vercel and use <span className="font-black">Login</span>.
          </div>
        </div>
      </div>
    </div>
  );
}

