import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type ClassSession = {
  id: string;
  day: number | null;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  youtube_live_url: string | null;
  youtube_recorded_url: string | null;
  is_live: boolean;
};

export function LiveClassPage() {
  const [live, setLive] = useState<ClassSession | null>(null);
  const [upcoming, setUpcoming] = useState<ClassSession[]>([]);
  const [err, setErr] = useState("");

  async function reload() {
    setErr("");
    try {
      const liveRes = await supabase
        .from("class_sessions")
        .select("id,day,title,starts_at,ends_at,youtube_live_url,youtube_recorded_url,is_live")
        .eq("is_live", true)
        .order("starts_at", { ascending: true })
        .limit(1);
      if (liveRes.error) throw liveRes.error;
      setLive((liveRes.data?.[0] as any) ?? null);

      const upRes = await supabase
        .from("class_sessions")
        .select("id,day,title,starts_at,ends_at,youtube_live_url,youtube_recorded_url,is_live")
        .order("starts_at", { ascending: true })
        .limit(10);
      if (upRes.error) throw upRes.error;
      setUpcoming((upRes.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load class sessions");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const embedUrl = useMemo(() => {
    return (
      live?.youtube_live_url ||
      import.meta.env.VITE_YT_LIVE_EMBED_URL ||
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  }, [live]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Live Class</div>
          <div className="text-sm text-slate-500">Join the live stream, view schedule, and play recordings.</div>
        </div>
        <Button variant="secondary" onClick={reload}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="text-sm font-extrabold">Now Live</div>
            <div className="text-xs text-slate-500">{live ? live.title : "No session is marked live right now."}</div>
          </div>
          <a href={embedUrl} target="_blank" rel="noreferrer" className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900">
            Open in YouTube
          </a>
        </div>
        <div className="aspect-video bg-slate-900">
          <iframe
            title="YouTube Live"
            src={embedUrl}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-sm font-extrabold">Schedule</div>
          <div className="mt-3 space-y-2">
            {upcoming.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3">
                <div className="min-w-0">
                  <div className="font-extrabold truncate">
                    {s.title} {s.is_live ? <span className="ml-2 text-xs text-rose-600">LIVE</span> : null}
                  </div>
                  <div className="text-xs text-slate-500">
                    {s.day ? `Day ${s.day}` : "Day —"} {s.starts_at ? `· ${new Date(s.starts_at).toLocaleString()}` : ""}
                  </div>
                </div>
                {s.youtube_recorded_url ? (
                  <a className="text-xs font-extrabold text-slate-700 hover:text-slate-900" href={s.youtube_recorded_url} target="_blank" rel="noreferrer">
                    Recording
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            ))}
            {upcoming.length === 0 && <div className="text-sm text-slate-500">No sessions yet.</div>}
          </div>
        </Card>

        <Card>
          <div className="text-sm font-extrabold">Recorded Playback</div>
          <div className="mt-2 text-sm text-slate-500">
            Recordings are attached to each session. Admins can manage them in Admin → Content.
          </div>
        </Card>
      </div>
    </div>
  );
}

