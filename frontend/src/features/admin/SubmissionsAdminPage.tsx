import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Assignment = { id: string; title: string; day: number };
type Submission = {
  id: string;
  assignment_id: string;
  user_id: string;
  status: string;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  file_paths: any;
  text_answer: string | null;
};

export function SubmissionsAdminPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setErr("");
    try {
      const a = await supabase.from("assignments").select("id,title,day").order("day", { ascending: true }).limit(500);
      if (a.error) throw a.error;
      setAssignments((a.data as any) ?? []);

      const s = await supabase
        .from("submissions")
        .select("id,assignment_id,user_id,status,score,feedback,submitted_at,file_paths,text_answer")
        .order("submitted_at", { ascending: false })
        .limit(500);
      if (s.error) throw s.error;
      setSubs((s.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load submissions");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const assignmentById = useMemo(() => new Map(assignments.map((a) => [a.id, a])), [assignments]);

  async function updateSub(id: string, patch: Partial<Submission>) {
    setErr("");
    setBusyId(id);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const adminId = auth.user?.id;
      if (!adminId) throw new Error("Not signed in");

      const { error } = await supabase.from("submissions").update({
        ...patch,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq("id", id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function openFirstFile(s: Submission) {
    const paths = Array.isArray(s.file_paths) ? (s.file_paths as string[]) : [];
    const path = paths[0];
    if (!path) return;
    const { data, error } = await supabase.storage.from("assignment-uploads").createSignedUrl(path, 60);
    if (error) return;
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Admin · Submissions</div>
          <div className="text-sm text-slate-500">Review daily submissions, score and give feedback.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="space-y-2">
        {subs.map((s) => {
          const a = assignmentById.get(s.assignment_id);
          return (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-xs font-black tracking-[0.18em] text-slate-400">
                    {a ? `DAY ${a.day}` : "ASSIGNMENT"} · {a?.title ?? s.assignment_id}
                  </div>
                  <div className="mt-1 text-xs font-mono text-slate-500">Student: {s.user_id}</div>
                  <div className="mt-1 text-xs text-slate-500">{new Date(s.submitted_at).toLocaleString()}</div>
                  {s.text_answer && <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{s.text_answer}</div>}
                </div>

                <div className="w-full sm:w-[420px] grid gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={s.status}
                      disabled={busyId === s.id}
                      onChange={(e) => void updateSub(s.id, { status: e.target.value })}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
                    >
                      {["draft", "submitted", "reviewed", "approved", "needs_revision"].map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <Button variant="secondary" onClick={() => void openFirstFile(s)}>View file</Button>
                  </div>

                  <input
                    defaultValue={s.score ?? ""}
                    placeholder="Score"
                    type="number"
                    onBlur={(e) => void updateSub(s.id, { score: e.target.value ? Number(e.target.value) : null } as any)}
                    disabled={busyId === s.id}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <textarea
                    defaultValue={s.feedback ?? ""}
                    placeholder="Feedback"
                    onBlur={(e) => void updateSub(s.id, { feedback: e.target.value.trim() || null } as any)}
                    disabled={busyId === s.id}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm min-h-[90px]"
                  />
                  <div className="text-xs text-slate-500">Auto-saves on blur.</div>
                </div>
              </div>
            </Card>
          );
        })}
        {subs.length === 0 && <Card><div className="text-sm text-slate-500">No submissions yet.</div></Card>}
      </div>
    </div>
  );
}

