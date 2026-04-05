import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Assignment = { id: string; day: number; title: string; due_at: string | null; track_id: string | null };
type Track = { id: string; name: string };

export function AssignmentsAdminPage() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [draft, setDraft] = useState({
    day: "1",
    title: "",
    description: "",
    due_at: "",
    track_id: "",
    max_points: "100"
  });

  async function load() {
    setErr("");
    try {
      const t = await supabase.from("tracks").select("id,name").order("name", { ascending: true });
      if (t.error) throw t.error;
      setTracks((t.data as any) ?? []);

      const a = await supabase.from("assignments").select("id,day,title,due_at,track_id").order("day", { ascending: true }).limit(200);
      if (a.error) throw a.error;
      setItems((a.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load assignments");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    setErr("");
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase.from("assignments").insert({
        day: Number(draft.day) || 1,
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        due_at: draft.due_at.trim() ? new Date(draft.due_at).toISOString() : null,
        track_id: draft.track_id || null,
        max_points: Number(draft.max_points) || 100,
        created_by: uid
      });
      if (error) throw error;
      setDraft((d) => ({ ...d, title: "", description: "" }));
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Admin · Assignments</div>
          <div className="text-sm text-slate-500">Create and manage daily assignments.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <Card>
          <div className="text-sm font-extrabold">Create assignment</div>
          <div className="mt-3 grid gap-2">
            <input value={draft.day} onChange={(e) => setDraft((d) => ({ ...d, day: e.target.value }))} placeholder="Day (1..25)" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Title" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} placeholder="Description" className="rounded-xl border border-slate-200 px-3 py-2 text-sm min-h-[90px]" />
            <input value={draft.due_at} onChange={(e) => setDraft((d) => ({ ...d, due_at: e.target.value }))} placeholder="Due date/time (e.g. 2026-04-01 17:00)" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <select value={draft.track_id} onChange={(e) => setDraft((d) => ({ ...d, track_id: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">All tracks</option>
              {tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input value={draft.max_points} onChange={(e) => setDraft((d) => ({ ...d, max_points: e.target.value }))} placeholder="Max points" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <Button disabled={busy || !draft.title.trim()} onClick={create} className="w-full">{busy ? "Creating..." : "Create"}</Button>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-extrabold">Existing</div>
          <div className="mt-3 space-y-2">
            {items.map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="text-xs font-black tracking-[0.18em] text-slate-400">DAY {a.day}</div>
                <div className="mt-1 font-extrabold text-slate-900">{a.title}</div>
                <div className="mt-1 text-xs text-slate-500">{a.due_at ? `Due: ${new Date(a.due_at).toLocaleString()}` : "No deadline"}</div>
              </div>
            ))}
            {items.length === 0 && <div className="text-sm text-slate-500">No assignments.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

