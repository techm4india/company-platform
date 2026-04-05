import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Row = {
  id: string;
  full_name: string | null;
  email: string | null;
  points: number;
  level: number;
  streak: number;
};

export function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const r = await supabase
        .from("users")
        .select("id,full_name,email,points,level,streak")
        .order("points", { ascending: false })
        .order("streak", { ascending: false })
        .limit(100);
      if (r.error) throw r.error;
      setRows((r.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load leaderboard");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Leaderboard</div>
          <div className="text-sm text-slate-500">Points, streaks, and progression.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-auto">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[70px_1fr_120px_120px_120px] gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-black tracking-[0.18em] text-slate-500">
              <div>RANK</div>
              <div>STUDENT</div>
              <div>POINTS</div>
              <div>LEVEL</div>
              <div>STREAK</div>
            </div>
            {rows.map((u, i) => (
              <div key={u.id} className="grid grid-cols-[70px_1fr_120px_120px_120px] gap-2 px-4 py-3 border-b border-slate-100 items-center">
                <div className="font-mono font-black text-slate-900">{i + 1}</div>
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-900 truncate">{u.full_name || u.email || u.id}</div>
                  <div className="text-xs text-slate-500 truncate">{u.email ?? ""}</div>
                </div>
                <div className="font-mono font-black text-emerald-700">{u.points ?? 0}</div>
                <div className="font-mono font-black text-slate-900">{u.level ?? 1}</div>
                <div className="font-mono font-black text-slate-900">{u.streak ?? 0}</div>
              </div>
            ))}
            {rows.length === 0 && <div className="p-4 text-sm text-slate-500">No users yet.</div>}
          </div>
        </div>
      </Card>
    </div>
  );
}

