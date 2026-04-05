import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
  read_at: string | null;
  user_id: string | null;
};

export function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const n = await supabase
        .from("notifications")
        .select("id,type,title,body,link,created_at,read_at,user_id")
        .order("created_at", { ascending: false })
        .limit(50);
      if (n.error) throw n.error;
      setItems((n.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load notifications");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function markRead(id: string) {
    setErr("");
    try {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to mark read");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Notifications</div>
          <div className="text-sm text-slate-500">In-app reminders, announcements, class updates.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="space-y-2">
        {items.map((n) => (
          <Card key={n.id} className={n.read_at ? "opacity-80" : "border-emerald-200"}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-xs font-black tracking-[0.18em] text-slate-400">{n.user_id ? "PERSONAL" : "BROADCAST"} · {n.type.toUpperCase()}</div>
                <div className="mt-1 text-lg font-black text-slate-900">{n.title}</div>
                {n.body && <div className="mt-1 text-sm text-slate-600">{n.body}</div>}
                <div className="mt-2 text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</div>
                {n.link && <a className="mt-2 inline-block text-sm font-extrabold text-emerald-700" href={n.link}>Open link</a>}
              </div>
              <div className="flex items-center gap-2">
                {!n.read_at ? (
                  <Button variant="secondary" onClick={() => void markRead(n.id)}>Mark read</Button>
                ) : (
                  <span className="text-xs font-extrabold text-slate-500">Read</span>
                )}
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && <Card><div className="text-sm text-slate-500">No notifications yet.</div></Card>}
      </div>
    </div>
  );
}

