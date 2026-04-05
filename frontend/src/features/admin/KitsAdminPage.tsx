import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Row = {
  id: string;
  user_id: string;
  status: string;
  courier: string | null;
  tracking_number: string | null;
  updated_at: string;
  address: any;
};

export function KitsAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setErr("");
    try {
      const r = await supabase
        .from("kits")
        .select("id,user_id,status,courier,tracking_number,updated_at,address")
        .order("updated_at", { ascending: false })
        .limit(500);
      if (r.error) throw r.error;
      setRows((r.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load kits");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateKit(id: string, patch: Partial<Row>) {
    setErr("");
    setBusyId(id);
    try {
      const { error } = await supabase.from("kits").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Admin · Kits</div>
          <div className="text-sm text-slate-500">Dispatch tracking and delivery status updates.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="space-y-2">
        {rows.map((k) => (
          <Card key={k.id} className="p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-xs font-mono text-slate-500 truncate">User: {k.user_id}</div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">Status: {k.status}</div>
                <div className="mt-2 text-xs text-slate-600">
                  Address: {k.address?.line1 ?? "—"}, {k.address?.city ?? ""} {k.address?.state ?? ""} {k.address?.pincode ?? ""}
                </div>
              </div>
              <div className="grid gap-2 w-full sm:w-[420px]">
                <select
                  value={k.status}
                  disabled={busyId === k.id}
                  onChange={(e) => void updateKit(k.id, { status: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
                >
                  {["pending_address", "pending_dispatch", "dispatched", "delivered", "issue"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input
                  defaultValue={k.courier ?? ""}
                  placeholder="Courier"
                  onBlur={(e) => void updateKit(k.id, { courier: e.target.value.trim() || null })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  defaultValue={k.tracking_number ?? ""}
                  placeholder="Tracking number"
                  onBlur={(e) => void updateKit(k.id, { tracking_number: e.target.value.trim() || null })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <Card><div className="text-sm text-slate-500">No kit requests yet.</div></Card>}
      </div>
    </div>
  );
}

