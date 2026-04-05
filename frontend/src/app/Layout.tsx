import { NavLink, Outlet } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { clsx } from "clsx";
import { supabase } from "../lib/supabase";
import type { Profile } from "./types";
import { useIsNarrow } from "../useIsNarrow";
import { useState } from "react";

const studentNav = [
  { to: "/app", label: "Dashboard", icon: "🏠" },
  { to: "/app/live", label: "Live Class", icon: "🎥" },
  { to: "/app/program", label: "Program", icon: "🗓️" },
  { to: "/app/assignments", label: "Assignments", icon: "📤" },
  { to: "/app/quizzes", label: "Quizzes", icon: "📝" },
  { to: "/app/hackathon", label: "Hackathon", icon: "🏁" },
  { to: "/app/kits", label: "Kit", icon: "📦" },
  { to: "/app/payments", label: "Payments", icon: "💳" },
  { to: "/app/notifications", label: "Notifications", icon: "🔔" },
  { to: "/app/leaderboard", label: "Leaderboard", icon: "🏆" },
  { to: "/app/assistant", label: "AI Assistant", icon: "🤖" },
  { to: "/app/support", label: "Support", icon: "🛟" },
  { to: "/app/profile", label: "Profile", icon: "👤" }
];

const adminNav = [
  { to: "/app/admin", label: "Admin Home", icon: "🛡️" },
  { to: "/app/admin/students", label: "Students", icon: "👥" },
  { to: "/app/admin/payments", label: "Payments", icon: "✅" },
  { to: "/app/admin/content", label: "Content", icon: "📚" },
  { to: "/app/admin/assignments", label: "Assignments", icon: "📌" },
  { to: "/app/admin/submissions", label: "Submissions", icon: "📨" },
  { to: "/app/admin/hackathon", label: "Hackathon", icon: "🏁" },
  { to: "/app/admin/kits", label: "Kits", icon: "📦" },
  { to: "/app/admin/notifications", label: "Broadcast", icon: "📣" },
  { to: "/app/admin/performance", label: "Performance", icon: "🧠" },
  { to: "/app/admin/analytics", label: "Analytics", icon: "📈" }
];

function SideNav({ profile, onNavigate }: { profile: Profile; onNavigate?: () => void }) {
  const items = profile.role === "admin" ? [...studentNav, ...adminNav] : studentNav;
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="text-[11px] font-black tracking-[0.25em] text-slate-500">
          TECH<span className="text-emerald-600">M4</span>SCHOOLS
        </div>
        <div className="mt-2 text-sm font-extrabold text-slate-900 truncate">
          {profile.full_name || "Student"}
        </div>
        <div className="mt-0.5 text-xs text-slate-500">
          {profile.role.toUpperCase()} {profile.school ? `· ${profile.school}` : ""}
        </div>
      </div>

      <nav className="flex-1 overflow-auto p-2">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold",
                isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "text-slate-700 hover:bg-slate-50"
              )
            }
          >
            <span className="text-lg">{it.icon}</span>
            <span className="truncate">{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <button
          onClick={() => void supabase.auth.signOut()}
          className="w-full rounded-xl border border-slate-200 bg-white py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export function Layout({ session, profile }: { session: Session; profile: Profile }) {
  const isNarrow = useIsNarrow(900);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-full bg-slate-50">
      {isNarrow && (
        <div className="fixed top-0 left-0 right-0 z-40 h-14 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-3">
          <button className="h-10 w-10 rounded-xl border border-slate-200 bg-white font-black" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            ☰
          </button>
          <div className="text-[11px] font-black tracking-[0.25em] text-slate-500">
            TECH<span className="text-emerald-600">M4</span>SCHOOLS
          </div>
          <div className="h-10 w-10 rounded-xl border border-slate-200 bg-white grid place-items-center font-black">
            {(profile.full_name || session.user.email || "U").slice(0, 1).toUpperCase()}
          </div>
        </div>
      )}

      <div className={clsx("mx-auto max-w-[1280px] flex", isNarrow ? "pt-14" : "")}>
        {!isNarrow && (
          <aside className="w-[280px] h-[100vh] sticky top-0 border-r border-slate-200 bg-white">
            <SideNav profile={profile} />
          </aside>
        )}

        <main className={clsx("flex-1 p-4 md:p-6", isNarrow ? "pb-24" : "")}>
          <Outlet />
        </main>
      </div>

      {isNarrow && drawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 p-3" role="presentation" onClick={() => setDrawerOpen(false)}>
          <div className="h-full max-w-[420px] w-full bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <SideNav profile={profile} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

