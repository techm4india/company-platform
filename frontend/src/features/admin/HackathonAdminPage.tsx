import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Entry = {
  id: string;
  hackathon_id: string;
  user_id: string;
  team_name: string | null;
  title: string;
  description: string | null;
  repo_url: string | null;
  demo_url: string | null;
  score: number | null;
  feedback: string | null;
  published: boolean;
  submitted_at: string;
};

export function HackathonAdminPage() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setErr("");
    try {
      const r = await supabase
        .from("hackathon_entries")
        .select("id,hackathon_id,user_id,team_name,title,description,repo_url,demo_url,score,feedback,published,submitted_at")
        .order("submitted_at", { ascending: false })
        .limit(500);
      if (r.error) throw r.error;
      setRows((r.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load entries");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function review(id: string, patch: Partial<Entry>) {
    setErr("");
    setBusyId(id);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const adminId = auth.user?.id;
      if (!adminId) throw new Error("Not signed in");

      const { error } = await supabase.from("hackathon_entries").update({
        ...patch,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString()
      }).eq("id", id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Review failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Admin · Hackathon</div>
          <div className="text-sm text-slate-500">Evaluation panel + results leaderboard (scores saved per entry).</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="space-y-2">
        {rows.map((e) => (
          <Card key={e.id} className="p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="font-extrabold text-slate-900 truncate">{e.title}</div>
                <div className="mt-1 text-sm text-slate-600">{e.description ?? "—"}</div>
                <div className="mt-2 text-xs font-mono text-slate-500">
                  User: {e.user_id} · Team: {e.team_name ?? "—"} · {new Date(e.submitted_at).toLocaleString()}
                </div>
                <div className="mt-2 flex gap-3 flex-wrap">
                  {e.repo_url && <a className="text-sm font-extrabold text-emerald-700" href={e.repo_url} target="_blank" rel="noreferrer">Repo</a>}
                  {e.demo_url && <a className="text-sm font-extrabold text-emerald-700" href={e.demo_url} target="_blank" rel="noreferrer">Demo</a>}
                </div>
              </div>

              <div className="w-full sm:w-[420px] grid gap-2">
                <label className="flex items-center gap-2 text-sm font-extrabold text-slate-700">
                  <input
                    type="checkbox"
                    checked={!!e.published}
                    onChange={(ev) => void review(e.id, { published: ev.target.checked } as any)}
                    disabled={busyId === e.id}
                  />
                  Publish to leaderboard
                </label>
                <input
                  defaultValue={e.score ?? ""}
                  placeholder="Score"
                  type="number"
                  onBlur={(ev) => void review(e.id, { score: ev.target.value ? Number(ev.target.value) : null } as any)}
                  disabled={busyId === e.id}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <textarea
                  defaultValue={e.feedback ?? ""}
                  placeholder="Feedback"
                  onBlur={(ev) => void review(e.id, { feedback: ev.target.value.trim() || null } as any)}
                  disabled={busyId === e.id}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm min-h-[90px]"
                />
                <div className="text-xs text-slate-500">Auto-saved on blur.</div>
              </div>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <Card><div className="text-sm text-slate-500">No hackathon entries yet.</div></Card>}
      </div>
    </div>
  );
}

