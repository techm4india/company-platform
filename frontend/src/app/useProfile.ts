import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile } from "./types";

export function useProfile(session: Session | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!session?.user?.id) {
        setProfile(null);
        setErr("");
        return;
      }
      setLoading(true);
      setErr("");
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (error) throw error;
        if (!alive) return;
        setProfile(data as any);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load profile");
        setProfile(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [session?.user?.id]);

  return { profile, loading, err };
}

