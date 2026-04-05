import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Overview = {
  total_users: number;
  active_users_15m: number;
  avg_completion_rate: number;
  total_submissions: number;
  approved_payments: number;
};

export function AdminHomePage() {
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const r = await supabase.from("analytics_overview").select("*").single();
      if (r.error) throw r.error;
      setData(r.data as any);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load analytics");
      setData(null);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Admin Panel</div>
          <div className="text-sm text-slate-500">Operational overview and controls for 20,000+ students.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Total users", value: data?.total_users ?? "—" },
          { label: "Active (15m)", value: data?.active_users_15m ?? "—" },
          { label: "Avg completion", value: data ? `${Math.round(Number(data.avg_completion_rate) * 100)}%` : "—" },
          { label: "Submissions", value: data?.total_submissions ?? "—" },
          { label: "Approved payments", value: data?.approved_payments ?? "—" }
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-xs font-black tracking-[0.18em] text-slate-400">{k.label.toUpperCase()}</div>
            <div className="mt-1 text-3xl font-black text-slate-900">{k.value as any}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

