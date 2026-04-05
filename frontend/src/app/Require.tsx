import { Navigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import type { Profile, Role } from "./types";

export function RequireAuth({ session, children }: { session: Session | null; children: React.ReactNode }) {
  if (!session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function RequireRole({ profile, role, children }: { profile: Profile | null; role: Role; children: React.ReactNode }) {
  if (!profile) return null;
  if (profile.role !== role) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

