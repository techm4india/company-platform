import { useEffect, useState } from "react";
import * as api from "../api";

export function UsersAdminPage({ user }: { user: api.User }) {
  const [err, setErr] = useState("");
  const [users, setUsers] = useState<any[]>([]);

  const [draft, setDraft] = useState({
    email: "",
    password: "TempPass_12345",
    name: "",
    grade: "Grade 9",
    track: "Coding" as api.Track,
    role: "student" as api.Role,
    school: "TechM4Schools",
    avatar: "",
    pin: ""
  });

  async function reload() {
    setErr("");
    try {
      const data = await api.adminListUsers();
      setUsers(data);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load users");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function create() {
    setErr("");
    try {
      await api.adminCreateUser({
        email: draft.email,
        password: draft.password,
        name: draft.name,
        grade: draft.grade,
        track: draft.track,
        role: draft.role,
        school: draft.school,
        avatar: draft.avatar || undefined,
        pin: draft.pin || undefined
      });
      setDraft((d) => ({ ...d, email: "", name: "", avatar: "", pin: "" }));
      await reload();
    } catch (e: any) {
      setErr(e?.message ?? "Create failed");
    }
  }

  if (user.role !== "admin") {
    return <div style={{ color: "#64748B" }}>Admins only.</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>👑 Admin · Users</div>
          <div style={{ fontSize: 13, color: "#64748B" }}>Create accounts and distribute credentials</div>
        </div>
        <button onClick={reload} style={{ background: "#EFF6FF", color: "#1D4ED8", border: "none", padding: "10px 14px", borderRadius: 12, fontWeight: 800, cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      {err && <div style={{ marginBottom: 12, background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: "10px 12px", borderRadius: 12 }}>{err}</div>}

      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Create user</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 140px 160px", gap: 10 }}>
          <input value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} placeholder="Email" style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
          <input value={draft.password} onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))} placeholder="Temp password" style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
          <select value={draft.role} onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value as api.Role }))} style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }}>
            {(["student", "mentor", "admin"] as const).map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={draft.track} onChange={(e) => setDraft((d) => ({ ...d, track: e.target.value as api.Track }))} style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }}>
            {(["Robotics", "Coding", "Drone", "AI", "Innovation"] as const).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Name" style={{ gridColumn: "1 / 3", padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
          <input value={draft.grade} onChange={(e) => setDraft((d) => ({ ...d, grade: e.target.value }))} placeholder="Grade" style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
          <input value={draft.school} onChange={(e) => setDraft((d) => ({ ...d, school: e.target.value }))} placeholder="School" style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
          <input value={draft.avatar} onChange={(e) => setDraft((d) => ({ ...d, avatar: e.target.value }))} placeholder="Avatar (optional)" style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
          <input value={draft.pin} onChange={(e) => setDraft((d) => ({ ...d, pin: e.target.value }))} placeholder="PIN (optional)" style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button disabled={!draft.email.trim() || !draft.name.trim()} onClick={create} style={{ background: "#10B981", opacity: (!draft.email.trim() || !draft.name.trim()) ? 0.5 : 1, color: "#fff", border: "none", borderRadius: 12, fontWeight: 900, padding: "10px 14px", cursor: "pointer" }}>
            Create
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontWeight: 900 }}>All users</div>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 120px 120px", padding: "10px 14px", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: 12, fontWeight: 800 }}>
          <div>Email</div><div>Name</div><div>Role</div><div>Track</div>
        </div>
        {users.map((u) => (
          <div key={u.id} style={{ display: "grid", gridTemplateColumns: "220px 1fr 120px 120px", padding: "10px 14px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ fontFamily: "monospace", fontSize: 12 }}>{u.email}</div>
            <div>{u.name}</div>
            <div style={{ fontWeight: 900 }}>{u.role}</div>
            <div>{u.track}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

