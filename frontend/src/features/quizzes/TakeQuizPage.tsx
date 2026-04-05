import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Quiz = {
  id: string;
  title: string;
  duration_sec: number;
  is_published: boolean;
};

type Question = {
  id: string;
  quiz_id: string;
  prompt: string;
  options: string[];
  points: number;
  sort_order: number;
};

export function TakeQuizPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const quizId = id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [qs, setQs] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [status, setStatus] = useState<"loading" | "ready" | "submitting" | "submitted">("loading");
  const [score, setScore] = useState<number | null>(null);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    setStatus("loading");
    try {
      const q = await supabase.from("quizzes").select("id,title,duration_sec,is_published").eq("id", quizId).single();
      if (q.error) throw q.error;
      if (!q.data?.is_published) throw new Error("Quiz is not published");
      setQuiz(q.data as any);

      const qq = await supabase
        .from("quiz_questions_public")
        .select("id,quiz_id,prompt,options,points,sort_order")
        .eq("quiz_id", quizId)
        .order("sort_order", { ascending: true });
      if (qq.error) throw qq.error;
      const mapped = ((qq.data as any[]) ?? []).map((x) => ({ ...x, options: x.options as string[] })) as any;
      setQs(mapped);
      setSecondsLeft((q.data as any).duration_sec ?? 900);
      setStatus("ready");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load quiz");
      setStatus("ready");
    }
  }

  useEffect(() => {
    if (!quizId) return;
    void load();
  }, [quizId]);

  useEffect(() => {
    if (status !== "ready") return;
    if (secondsLeft <= 0) return;
    const t = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [status, secondsLeft]);

  useEffect(() => {
    if (status !== "ready") return;
    if (secondsLeft !== 0) return;
    void submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, status]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const totalPoints = useMemo(() => qs.reduce((a, q) => a + (q.points ?? 1), 0), [qs]);

  async function submit() {
    if (!quizId) return;
    setErr("");
    setStatus("submitting");
    try {
      const payload = qs.map((q) => ({
        question_id: q.id,
        selected_index: answers[q.id] ?? null
      }));
      const { data, error } = await supabase.rpc("submit_quiz_attempt", { p_quiz_id: quizId, p_answers: payload });
      if (error) throw error;
      setScore(Number(data ?? 0));
      setStatus("submitted");
    } catch (e: any) {
      setErr(e?.message ?? "Submit failed");
      setStatus("ready");
    }
  }

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">{quiz?.title || "Quiz"}</div>
          <div className="text-sm text-slate-500">Timer-based exam · auto evaluated on submit</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-700">
            ⏱ {mm}:{ss}
          </div>
          <Button variant="secondary" onClick={() => nav("/app/quizzes")}>Back</Button>
        </div>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      {status === "submitted" && (
        <Card className="border-emerald-200 bg-emerald-50">
          <div className="text-sm font-extrabold text-emerald-900">Submitted</div>
          <div className="mt-1 text-sm text-emerald-900/80">
            Score: <span className="font-black">{score ?? 0}</span> / {totalPoints}
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {qs.map((q, idx) => (
          <Card key={q.id} className="p-4">
            <div className="text-sm font-black text-slate-900">
              {idx + 1}. {q.prompt}
            </div>
            <div className="mt-3 grid gap-2">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  disabled={status !== "ready"}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                  className={[
                    "text-left rounded-xl border px-3 py-2 text-sm font-bold",
                    answers[q.id] === i ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 hover:bg-slate-50 text-slate-800",
                    status !== "ready" ? "opacity-70 cursor-not-allowed" : ""
                  ].join(" ")}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-slate-400">Points: {q.points}</div>
          </Card>
        ))}
        {qs.length === 0 && <Card><div className="text-sm text-slate-500">No questions found.</div></Card>}
      </div>

      <Card className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-slate-600">
          Answered <span className="font-black text-slate-900">{answeredCount}</span> / {qs.length}
        </div>
        <Button disabled={status !== "ready"} onClick={submit}>
          {status === "submitting" ? "Submitting..." : "Submit quiz"}
        </Button>
      </Card>
    </div>
  );
}

