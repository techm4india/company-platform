import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Msg = { role: "user" | "assistant"; text: string };

function localFallback(prompt: string) {
  const p = prompt.toLowerCase();
  if (p.includes("assignment")) return "For assignments: read the prompt, break into steps, submit a PDF/image + short explanation. If you share your exact assignment title, I’ll suggest a plan.";
  if (p.includes("quiz")) return "For quizzes: focus on fundamentals, eliminate options, and manage time. Tell me the topic and I’ll generate practice questions.";
  if (p.includes("ai")) return "AI track tip: start with data → baseline model → evaluation → iterate. Tell me your dataset and goal.";
  if (p.includes("robot")) return "Robotics tip: verify wiring, power, then sensor readings via serial logs. What board/sensor are you using?";
  if (p.includes("drone")) return "Drone tip: safety first, calibration, and validate thrust-to-weight. What frame/FC are you using?";
  if (p.includes("full")) return "Full Stack tip: define API contracts, build UI states (loading/error), and use RLS-secured Supabase tables.";
  return "Tell me: your track, today’s day number, and what you’re stuck on. I’ll give a step-by-step fix.";
}

export function AIAssistantPage() {
  const [chat, setChat] = useState<Msg[]>([
    { role: "assistant", text: "Hi! Ask your doubt. I can guide you with steps, examples, and improvement suggestions." }
  ]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const canSend = useMemo(() => !!text.trim(), [text]);

  async function send() {
    const prompt = text.trim();
    if (!prompt) return;
    setText("");
    setChat((c) => [...c, { role: "user", text: prompt }]);
    setBusy(true);
    try {
      // Optional: Supabase Edge Function (recommended for production, keeps API keys server-side)
      const res = await supabase.functions.invoke("ai-chat", { body: { message: prompt } });
      if (res.error) throw res.error;
      const reply = (res.data as any)?.reply as string | undefined;
      setChat((c) => [...c, { role: "assistant", text: reply || localFallback(prompt) }]);
    } catch {
      setChat((c) => [...c, { role: "assistant", text: localFallback(prompt) }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-2xl font-black text-slate-900">AI Assistant</div>
        <div className="text-sm text-slate-500">Chatbot for doubts + learning improvement suggestions.</div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="max-h-[60vh] overflow-auto p-4 space-y-3 bg-slate-50">
          {chat.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={[
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium",
                  m.role === "user" ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-800"
                ].join(" ")}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 p-3 bg-white flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your doubt…"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") void send();
            }}
          />
          <Button disabled={!canSend || busy} onClick={send}>{busy ? "..." : "Send"}</Button>
        </div>
      </Card>
    </div>
  );
}

