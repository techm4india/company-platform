import { useEffect, useState } from "react";
import * as api from "../api";
import { useIsNarrow } from "../useIsNarrow";

export function ProfilePage({ user, onLogout }: { user: api.User; onLogout: () => void }) {
  const isNarrow = useIsNarrow();
  const [prog, setProg] = useState<{ currentDay: number; totalDays: number } | null>(null);
  const [today, setToday] = useState<any | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await api.getProgram();
        if (!alive) return;
        setProg({ currentDay: p.state.currentDay, totalDays: p.program.totalDays });
        try {
          const d = await api.getProgramDay(p.state.currentDay);
          if (alive) setToday(d);
        } catch {
          setToday(null);
        }
      } catch {
        setProg(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>👤 My Profile</div>
          <div style={{ fontSize: 13, color: "#64748B" }}>{user.school}</div>
        </div>
        <button
          onClick={async () => {
            await api.logout().catch(() => {});
            onLogout();
          }}
          style={{
            background: "#FEF2F2",
            color: "#B91C1C",
            border: "1px solid #FCA5A5",
            padding: "10px 14px",
            borderRadius: 12,
            fontWeight: 900,
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "320px 1fr", gap: 16, alignItems: "start" }}>
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "#10B981",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontFamily: "'DM Mono', monospace"
              }}
            >
              {user.avatar}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.name}
              </div>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                {user.role} · {user.track} · {user.grade}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 10, marginTop: 14 }}>
            {[
              { label: "XP", value: user.xp.toLocaleString(), color: "#F59E0B" },
              { label: "Level", value: String(user.level), color: "#10B981" },
              { label: "Streak", value: `${user.streak}`, color: "#EF4444" },
              { label: "Rank", value: `#${user.rank}`, color: "#7C3AED" }
            ].map((s) => (
              <div key={s.label} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 12 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900, fontSize: 12, color: "#64748B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              Badges
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(user.badges ?? []).length > 0 ? (
                user.badges.map((b, i) => (
                  <div key={i} style={{ width: 36, height: 36, borderRadius: 10, background: "#FFFBEB", border: "1px solid #FDE68A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {b}
                  </div>
                ))
              ) : (
                <div style={{ color: "#94A3B8", fontSize: 13 }}>No badges yet.</div>
              )}
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900, color: "#0F172A" }}>📘 Programme</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                {prog ? `Day ${prog.currentDay} of ${prog.totalDays}` : "Not loaded"}
              </div>
            </div>
          </div>

          {today ? (
            <div style={{ marginTop: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: 14 }}>
              <div style={{ fontWeight: 900, color: "#0F172A" }}>{today.topic}</div>
              <div style={{ fontSize: 13, color: "#334155", marginTop: 8 }}><strong>AI focus:</strong> {today.aiFocus}</div>
              <div style={{ fontSize: 13, color: "#334155", marginTop: 8 }}><strong>Kit experiment:</strong> {today.kitExperiment}</div>
              <div style={{ fontSize: 13, color: "#334155", marginTop: 8 }}><strong>Assignment:</strong> {today.dailyAssignment}</div>
            </div>
          ) : (
            <div style={{ marginTop: 12, color: "#94A3B8" }}>Today’s content will appear here.</div>
          )}
        </div>
      </div>
    </div>
  );
}

