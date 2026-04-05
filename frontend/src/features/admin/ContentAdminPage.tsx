import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Day = { day: number; title: string; topic: string; summary: string | null; youtube_recorded_url: string | null };
type Session = { id: string; title: string; day: number | null; starts_at: string | null; youtube_live_url: string | null; youtube_recorded_url: string | null; is_live: boolean };

export function ContentAdminPage() {
  const [days, setDays] = useState<Day[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [newSession, setNewSession] = useState({ title: "", day: "1", youtube_live_url: "", youtube_recorded_url: "" });

  async function load() {
    setErr("");
    try {
      const d = await supabase.from("program_days").select("day,title,topic,summary,youtube_recorded_url").order("day", { ascending: true });
      if (d.error) throw d.error;
      setDays((d.data as any) ?? []);

      const s = await supabase
        .from("class_sessions")
        .select("id,title,day,starts_at,youtube_live_url,youtube_recorded_url,is_live")
        .order("starts_at", { ascending: true });
      if (s.error) throw s.error;
      setSessions((s.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load content");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateDay(day: number, patch: Partial<Day>) {
    setErr("");
    setBusy(true);
    try {
      const { error } = await supabase.from("program_days").update({ ...patch, updated_at: new Date().toISOString() }).eq("day", day);
      if (error) throw error;
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function updateSession(id: string, patch: Partial<Session>) {
    setErr("");
    setBusy(true);
    try {
      const { error } = await supabase.from("class_sessions").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function createSession() {
    setErr("");
    setBusy(true);
    try {
      const { error } = await supabase.from("class_sessions").insert({
        title: newSession.title.trim(),
        day: Number(newSession.day) || null,
        youtube_live_url: newSession.youtube_live_url.trim() || null,
        youtube_recorded_url: newSession.youtube_recorded_url.trim() || null,
        is_live: false
      });
      if (error) throw error;
      setNewSession({ title: "", day: "1", youtube_live_url: "", youtube_recorded_url: "" });
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Admin · Content</div>
          <div className="text-sm text-slate-500">Manage 25-day program days and class sessions (YouTube live + recordings).</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="text-sm font-extrabold">Program days</div>
          <div className="mt-3 space-y-2">
            {days.map((d) => (
              <div key={d.day} className="rounded-2xl border border-slate-100 p-4">
                <div className="text-xs font-black tracking-[0.18em] text-slate-400">DAY {d.day}</div>
                <div className="mt-1 font-extrabold text-slate-900">{d.title}</div>
                <div className="text-sm text-slate-600">{d.topic}</div>
                <label className="block mt-3">
                  <div className="text-xs font-bold text-slate-600">Recording URL</div>
                  <input
                    defaultValue={d.youtube_recorded_url ?? ""}
                    onBlur={(e) => void updateDay(d.day, { youtube_recorded_url: e.target.value.trim() || null })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
            ))}
            {days.length === 0 && <div className="text-sm text-slate-500">No program days. Run `supabase/seed.sql`.</div>}
          </div>
        </Card>

        <Card>
          <div className="text-sm font-extrabold">Class sessions</div>
          <div className="mt-3 space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-extrabold text-slate-900 truncate">{s.title}</div>
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!s.is_live}
                      onChange={(e) => void updateSession(s.id, { is_live: e.target.checked })}
                      disabled={busy}
                    />
                    LIVE
                  </label>
                </div>
                <div className="mt-1 text-xs text-slate-500">{s.day ? `Day ${s.day}` : "Day —"}</div>
                <div className="mt-3 grid gap-2">
                  <input
                    defaultValue={s.youtube_live_url ?? ""}
                    onBlur={(e) => void updateSession(s.id, { youtube_live_url: e.target.value.trim() || null })}
                    placeholder="YouTube Live embed URL"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    defaultValue={s.youtube_recorded_url ?? ""}
                    onBlur={(e) => void updateSession(s.id, { youtube_recorded_url: e.target.value.trim() || null })}
                    placeholder="Recording URL"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ))}
            {sessions.length === 0 && <div className="text-sm text-slate-500">No sessions yet.</div>}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="text-sm font-extrabold">Create session</div>
            <div className="mt-3 grid gap-2">
              <input value={newSession.title} onChange={(e) => setNewSession((d) => ({ ...d, title: e.target.value }))} placeholder="Title" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <input value={newSession.day} onChange={(e) => setNewSession((d) => ({ ...d, day: e.target.value }))} placeholder="Day" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <input value={newSession.youtube_live_url} onChange={(e) => setNewSession((d) => ({ ...d, youtube_live_url: e.target.value }))} placeholder="YouTube Live embed URL" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <input value={newSession.youtube_recorded_url} onChange={(e) => setNewSession((d) => ({ ...d, youtube_recorded_url: e.target.value }))} placeholder="Recording URL" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <Button disabled={busy || !newSession.title.trim()} onClick={createSession} className="w-full">{busy ? "Saving..." : "Create"}</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

