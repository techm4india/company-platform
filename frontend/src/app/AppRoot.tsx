import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AuthPage } from "./AuthPage";
import { ResetPasswordPage } from "./ResetPasswordPage";
import { Layout } from "./Layout";
import { RequireAuth, RequireRole } from "./Require";
import { useProfile } from "./useProfile";
import { PublicHomePage } from "./PublicHomePage";
import { DemoAppPage } from "./DemoAppPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { LiveClassPage } from "../features/live/LiveClassPage";
import { ProgramPage } from "../features/program/ProgramPage";
import { AssignmentsPage } from "../features/assignments/AssignmentsPage";
import { QuizzesPage } from "../features/quizzes/QuizzesPage";
import { TakeQuizPage } from "../features/quizzes/TakeQuizPage";
import { HackathonPage } from "../features/hackathon/HackathonPage";
import { KitsPage } from "../features/kits/KitsPage";
import { PaymentsPage } from "../features/payments/PaymentsPage";
import { NotificationsPage } from "../features/notifications/NotificationsPage";
import { SupportPage } from "../features/support/SupportPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { AIAssistantPage } from "../features/assistant/AIAssistantPage";
import { LeaderboardPage } from "../features/gamification/LeaderboardPage";
import { AdminHomePage } from "../features/admin/AdminHomePage";
import { StudentsAdminPage } from "../features/admin/StudentsAdminPage";
import { PaymentsAdminPage } from "../features/admin/PaymentsAdminPage";
import { ContentAdminPage } from "../features/admin/ContentAdminPage";
import { AssignmentsAdminPage } from "../features/admin/AssignmentsAdminPage";
import { BroadcastAdminPage } from "../features/admin/BroadcastAdminPage";
import { AnalyticsPage } from "../features/admin/AnalyticsPage";
import { HackathonAdminPage } from "../features/admin/HackathonAdminPage";
import { KitsAdminPage } from "../features/admin/KitsAdminPage";
import { SubmissionsAdminPage } from "../features/admin/SubmissionsAdminPage";
import { PerformanceAdminPage } from "../features/admin/PerformanceAdminPage";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-2xl font-black text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-500">Module UI is scaffolded; data wiring will be completed after the Supabase SQL schema + RLS is applied.</div>
    </div>
  );
}

export default function AppRoot() {
  const [session, setSession] = useState<Session | null>(null);
  const { profile, loading: profileLoading, err: profileErr } = useProfile(session);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (alive) setSession(data.session ?? null);
      } catch {
        if (alive) setSession(null);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/demo" element={<DemoAppPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          element={
            <RequireAuth session={session}>
              {session && profile ? <Layout session={session} profile={profile} /> : null}
            </RequireAuth>
          }
        >
          <Route
            path="/app"
            element={
              <div className="space-y-3">
                {profileLoading && <div className="text-sm text-slate-500">Loading profile…</div>}
                {profileErr && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{profileErr}</div>}
                {profile && <DashboardPage />}
              </div>
            }
          />

          <Route path="/app/live" element={<LiveClassPage />} />
          <Route path="/app/program" element={<ProgramPage />} />
          <Route path="/app/assignments" element={<AssignmentsPage />} />
          <Route path="/app/quizzes" element={<QuizzesPage />} />
          <Route path="/app/quizzes/:id" element={<TakeQuizPage />} />
          <Route path="/app/hackathon" element={<HackathonPage />} />
          <Route path="/app/kits" element={<KitsPage />} />
          <Route path="/app/payments" element={<PaymentsPage />} />
          <Route path="/app/notifications" element={<NotificationsPage />} />
          <Route path="/app/leaderboard" element={<LeaderboardPage />} />
          <Route path="/app/assistant" element={<AIAssistantPage />} />
          <Route path="/app/support" element={<SupportPage />} />
          <Route path="/app/profile" element={<ProfilePage />} />

          <Route
            path="/app/admin"
            element={
              <RequireRole profile={profile} role="admin">
                <AdminHomePage />
              </RequireRole>
            }
          />
          <Route
            path="/app/admin/students"
            element={
              <RequireRole profile={profile} role="admin">
                <StudentsAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/app/admin/payments"
            element={
              <RequireRole profile={profile} role="admin">
                <PaymentsAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/app/admin/content"
            element={
              <RequireRole profile={profile} role="admin">
                <ContentAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/app/admin/assignments"
            element={
              <RequireRole profile={profile} role="admin">
                <AssignmentsAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/app/admin/submissions"
            element={
              <RequireRole profile={profile} role="admin">
                <SubmissionsAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/app/admin/hackathon"
            element={
              <RequireRole profile={profile} role="admin">
                <HackathonAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/app/admin/kits"
            element={
              <RequireRole profile={profile} role="admin">
                <KitsAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/app/admin/notifications"
            element={
              <RequireRole profile={profile} role="admin">
                <BroadcastAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/app/admin/analytics"
            element={
              <RequireRole profile={profile} role="admin">
                <AnalyticsPage />
              </RequireRole>
            }
          />
          <Route
            path="/app/admin/performance"
            element={
              <RequireRole profile={profile} role="admin">
                <PerformanceAdminPage />
              </RequireRole>
            }
          />
        </Route>

        <Route path="*" element={<PublicHomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

