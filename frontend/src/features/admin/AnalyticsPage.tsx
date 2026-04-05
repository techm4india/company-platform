import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

export function AnalyticsPage() {
  const [overview, setOverview] = useState<any | null>(null);
  const [top, setTop] = useState<any[]>([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const o = await supabase.from("analytics_overview").select("*").single();
      if (o.error) throw o.error;
      setOverview(o.data);

      const t = await supabase.from("users").select("id,full_name,email,points,track_id").order("points", { ascending: false }).limit(10);
      if (t.error) throw t.error;
      setTop((t.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load analytics");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Admin · Analytics</div>
          <div className="text-sm text-slate-500">Engagement, completion rate, activity signals.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          ["Total users", overview?.total_users],
          ["Active (15m)", overview?.active_users_15m],
          ["Avg completion", overview ? `${Math.round(Number(overview.avg_completion_rate) * 100)}%` : null],
          ["Submissions", overview?.total_submissions],
          ["Approved payments", overview?.approved_payments]
        ].map(([k, v]) => (
          <Card key={String(k)} className="p-4">
            <div className="text-xs font-black tracking-[0.18em] text-slate-400">{String(k).toUpperCase()}</div>
            <div className="mt-1 text-3xl font-black text-slate-900">{v ?? "—"}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="text-sm font-extrabold">Top students (by points)</div>
        <div className="mt-3 space-y-2">
          {top.map((u, i) => (
            <div key={u.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3">
              <div className="min-w-0">
                <div className="font-extrabold truncate">{i + 1}. {u.full_name || u.email || u.id}</div>
                <div className="text-xs text-slate-500 truncate">{u.email ?? ""}</div>
              </div>
              <div className="font-mono font-black text-emerald-700">{u.points ?? 0}</div>
            </div>
          ))}
          {top.length === 0 && <div className="text-sm text-slate-500">No data yet.</div>}
        </div>
      </Card>
    </div>
  );
}

