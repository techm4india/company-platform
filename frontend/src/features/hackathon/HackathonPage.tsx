import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Hackathon = {
  id: string;
  name: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

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
  submitted_at: string;
};

export function HackathonPage() {
  const [items, setItems] = useState<Hackathon[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [leader, setLeader] = useState<Entry[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState({ team_name: "", title: "", description: "", repo_url: "", demo_url: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setErr("");
    try {
      const h = await supabase.from("hackathons").select("id,name,description,starts_at,ends_at").order("created_at", { ascending: false });
      if (h.error) throw h.error;
      setItems((h.data as any) ?? []);
      setActive((prev) => prev ?? (h.data?.[0] as any)?.id ?? null);

      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const e = await supabase
        .from("hackathon_entries")
        .select("id,hackathon_id,user_id,team_name,title,description,repo_url,demo_url,score,feedback,submitted_at")
        .eq("user_id", uid)
        .order("submitted_at", { ascending: false });
      if (e.error) throw e.error;
      setEntries((e.data as any) ?? []);

      if ((h.data as any[])?.[0]?.id) {
        const lid = (active ?? (h.data as any[])?.[0]?.id) as string;
        const lb = await supabase
          .from("hackathon_entries")
          .select("id,hackathon_id,user_id,team_name,title,description,repo_url,demo_url,score,feedback,submitted_at")
          .eq("hackathon_id", lid)
          .eq("published", true)
          .order("score", { ascending: false, nullsFirst: false })
          .limit(20);
        if (!lb.error) setLeader((lb.data as any) ?? []);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load hackathon");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const activeHackathon = useMemo(() => items.find((x) => x.id === active) ?? null, [items, active]);
  const myEntry = useMemo(() => entries.find((e) => e.hackathon_id === active) ?? null, [entries, active]);

  async function submit() {
    if (!activeHackathon) return;
    setErr("");
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");
      if (!draft.title.trim()) throw new Error("Title is required");

      const { error } = await supabase.from("hackathon_entries").insert({
        hackathon_id: activeHackathon.id,
        user_id: uid,
        team_name: draft.team_name.trim() || null,
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        repo_url: draft.repo_url.trim() || null,
        demo_url: draft.demo_url.trim() || null
      });
      if (error) throw error;
      setDraft({ team_name: "", title: "", description: "", repo_url: "", demo_url: "" });
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Hackathon</div>
          <div className="text-sm text-slate-500">Register/submit your project, then admins evaluate and publish results.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <Card>
          <div className="text-sm font-extrabold">Hackathons</div>
          <div className="mt-3 space-y-2">
            {items.map((h) => (
              <button
                key={h.id}
                onClick={() => setActive(h.id)}
                className={[
                  "w-full text-left rounded-2xl border px-4 py-3",
                  active === h.id ? "border-emerald-200 bg-emerald-50" : "border-slate-100 hover:bg-slate-50"
                ].join(" ")}
              >
                <div className="font-extrabold">{h.name}</div>
                <div className="text-sm text-slate-500">{h.description ?? "—"}</div>
                <div className="mt-2 text-xs text-slate-500">
                  {h.starts_at ? `Starts: ${new Date(h.starts_at).toLocaleString()}` : ""}
                  {h.ends_at ? ` · Ends: ${new Date(h.ends_at).toLocaleString()}` : ""}
                </div>
              </button>
            ))}
            {items.length === 0 && <div className="text-sm text-slate-500">No hackathons yet.</div>}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="text-sm font-extrabold">Results leaderboard</div>
            <div className="mt-2 text-sm text-slate-500">Top published entries for the selected hackathon.</div>
            <div className="mt-3 space-y-2">
              {leader.map((e, i) => (
                <div key={e.id} className="rounded-2xl border border-slate-100 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-extrabold truncate">{i + 1}. {e.title}</div>
                    <div className="text-xs text-slate-500 truncate">{e.team_name ?? "Solo"}</div>
                  </div>
                  <div className="font-mono font-black text-emerald-700">{e.score ?? 0}</div>
                </div>
              ))}
              {leader.length === 0 && <div className="text-sm text-slate-500">No published results yet.</div>}
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-extrabold">Project submission</div>
          <div className="mt-1 text-sm text-slate-500">{activeHackathon ? `For: ${activeHackathon.name}` : "Select a hackathon."}</div>

          {myEntry ? (
            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <div className="font-extrabold text-slate-900">{myEntry.title}</div>
              <div className="mt-1 text-sm text-slate-500">{myEntry.description ?? "—"}</div>
              <div className="mt-2 text-xs text-slate-500">Submitted: {new Date(myEntry.submitted_at).toLocaleString()}</div>
              <div className="mt-3 grid gap-2">
                {myEntry.repo_url && <a className="text-sm font-extrabold text-emerald-700" href={myEntry.repo_url} target="_blank" rel="noreferrer">Repository</a>}
                {myEntry.demo_url && <a className="text-sm font-extrabold text-emerald-700" href={myEntry.demo_url} target="_blank" rel="noreferrer">Demo</a>}
              </div>
              <div className="mt-3 text-sm">
                <span className="font-extrabold text-slate-700">Score:</span>{" "}
                <span className="font-black text-slate-900">{myEntry.score ?? "—"}</span>
              </div>
              {myEntry.feedback && <div className="mt-2 text-sm text-slate-600"><span className="font-extrabold">Feedback:</span> {myEntry.feedback}</div>}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <label className="block">
                <div className="text-xs font-bold text-slate-600">Team name (optional)</div>
                <input value={draft.team_name} onChange={(e) => setDraft((d) => ({ ...d, team_name: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500" />
              </label>
              <label className="block">
                <div className="text-xs font-bold text-slate-600">Project title</div>
                <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500" />
              </label>
              <label className="block">
                <div className="text-xs font-bold text-slate-600">Description</div>
                <textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} className="mt-1 w-full min-h-[100px] rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500" />
              </label>
              <label className="block">
                <div className="text-xs font-bold text-slate-600">Repo URL</div>
                <input value={draft.repo_url} onChange={(e) => setDraft((d) => ({ ...d, repo_url: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500" />
              </label>
              <label className="block">
                <div className="text-xs font-bold text-slate-600">Demo URL</div>
                <input value={draft.demo_url} onChange={(e) => setDraft((d) => ({ ...d, demo_url: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500" />
              </label>
              <Button disabled={!activeHackathon || busy} onClick={submit} className="w-full">
                {busy ? "Submitting..." : "Submit project"}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

