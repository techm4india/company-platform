import { useEffect, useMemo, useState } from "react";
import * as api from "../api";
import { useIsNarrow } from "../useIsNarrow";

type SubmissionStatus = "pending" | "reviewed" | "approved" | "needs-revision";
type SubmissionType = "code" | "assembly" | "project" | "quiz";

type Submission = {
  id: string;
  studentId: string;
  studentName: string;
  track: api.Track;
  title: string;
  type: SubmissionType;
  submittedAt: string;
  status: SubmissionStatus;
  score?: number;
  feedback?: string;
  fileType: string;
  xpAwarded?: number;
};

export function SubmissionsPage({ user }: { user: api.User }) {
  const isNarrow = useIsNarrow();
  const isStaff = user.role !== "student";
  const [subs, setSubs] = useState<Submission[]>([]);
  const [err, setErr] = useState<string>("");
  const [filter, setFilter] = useState<SubmissionStatus | "all">("all");

  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<SubmissionType>("code");
  const [newFileType, setNewFileType] = useState("Arduino (.ino)");

  async function reload() {
    setErr("");
    try {
      const data = (await api.getSubmissions()) as any[];
      setSubs(data as any);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load submissions");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const shown = useMemo(() => {
    const base = filter === "all" ? subs : subs.filter((s) => s.status === filter);
    return base;
  }, [subs, filter]);

  async function createSubmission() {
    setErr("");
    try {
      await api.createSubmission({ title: newTitle, type: newType, fileType: newFileType });
      setNewTitle("");
      await reload();
    } catch (e: any) {
      setErr(e?.message ?? "Submit failed");
    }
  }

  async function review(id: string, status: SubmissionStatus, score?: number, feedback?: string, xpAwarded?: number) {
    setErr("");
    try {
      await api.reviewSubmission(id, { status: status as any, score, feedback, xpAwarded });
      await reload();
    } catch (e: any) {
      setErr(e?.message ?? "Review failed");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A" }}>📤 Submissions</div>
          <div style={{ fontSize: 13, color: "#64748B" }}>
            {isStaff ? "Review everyone’s submissions (admin/mentor)" : "Submit your assignments"}
          </div>
        </div>
        <button onClick={reload} style={{ background: "#EFF6FF", color: "#1D4ED8", border: "none", padding: "10px 14px", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      {err && <div style={{ marginBottom: 12, background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: "10px 12px", borderRadius: 12 }}>{err}</div>}

      {!isStaff && (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>New submission</div>
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 180px 200px", gap: 10 }}>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Title" style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
            <select value={newType} onChange={(e) => setNewType(e.target.value as SubmissionType)} style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }}>
              {["code", "assembly", "project", "quiz"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input value={newFileType} onChange={(e) => setNewFileType(e.target.value)} placeholder="File type (e.g., PDF)" style={{ padding: 10, border: "1px solid #E2E8F0", borderRadius: 10 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button disabled={!newTitle.trim()} onClick={createSubmission} style={{ background: "#10B981", opacity: newTitle.trim() ? 1 : 0.5, color: "#fff", border: "none", padding: "10px 14px", borderRadius: 12, fontWeight: 900, cursor: "pointer" }}>
              Submit
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {(["all", "pending", "approved", "needs-revision", "reviewed"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: `1.5px solid ${filter === f ? "#10B981" : "#E2E8F0"}`,
            background: filter === f ? "#F0FDF4" : "#fff",
            color: filter === f ? "#059669" : "#64748B",
            fontWeight: filter === f ? 900 : 600,
            cursor: "pointer"
          }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {shown.map((s) => (
          <div key={s.id} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ minWidth: 240 }}>
                <div style={{ fontWeight: 900, color: "#0F172A" }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>
                  {s.type} · {s.fileType} · {new Date(s.submittedAt).toLocaleString()}
                </div>
                {isStaff && <div style={{ fontSize: 12, color: "#334155", marginTop: 6 }}><strong>Student:</strong> {s.studentName}</div>}
                {s.feedback && <div style={{ marginTop: 8, fontSize: 13, background: "#F8FAFC", borderLeft: "3px solid #10B981", padding: "8px 10px", borderRadius: "0 10px 10px 0" }}>
                  <strong>Feedback:</strong> {s.feedback}
                </div>}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontWeight: 900, color: s.status === "approved" ? "#059669" : s.status === "pending" ? "#B45309" : s.status === "needs-revision" ? "#DC2626" : "#1D4ED8" }}>
                  {s.status}
                </span>
              </div>
            </div>

            {isStaff && (
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "180px 120px 1fr 140px 140px", gap: 8 }}>
                <select defaultValue={s.status} onChange={(e) => void review(s.id, e.target.value as SubmissionStatus)} style={{ padding: 8, border: "1px solid #E2E8F0", borderRadius: 10 }}>
                  {(["pending", "reviewed", "approved", "needs-revision"] as const).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <input type="number" defaultValue={s.score ?? ""} placeholder="Score" onBlur={(e) => {
                  const v = e.target.value ? Number(e.target.value) : undefined;
                  void review(s.id, s.status, v, s.feedback, s.xpAwarded);
                }} style={{ padding: 8, border: "1px solid #E2E8F0", borderRadius: 10 }} />
                <input defaultValue={s.feedback ?? ""} placeholder="Feedback" onBlur={(e) => void review(s.id, s.status, s.score, e.target.value || undefined, s.xpAwarded)} style={{ padding: 8, border: "1px solid #E2E8F0", borderRadius: 10 }} />
                <input type="number" defaultValue={s.xpAwarded ?? ""} placeholder="XP" onBlur={(e) => {
                  const v = e.target.value ? Number(e.target.value) : undefined;
                  void review(s.id, s.status, s.score, s.feedback, v);
                }} style={{ padding: 8, border: "1px solid #E2E8F0", borderRadius: 10 }} />
                <button onClick={() => void review(s.id, "approved", s.score ?? 100, s.feedback ?? "Good job!", (s.xpAwarded ?? 100))} style={{ background: "#10B981", color: "#fff", border: "none", borderRadius: 12, fontWeight: 900, cursor: "pointer" }}>
                  Quick approve
                </button>
              </div>
            )}
          </div>
        ))}
        {shown.length === 0 && <div style={{ color: "#64748B" }}>No submissions.</div>}
      </div>
    </div>
  );
}

