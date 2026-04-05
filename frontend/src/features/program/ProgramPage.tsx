import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type ProgramDay = {
  day: number;
  title: string;
  topic: string;
  summary: string | null;
  youtube_recorded_url: string | null;
};

type ProgressRow = {
  day: number;
  completion_percent: number;
  completed_at: string | null;
};

export function ProgramPage() {
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [err, setErr] = useState("");
  const [busyDay, setBusyDay] = useState<number | null>(null);

  async function load() {
    setErr("");
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;

      const d = await supabase
        .from("program_days")
        .select("day,title,topic,summary,youtube_recorded_url")
        .order("day", { ascending: true });
      if (d.error) throw d.error;
      setDays((d.data as any) ?? []);

      const p = await supabase
        .from("progress")
        .select("day,completion_percent,completed_at")
        .eq("user_id", uid);
      if (p.error) throw p.error;
      setProgress((p.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load program");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const progressByDay = useMemo(() => {
    const m = new Map<number, ProgressRow>();
    for (const r of progress) m.set(r.day, r);
    return m;
  }, [progress]);

  const pct = useMemo(() => {
    if (days.length === 0) return 0;
    const sum = days.reduce((acc, d) => acc + (progressByDay.get(d.day)?.completion_percent ?? 0), 0);
    return Math.round(sum / (days.length * 100) * 100);
  }, [days, progressByDay]);

  async function markComplete(day: number) {
    setErr("");
    setBusyDay(day);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");

      const { error } = await supabase
        .from("progress")
        .upsert({
          user_id: uid,
          day,
          completion_percent: 100,
          completed_at: new Date().toISOString()
        });
      if (error) throw error;
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update progress");
    } finally {
      setBusyDay(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Program (25 days)</div>
          <div className="text-sm text-slate-500">Day-wise modules, topic breakdown, completion tracking.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <Card>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-extrabold">Overall progress</div>
            <div className="text-xs text-slate-500">{pct}% complete</div>
          </div>
          <div className="w-full sm:w-[360px] h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-emerald-600" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </Card>

      <div className="grid gap-3">
        {days.map((d) => {
          const pr = progressByDay.get(d.day);
          const done = (pr?.completion_percent ?? 0) >= 100;
          return (
            <Card key={d.day} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-xs font-black tracking-[0.18em] text-slate-400">DAY {d.day}</div>
                  <div className="mt-1 text-lg font-black text-slate-900 truncate">{d.title}</div>
                  <div className="text-sm font-bold text-slate-700">{d.topic}</div>
                  {d.summary && <div className="mt-1 text-sm text-slate-500">{d.summary}</div>}
                  {d.youtube_recorded_url && (
                    <a className="mt-2 inline-block text-sm font-extrabold text-emerald-700 hover:text-emerald-900" href={d.youtube_recorded_url} target="_blank" rel="noreferrer">
                      Watch recording
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={done ? "text-xs font-extrabold text-emerald-700" : "text-xs font-extrabold text-slate-500"}>
                    {done ? "Completed" : `${pr?.completion_percent ?? 0}%`}
                  </span>
                  <Button disabled={busyDay === d.day} onClick={() => markComplete(d.day)}>
                    {busyDay === d.day ? "Saving..." : done ? "Mark again" : "Mark complete"}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
        {days.length === 0 && <Card><div className="text-sm text-slate-500">No program days yet. Admins can seed 25 days via `supabase/seed.sql`.</div></Card>}
      </div>
    </div>
  );
}

