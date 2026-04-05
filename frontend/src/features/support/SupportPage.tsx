import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Faq = { id: string; question: string; answer: string };
type Ticket = { id: string; subject: string; message: string; status: string; created_at: string };

export function SupportPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ subject: "", message: "" });

  async function load() {
    setErr("");
    try {
      const f = await supabase.from("faqs").select("id,question,answer").order("sort_order", { ascending: true });
      if (f.error) throw f.error;
      setFaqs((f.data as any) ?? []);

      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const t = await supabase.from("support_tickets").select("id,subject,message,status,created_at").eq("user_id", uid).order("created_at", { ascending: false });
      if (t.error) throw t.error;
      setTickets((t.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load support");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit() {
    setErr("");
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");
      if (!draft.subject.trim() || !draft.message.trim()) throw new Error("Subject and message are required");

      const { error } = await supabase.from("support_tickets").insert({
        user_id: uid,
        subject: draft.subject.trim(),
        message: draft.message.trim()
      });
      if (error) throw error;
      setDraft({ subject: "", message: "" });
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create ticket");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Support</div>
          <div className="text-sm text-slate-500">FAQ + contact support form.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="text-sm font-extrabold">FAQ</div>
          <div className="mt-3 space-y-2">
            {faqs.map((f) => (
              <div key={f.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="font-extrabold text-slate-900">{f.question}</div>
                <div className="mt-1 text-sm text-slate-600">{f.answer}</div>
              </div>
            ))}
            {faqs.length === 0 && <div className="text-sm text-slate-500">No FAQs yet.</div>}
          </div>
        </Card>

        <Card>
          <div className="text-sm font-extrabold">Contact support</div>
          <div className="mt-3 space-y-3">
            <label className="block">
              <div className="text-xs font-bold text-slate-600">Subject</div>
              <input value={draft.subject} onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500" />
            </label>
            <label className="block">
              <div className="text-xs font-bold text-slate-600">Message</div>
              <textarea value={draft.message} onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))} className="mt-1 w-full min-h-[120px] rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500" />
            </label>
            <Button disabled={busy || !draft.subject.trim() || !draft.message.trim()} onClick={submit} className="w-full">
              {busy ? "Sending..." : "Send"}
            </Button>
          </div>

          <div className="mt-6">
            <div className="text-sm font-extrabold">Your tickets</div>
            <div className="mt-2 space-y-2">
              {tickets.map((t) => (
                <div key={t.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-extrabold">{t.subject}</div>
                    <div className="text-xs font-black text-slate-600">{t.status}</div>
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{t.message}</div>
                  <div className="mt-2 text-xs text-slate-500">{new Date(t.created_at).toLocaleString()}</div>
                </div>
              ))}
              {tickets.length === 0 && <div className="text-sm text-slate-500">No tickets yet.</div>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

