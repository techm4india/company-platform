import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AuthPage } from "./AuthPage";
import { ResetPasswordPage } from "./ResetPasswordPage";
import { Layout } from "./Layout";
import { RequireAuth, RequireRole } from "./Require";
import { useProfile } from "./useProfile";
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
      const { data } = await supabase.auth.getSession();
      if (alive) setSession(data.session ?? null);
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
            path="/"
            element={
              <div className="space-y-3">
                {profileLoading && <div className="text-sm text-slate-500">Loading profile…</div>}
                {profileErr && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{profileErr}</div>}
                {profile && <DashboardPage />}
              </div>
            }
          />

          <Route path="/live" element={<LiveClassPage />} />
          <Route path="/program" element={<ProgramPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/quizzes/:id" element={<TakeQuizPage />} />
          <Route path="/hackathon" element={<HackathonPage />} />
          <Route path="/kits" element={<KitsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/assistant" element={<AIAssistantPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route
            path="/admin"
            element={
              <RequireRole profile={profile} role="admin">
                <AdminHomePage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/students"
            element={
              <RequireRole profile={profile} role="admin">
                <StudentsAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <RequireRole profile={profile} role="admin">
                <PaymentsAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/content"
            element={
              <RequireRole profile={profile} role="admin">
                <ContentAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/assignments"
            element={
              <RequireRole profile={profile} role="admin">
                <AssignmentsAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/submissions"
            element={
              <RequireRole profile={profile} role="admin">
                <SubmissionsAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/hackathon"
            element={
              <RequireRole profile={profile} role="admin">
                <HackathonAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/kits"
            element={
              <RequireRole profile={profile} role="admin">
                <KitsAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <RequireRole profile={profile} role="admin">
                <BroadcastAdminPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <RequireRole profile={profile} role="admin">
                <AnalyticsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/performance"
            element={
              <RequireRole profile={profile} role="admin">
                <PerformanceAdminPage />
              </RequireRole>
            }
          />
        </Route>

        <Route path="*" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}

