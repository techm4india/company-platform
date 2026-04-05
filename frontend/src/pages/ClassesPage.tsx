import { useEffect, useMemo, useState } from "react";
import * as api from "../api";
import { useIsNarrow } from "../useIsNarrow";

type Track = api.Track | "All";
type ClassStatus = "done" | "live" | "upcoming";

type ClassSession = {
  id: string;
  day: number;
  title: string;
  track: Track;
  topic: string;
  time: string;
  mentor: string;
  status: ClassStatus;
  objectives: string[];
  materials: string[];
  recordingUrl?: string;
};

export function ClassesPage({ user }: { user: api.User }) {
  const isNarrow = useIsNarrow();
  const isStaff = user.role !== "student";
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [err, setErr] = useState<string>("");

  const [draft, setDraft] = useState({
    day: 1,
    title: "",
    track: "All" as Track,
    topic: "",
    time: "9:00 AM – 12:00 PM",
    mentor: user.name,
    status: "upcoming" as ClassStatus,
    objectives: "",
    materials: "",
    recordingUrl: ""
  });

  async function reload() {
    setErr("");
    try {
      const data = (await api.getClasses()) as any[];
      setClasses(data as any);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load classes");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const byDay = useMemo(() => [...classes].sort((a, b) => a.day - b.day), [classes]);

  async function create() {
    setErr("");
    try {
      await api.createClass({
        day: draft.day,
        title: draft.title,
        track: draft.track,
        topic: draft.topic,
        time: draft.time,
        mentor: draft.mentor,
        status: draft.status,
        objectives: draft.objectives.split("\n").map((s) => s.trim()).filter(Boolean),
        materials: draft.materials.split("\n").map((s) => s.trim()).filter(Boolean),
        recordingUrl: draft.recordingUrl.trim() || undefined
      });
      setDraft((d) => ({ ...d, title: "", topic: "", objectives: "", materials: "", recordingUrl: "" }));
      await reload();
    } catch (e: any) {
      setErr(e?.message ?? "Create failed");
    }
  }

  async function setStatus(id: string, status: ClassStatus) {
    setErr("");
    try {
      await api.updateClass(id, { status });
      await reload();
    } catch (e: any) {
      setErr(e?.message ?? "Update failed");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A" }}>📚 Classes</div>
          <div style={{ fontSize: 13, color: "#64748B" }}>
            {isStaff ? "Create and host classes (admin/mentor)" : "View schedule"}
          </div>
        </div>
        <button onClick={reload} style={{ background: "#EFF6FF", color: "#1D4ED8", border: "none", padding: "10px 14px", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      {err && <div style={{ marginBottom: 12, background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: "10px 12px", borderRadius: 12 }}>{err}</div>}

      {isStaff && (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>Create class</div>
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "120px 1fr 1fr", gap: 10 }}>
            <input value={draft.day} onChange={(e) => setDraft((d) => ({ ...d, day: Number(e.target.value) }))} type="number" min={1} style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
            <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Title" style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
            <select value={draft.track} onChange={(e) => setDraft((d) => ({ ...d, track: e.target.value as Track }))} style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }}>
              {["All", "Robotics", "Coding", "Drone", "AI", "Innovation"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input value={draft.topic} onChange={(e) => setDraft((d) => ({ ...d, topic: e.target.value }))} placeholder="Topic" style={{ gridColumn: "1 / -1", padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
            <input value={draft.time} onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))} placeholder="Time" style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
            <input value={draft.mentor} onChange={(e) => setDraft((d) => ({ ...d, mentor: e.target.value }))} placeholder="Mentor" style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
            <select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as ClassStatus }))} style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }}>
              {["upcoming", "live", "done"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <textarea value={draft.objectives} onChange={(e) => setDraft((d) => ({ ...d, objectives: e.target.value }))} placeholder={"Objectives (one per line)"} style={{ gridColumn: "1 / -1", padding: 10, border: "1px solid #E2E8F0", borderRadius: 10, minHeight: 80 }} />
            <textarea value={draft.materials} onChange={(e) => setDraft((d) => ({ ...d, materials: e.target.value }))} placeholder={"Materials (one per line)"} style={{ gridColumn: "1 / -1", padding: 10, border: "1px solid #E2E8F0", borderRadius: 10, minHeight: 80 }} />
            <input value={draft.recordingUrl} onChange={(e) => setDraft((d) => ({ ...d, recordingUrl: e.target.value }))} placeholder="Recording URL (optional)" style={{ gridColumn: "1 / -1", padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button onClick={create} style={{ background: "#10B981", color: "#fff", border: "none", padding: "10px 14px", borderRadius: 12, fontWeight: 800, cursor: "pointer" }}>
              Create
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {byDay.map((c) => (
          <div key={c.id} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 900, color: "#0F172A" }}>Day {c.day}: {c.title}</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>{c.track} · {c.time} · {c.mentor}</div>
                <div style={{ fontSize: 13, color: "#334155", marginTop: 6 }}>{c.topic}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontWeight: 900, color: c.status === "live" ? "#059669" : c.status === "done" ? "#64748B" : "#1D4ED8" }}>{c.status.toUpperCase()}</span>
                {isStaff && (
                  <select value={c.status} onChange={(e) => void setStatus(c.id, e.target.value as ClassStatus)} style={{ padding: 8, border: "1px solid #E2E8F0", borderRadius: 10 }}>
                    {["upcoming", "live", "done"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        ))}
        {byDay.length === 0 && <div style={{ color: "#64748B" }}>No classes yet.</div>}
      </div>
    </div>
  );
}

