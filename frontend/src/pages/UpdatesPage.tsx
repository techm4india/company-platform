import { useEffect, useState } from "react";
import * as api from "../api";
import { UsersAdminPage } from "./UsersAdminPage";

type Announcement = {
  id: string;
  type: "urgent" | "info" | "event" | "achievement";
  title: string;
  body: string;
  date: string;
  pinned: boolean;
};

export function UpdatesPage({ user }: { user: api.User }) {
  const isStaff = user.role !== "student";
  const [items, setItems] = useState<Announcement[]>([]);
  const [err, setErr] = useState("");

  const [draft, setDraft] = useState({
    type: "info" as Announcement["type"],
    title: "",
    body: "",
    date: "Today",
    pinned: false
  });

  async function reload() {
    setErr("");
    try {
      const data = (await api.getAnnouncements()) as any[];
      setItems(data as any);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load announcements");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function create() {
    setErr("");
    try {
      await api.createAnnouncement(draft);
      setDraft({ type: "info", title: "", body: "", date: "Today", pinned: false });
      await reload();
    } catch (e: any) {
      setErr(e?.message ?? "Create failed");
    }
  }

  async function togglePin(a: Announcement) {
    setErr("");
    try {
      await api.updateAnnouncement(a.id, { pinned: !a.pinned });
      await reload();
    } catch (e: any) {
      setErr(e?.message ?? "Update failed");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>📣 Updates</div>
          <div style={{ fontSize: 13, color: "#64748B" }}>{isStaff ? "Create announcements (admin/mentor)" : "Read announcements"}</div>
        </div>
        <button onClick={reload} style={{ background: "#EFF6FF", color: "#1D4ED8", border: "none", padding: "10px 14px", borderRadius: 12, fontWeight: 900, cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      {err && <div style={{ marginBottom: 12, background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: "10px 12px", borderRadius: 12 }}>{err}</div>}

      {isStaff && (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>New announcement</div>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10 }}>
            <select value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as any }))} style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }}>
              {(["urgent", "info", "event", "achievement"] as const).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Title" style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
            <textarea value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} placeholder="Body" style={{ gridColumn: "1 / -1", padding: 10, border: "1px solid #E2E8F0", borderRadius: 10, minHeight: 80 }} />
            <input value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} placeholder="Date label (e.g., Today · 9:00 AM)" style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#334155", fontWeight: 800 }}>
              <input type="checkbox" checked={draft.pinned} onChange={(e) => setDraft((d) => ({ ...d, pinned: e.target.checked }))} />
              Pinned
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button disabled={!draft.title.trim() || !draft.body.trim()} onClick={create} style={{ background: "#10B981", opacity: (!draft.title.trim() || !draft.body.trim()) ? 0.5 : 1, color: "#fff", border: "none", padding: "10px 14px", borderRadius: 12, fontWeight: 900, cursor: "pointer" }}>
              Publish
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 16 }}>
        {items.map((a) => (
          <div key={a.id} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 900, color: "#0F172A" }}>
                  {a.title} {a.pinned && <span style={{ marginLeft: 6, fontSize: 12, color: "#EF4444" }}>📌</span>}
                </div>
                <div style={{ fontSize: 12, color: "#64748B" }}>{a.type.toUpperCase()} · {a.date}</div>
              </div>
              {isStaff && (
                <button onClick={() => void togglePin(a)} style={{ background: a.pinned ? "#FEF2F2" : "#F8FAFC", border: "1px solid #E2E8F0", padding: "8px 10px", borderRadius: 12, fontWeight: 900, cursor: "pointer" }}>
                  {a.pinned ? "Unpin" : "Pin"}
                </button>
              )}
            </div>
            <div style={{ marginTop: 10, color: "#334155", fontSize: 13, lineHeight: 1.6 }}>{a.body}</div>
          </div>
        ))}
        {items.length === 0 && <div style={{ color: "#94A3B8" }}>No updates yet.</div>}
      </div>

      {user.role === "admin" && <UsersAdminPage user={user} />}
    </div>
  );
}

