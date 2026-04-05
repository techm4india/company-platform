import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Track = { id: string; name: string };
type Row = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "student";
  track_id: string | null;
  grade: string | null;
  school: string | null;
  points: number;
  level: number;
  streak: number;
};

export function StudentsAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setErr("");
    try {
      const t = await supabase.from("tracks").select("id,name").order("name", { ascending: true });
      if (t.error) throw t.error;
      setTracks((t.data as any) ?? []);

      const r = await supabase
        .from("users")
        .select("id,email,full_name,role,track_id,grade,school,points,level,streak")
        .order("created_at", { ascending: false })
        .limit(500);
      if (r.error) throw r.error;
      setRows((r.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load students");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateUser(id: string, patch: Partial<Row>) {
    setErr("");
    setBusyId(id);
    try {
      const { error } = await supabase.from("users").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
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
          <div className="text-2xl font-black text-slate-900">Admin · Students</div>
          <div className="text-sm text-slate-500">View all students, assign tracks, promote roles.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[260px_1fr_120px_220px_120px_120px_120px] gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-black tracking-[0.18em] text-slate-500">
              <div>EMAIL</div>
              <div>NAME</div>
              <div>ROLE</div>
              <div>TRACK</div>
              <div>POINTS</div>
              <div>LEVEL</div>
              <div>STREAK</div>
            </div>

            {rows.map((u) => (
              <div key={u.id} className="grid grid-cols-[260px_1fr_120px_220px_120px_120px_120px] gap-2 px-4 py-3 border-b border-slate-100 items-center">
                <div className="text-xs font-mono text-slate-700 truncate">{u.email ?? "—"}</div>
                <div className="font-bold text-slate-900 truncate">{u.full_name ?? "—"}</div>
                <select
                  value={u.role}
                  disabled={busyId === u.id}
                  onChange={(e) => void updateUser(u.id, { role: e.target.value as any })}
                  className="rounded-xl border border-slate-200 px-2 py-1 text-sm font-bold"
                >
                  <option value="student">student</option>
                  <option value="admin">admin</option>
                </select>
                <select
                  value={u.track_id ?? ""}
                  disabled={busyId === u.id}
                  onChange={(e) => void updateUser(u.id, { track_id: e.target.value || null })}
                  className="rounded-xl border border-slate-200 px-2 py-1 text-sm font-bold"
                >
                  <option value="">(none)</option>
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="font-mono font-black text-slate-900">{u.points}</div>
                <div className="font-mono font-black text-slate-900">{u.level}</div>
                <div className="font-mono font-black text-slate-900">{u.streak}</div>
              </div>
            ))}

            {rows.length === 0 && <div className="p-4 text-sm text-slate-500">No users.</div>}
          </div>
        </div>
      </Card>
    </div>
  );
}

