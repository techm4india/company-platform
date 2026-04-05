import { useEffect, useMemo, useState } from "react";
import * as api from "../api";
import { useIsNarrow } from "../useIsNarrow";

type Row = {
  rank: number;
  name: string;
  track: api.Track;
  xp: number;
  streak: number;
  tasks: number;
  avatar: string;
  color: string;
  userId: string;
};

export function LeaderboardPage({ user }: { user: api.User }) {
  const isNarrow = useIsNarrow();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState("");
  const [sortBy, setSortBy] = useState<"xp" | "streak" | "tasks">("xp");

  async function reload() {
    setErr("");
    try {
      const data = (await api.getLeaderboard(sortBy)) as any[];
      const mapped = data.map((r) => ({ ...r, isMe: r.userId === user.id })) as any;
      setRows(mapped);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load leaderboard");
    }
  }

  useEffect(() => {
    void reload();
  }, [sortBy]);

  const sorted = useMemo(() => rows, [rows]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>🏆 Leaderboard</div>
          <div style={{ fontSize: 13, color: "#64748B" }}>Sorted by {sortBy}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["xp", "streak", "tasks"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: `1.5px solid ${sortBy === s ? "#10B981" : "#E2E8F0"}`,
                background: sortBy === s ? "#F0FDF4" : "#fff",
                color: sortBy === s ? "#059669" : "#64748B",
                fontWeight: 900,
                cursor: "pointer"
              }}
            >
              By {s.toUpperCase()}
            </button>
          ))}
          <button onClick={reload} style={{ padding: "8px 12px", borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", fontWeight: 900, cursor: "pointer" }}>
            Refresh
          </button>
        </div>
      </div>

      {err && <div style={{ marginBottom: 12, background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: "10px 12px", borderRadius: 12 }}>{err}</div>}

      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: isNarrow ? "auto" : "visible" }}>
          <div style={{ minWidth: isNarrow ? 560 : "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 120px 100px 90px", padding: "10px 14px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              {["Rank", "Student", "XP", "Streak", "Tasks"].map((h) => (
                <div key={h} style={{ fontSize: 12, fontWeight: 900, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
              ))}
            </div>
            {sorted.map((r) => (
              <div key={r.userId} style={{ display: "grid", gridTemplateColumns: "70px 1fr 120px 100px 90px", padding: "12px 14px", borderBottom: "1px solid #F1F5F9", background: r.userId === user.id ? "#F0FDF4" : "#fff", alignItems: "center" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 900 }}>{r.rank || "-"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: r.color || "#10B981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", fontWeight: 900 }}>
                    {r.avatar}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.name} {r.userId === user.id && <span style={{ marginLeft: 6, fontSize: 10, background: "#DCFCE7", color: "#059669", padding: "2px 6px", borderRadius: 8, fontWeight: 900 }}>YOU</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{r.track}</div>
                  </div>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 900, color: "#F59E0B" }}>{Number(r.xp ?? 0).toLocaleString()}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 900, color: "#EF4444" }}>{r.streak}🔥</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 900, color: "#10B981" }}>{r.tasks}</div>
              </div>
            ))}
            {sorted.length === 0 && <div style={{ padding: 16, color: "#94A3B8" }}>No leaderboard data yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

