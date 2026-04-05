export type Role = "admin" | "student";

export type Profile = {
  id: string; // auth.uid()
  role: Role;
  full_name: string | null;
  phone: string | null;
  track_id: string | null;
  grade: string | null;
  school: string | null;
  created_at: string;
};

