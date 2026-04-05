import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { useNavigate } from "react-router-dom";

type SessionRow = { id: string; title: string; day: number | null; starts_at: string | null; is_live: boolean; youtube_live_url: string | null };
type Notif = { id: string; title: string; type: string; created_at: string; read_at: string | null };

export function DashboardPage() {
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const [live, setLive] = useState<SessionRow | null>(null);
  const [upcoming, setUpcoming] = useState<SessionRow[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [pct, setPct] = useState(0);

  async function load() {
    setErr("");
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;

      const liveRes = await supabase
        .from("class_sessions")
        .select("id,title,day,starts_at,is_live,youtube_live_url")
        .eq("is_live", true)
        .order("starts_at", { ascending: true })
        .limit(1);
      if (liveRes.error) throw liveRes.error;
      setLive((liveRes.data?.[0] as any) ?? null);

      const up = await supabase
        .from("class_sessions")
        .select("id,title,day,starts_at,is_live,youtube_live_url")
        .order("starts_at", { ascending: true })
        .limit(5);
      if (up.error) throw up.error;
      setUpcoming((up.data as any) ?? []);

      const days = await supabase.from("program_days").select("day", { count: "exact", head: true });
      if (days.error) throw days.error;
      const totalDays = days.count ?? 25;

      const pr = await supabase.from("progress").select("completion_percent").eq("user_id", uid);
      if (pr.error) throw pr.error;
      const sum = ((pr.data as any[]) ?? []).reduce((a, r) => a + Number(r.completion_percent ?? 0), 0);
      setPct(totalDays ? Math.round(sum / (totalDays * 100) * 100) : 0);

      const n = await supabase
        .from("notifications")
        .select("id,title,type,created_at,read_at")
        .order("created_at", { ascending: false })
        .limit(6);
      if (n.error) throw n.error;
      setNotifs((n.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load dashboard");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const unread = useMemo(() => notifs.filter((n) => !n.read_at).length, [notifs]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Dashboard</div>
          <div className="text-sm text-slate-500">Your daily operating system: class, progress, tasks, updates.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Today’s class</div>
              <div className="mt-1 text-sm text-slate-500">{live ? live.title : "No live class right now."}</div>
            </div>
            <Button onClick={() => nav("/live")}>Join / View</Button>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-extrabold text-slate-900">Progress</div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-3xl font-black text-slate-900">{pct}%</div>
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500">Completion is computed from `progress` across 25 program days.</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold text-slate-900">Upcoming sessions</div>
            <Button variant="secondary" onClick={() => nav("/live")}>Schedule</Button>
          </div>
          <div className="mt-3 space-y-2">
            {upcoming.map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-100 p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-extrabold truncate">{s.title}</div>
                  <div className="text-xs text-slate-500">{s.day ? `Day ${s.day}` : "—"} {s.starts_at ? `· ${new Date(s.starts_at).toLocaleString()}` : ""}</div>
                </div>
                {s.is_live ? <span className="text-xs font-black text-rose-600">LIVE</span> : <span className="text-xs text-slate-400">—</span>}
              </div>
            ))}
            {upcoming.length === 0 && <div className="text-sm text-slate-500">No sessions.</div>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold text-slate-900">Notifications</div>
            <Button variant="secondary" onClick={() => nav("/notifications")}>Open ({unread})</Button>
          </div>
          <div className="mt-3 space-y-2">
            {notifs.map((n) => (
              <div key={n.id} className="rounded-xl border border-slate-100 p-3">
                <div className="text-xs font-black tracking-[0.18em] text-slate-400">{n.type.toUpperCase()}</div>
                <div className="mt-1 font-extrabold text-slate-900">{n.title}</div>
                <div className="mt-1 text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            ))}
            {notifs.length === 0 && <div className="text-sm text-slate-500">No notifications.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

