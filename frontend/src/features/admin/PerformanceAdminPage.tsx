import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Row = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  points: number;
  level: number;
  streak: number;
  avg_quiz_score: number;
  quizzes_submitted: number;
  assignments_submitted: number;
  avg_progress_percent: number;
};

export function PerformanceAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const r = await supabase
        .from("student_performance_insights")
        .select("*")
        .order("avg_progress_percent", { ascending: true })
        .limit(500);
      if (r.error) throw r.error;
      setRows((r.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load performance insights");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Admin · Performance Insights</div>
          <div className="text-sm text-slate-500">Weak-area detection signals: progress %, quiz score, submissions volume.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-auto">
          <div className="min-w-[1060px]">
            <div className="grid grid-cols-[260px_1fr_120px_120px_140px_140px_160px] gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-black tracking-[0.18em] text-slate-500">
              <div>EMAIL</div>
              <div>NAME</div>
              <div>PROGRESS</div>
              <div>QUIZ AVG</div>
              <div>QUIZZES</div>
              <div>SUBMISSIONS</div>
              <div>POINTS</div>
            </div>
            {rows.map((u) => (
              <div key={u.user_id} className="grid grid-cols-[260px_1fr_120px_120px_140px_140px_160px] gap-2 px-4 py-3 border-b border-slate-100 items-center">
                <div className="text-xs font-mono text-slate-700 truncate">{u.email ?? "—"}</div>
                <div className="font-bold truncate">{u.full_name ?? "—"}</div>
                <div className="font-mono font-black">{Math.round(Number(u.avg_progress_percent ?? 0))}%</div>
                <div className="font-mono font-black">{Number(u.avg_quiz_score ?? 0)}</div>
                <div className="font-mono font-black">{u.quizzes_submitted ?? 0}</div>
                <div className="font-mono font-black">{u.assignments_submitted ?? 0}</div>
                <div className="font-mono font-black text-emerald-700">{u.points ?? 0}</div>
              </div>
            ))}
            {rows.length === 0 && <div className="p-4 text-sm text-slate-500">No data yet.</div>}
          </div>
        </div>
      </Card>
    </div>
  );
}

