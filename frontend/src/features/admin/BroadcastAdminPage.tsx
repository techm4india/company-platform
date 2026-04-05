import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Notif = { id: string; title: string; type: string; created_at: string };

export function BroadcastAdminPage() {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [draft, setDraft] = useState({ type: "info", title: "", body: "", link: "" });

  async function load() {
    setErr("");
    try {
      const n = await supabase
        .from("notifications")
        .select("id,title,type,created_at")
        .is("user_id", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (n.error) throw n.error;
      setItems((n.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load broadcasts");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function send() {
    setErr("");
    setBusy(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: null,
        type: draft.type,
        title: draft.title.trim(),
        body: draft.body.trim() || null,
        link: draft.link.trim() || null
      });
      if (error) throw error;
      setDraft({ type: "info", title: "", body: "", link: "" });
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Admin · Broadcast</div>
          <div className="text-sm text-slate-500">Send announcements and class reminders.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <Card>
          <div className="text-sm font-extrabold">New broadcast</div>
          <div className="mt-3 grid gap-2">
            <select value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              {["info", "urgent", "reminder", "success"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Title" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <textarea value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} placeholder="Body" className="rounded-xl border border-slate-200 px-3 py-2 text-sm min-h-[100px]" />
            <input value={draft.link} onChange={(e) => setDraft((d) => ({ ...d, link: e.target.value }))} placeholder="Link (optional)" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <Button disabled={busy || !draft.title.trim()} onClick={send} className="w-full">{busy ? "Sending..." : "Send broadcast"}</Button>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-extrabold">Recent broadcasts</div>
          <div className="mt-3 space-y-2">
            {items.map((n) => (
              <div key={n.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="text-xs font-black tracking-[0.18em] text-slate-400">{n.type.toUpperCase()}</div>
                <div className="mt-1 font-extrabold text-slate-900">{n.title}</div>
                <div className="mt-1 text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            ))}
            {items.length === 0 && <div className="text-sm text-slate-500">No broadcasts.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

