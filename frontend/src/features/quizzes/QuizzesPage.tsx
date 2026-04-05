import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Quiz = {
  id: string;
  title: string;
  duration_sec: number;
  starts_at: string | null;
  ends_at: string | null;
  is_published: boolean;
  day: number | null;
};

type Attempt = {
  quiz_id: string;
  status: string;
  score: number;
  started_at: string;
  finished_at: string | null;
};

export function QuizzesPage() {
  const nav = useNavigate();
  const [items, setItems] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const q = await supabase
        .from("quizzes")
        .select("id,title,duration_sec,starts_at,ends_at,is_published,day")
        .order("day", { ascending: true });
      if (q.error) throw q.error;
      setItems(((q.data as any[]) ?? []).filter((x) => x.is_published) as any);

      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const a = await supabase
        .from("quiz_attempts")
        .select("quiz_id,status,score,started_at,finished_at")
        .eq("user_id", uid);
      if (a.error) throw a.error;
      setAttempts((a.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load quizzes");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const attemptByQuiz = useMemo(() => {
    const m = new Map<string, Attempt>();
    for (const a of attempts) m.set(a.quiz_id, a);
    return m;
  }, [attempts]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Quizzes / Exams</div>
          <div className="text-sm text-slate-500">MCQs, timer, auto-evaluation, results.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="grid gap-3">
        {items.map((q) => {
          const a = attemptByQuiz.get(q.id);
          return (
            <Card key={q.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-xs font-black tracking-[0.18em] text-slate-400">{q.day ? `DAY ${q.day}` : "QUIZ"}</div>
                  <div className="mt-1 text-lg font-black text-slate-900 truncate">{q.title}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Duration: {Math.round(q.duration_sec / 60)} min
                    {q.starts_at ? ` · Starts: ${new Date(q.starts_at).toLocaleString()}` : ""}
                    {q.ends_at ? ` · Ends: ${new Date(q.ends_at).toLocaleString()}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a ? (
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-slate-700">{a.status}</div>
                      {a.status === "submitted" && <div className="text-xs font-black text-emerald-700">Score: {a.score}</div>}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">Not attempted</div>
                  )}
                  <Button onClick={() => nav(`/quizzes/${q.id}`)}>
                    {a?.status === "submitted" ? "View" : "Start"}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
        {items.length === 0 && <Card><div className="text-sm text-slate-500">No published quizzes yet.</div></Card>}
      </div>
    </div>
  );
}

