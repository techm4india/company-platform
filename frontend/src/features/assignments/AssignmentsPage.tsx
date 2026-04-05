import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Assignment = {
  id: string;
  day: number;
  track_id: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  allow_file_upload: boolean;
  allow_text: boolean;
  max_points: number;
};

type Submission = {
  id: string;
  assignment_id: string;
  status: string;
  submitted_at: string;
  score: number | null;
  feedback: string | null;
  file_paths: any;
  text_answer: string | null;
};

export function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    setErr("");
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;

      const me = await supabase.from("users").select("track_id").eq("id", uid).single();
      if (me.error) throw me.error;
      const trackId = (me.data as any)?.track_id as string | null;

      const a = await supabase
        .from("assignments")
        .select("id,day,track_id,title,description,due_at,allow_file_upload,allow_text,max_points")
        .order("day", { ascending: true });
      if (a.error) throw a.error;

      const filtered = (a.data as any[]).filter((x) => !x.track_id || x.track_id === trackId);
      setAssignments(filtered as any);

      const s = await supabase
        .from("submissions")
        .select("id,assignment_id,status,submitted_at,score,feedback,file_paths,text_answer")
        .eq("user_id", uid);
      if (s.error) throw s.error;
      setSubs((s.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load assignments");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const byAssignment = useMemo(() => {
    const m = new Map<string, Submission>();
    for (const s of subs) m.set(s.assignment_id, s);
    return m;
  }, [subs]);

  const active = useMemo(() => assignments.find((a) => a.id === activeId) ?? null, [assignments, activeId]);

  async function submit() {
    if (!active) return;
    setErr("");
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");

      const paths: string[] = [];
      if (active.allow_file_upload && file) {
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${uid}/${active.id}/${Date.now()}_${safeName}`;
        const up = await supabase.storage.from("assignment-uploads").upload(path, file, {
          cacheControl: "3600",
          upsert: false
        });
        if (up.error) throw up.error;
        paths.push(path);
      }

      const { error } = await supabase.from("submissions").upsert({
        assignment_id: active.id,
        user_id: uid,
        text_answer: active.allow_text ? (textAnswer.trim() || null) : null,
        file_paths: paths.length ? paths : null,
        status: "submitted",
        submitted_at: new Date().toISOString()
      });
      if (error) throw error;

      setFile(null);
      setTextAnswer("");
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
          <div className="text-2xl font-black text-slate-900">Assignments</div>
          <div className="text-sm text-slate-500">Daily assignments with upload (PDF/Image) + submission tracking.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <Card>
          <div className="text-sm font-extrabold">Your assignments</div>
          <div className="mt-3 space-y-2">
            {assignments.map((a) => {
              const s = byAssignment.get(a.id);
              const isActive = a.id === activeId;
              return (
                <button
                  key={a.id}
                  onClick={() => setActiveId(a.id)}
                  className={[
                    "w-full text-left rounded-2xl border px-4 py-3",
                    isActive ? "border-emerald-200 bg-emerald-50" : "border-slate-100 hover:bg-slate-50"
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-black tracking-[0.18em] text-slate-400">DAY {a.day}</div>
                      <div className="mt-1 font-extrabold text-slate-900 truncate">{a.title}</div>
                      {a.description && <div className="mt-1 text-sm text-slate-500 line-clamp-2">{a.description}</div>}
                      <div className="mt-2 text-xs text-slate-500">
                        {a.due_at ? `Due: ${new Date(a.due_at).toLocaleString()}` : "No deadline"}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs font-extrabold text-slate-700">{s ? s.status : "not submitted"}</div>
                      {s?.score != null && <div className="text-xs text-emerald-700 font-black">{s.score}/{a.max_points}</div>}
                    </div>
                  </div>
                </button>
              );
            })}
            {assignments.length === 0 && <div className="text-sm text-slate-500">No assignments yet. Admins can create assignments in Admin → Assignments.</div>}
          </div>
        </Card>

        <Card>
          <div className="text-sm font-extrabold">Submit</div>
          <div className="mt-1 text-sm text-slate-500">{active ? `Selected: ${active.title}` : "Select an assignment to submit."}</div>

          <div className="mt-4 space-y-3">
            {active?.allow_text && (
              <label className="block">
                <div className="text-xs font-bold text-slate-600">Text answer (optional)</div>
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  className="mt-1 w-full min-h-[120px] rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                  placeholder="Explain your work, links, notes…"
                />
              </label>
            )}

            {active?.allow_file_upload && (
              <label className="block">
                <div className="text-xs font-bold text-slate-600">Upload file (PDF/Image)</div>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-sm"
                />
                <div className="mt-1 text-xs text-slate-400">
                  Files are stored privately in Supabase Storage bucket `assignment-uploads`.
                </div>
              </label>
            )}

            <Button disabled={!active || busy} onClick={submit} className="w-full">
              {busy ? "Submitting..." : "Submit assignment"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

