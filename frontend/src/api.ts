export type Role = "student" | "mentor" | "admin";
export type Track = "Robotics" | "Coding" | "Drone" | "AI" | "Innovation";

export type User = {
  id: string;
  name: string;
  grade: string;
  track: Track;
  role: Role;
  xp: number;
  level: number;
  streak: number;
  rank: number;
  avatar: string;
  school: string;
  badges: string[];
  completedTasks: string[];
};

const BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:3000/api/v1";
const TOKEN_KEY = "techm4schools_access_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    credentials: "include"
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function login(email: string, password: string) {
  return await request<{ accessToken: string; tokenType: "Bearer"; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function refresh() {
  return await request<{ accessToken: string; tokenType: "Bearer"; user: User }>("/auth/refresh", {
    method: "POST"
  });
}

export async function logout() {
  await request<{ ok: true }>("/auth/logout", { method: "POST" });
  setAccessToken(null);
}

export async function getClasses() {
  return await request<any[]>("/classes");
}

export async function createClass(payload: any) {
  return await request<any>("/classes", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateClass(id: string, payload: any) {
  return await request<any>(`/classes/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function getAnnouncements() {
  return await request<any[]>("/announcements");
}

export async function createAnnouncement(payload: any) {
  return await request<any>("/announcements", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateAnnouncement(id: string, payload: any) {
  return await request<any>(`/announcements/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function getLeaderboard(sortBy: "xp" | "streak" | "tasks" = "xp") {
  return await request<any[]>(`/leaderboard?sortBy=${sortBy}`);
}

export async function getSubmissions() {
  return await request<any[]>("/submissions");
}

export async function createSubmission(payload: { title: string; type: "code" | "assembly" | "project" | "quiz"; fileType: string }) {
  return await request<any>("/submissions", { method: "POST", body: JSON.stringify(payload) });
}

export async function reviewSubmission(id: string, payload: { status: "reviewed" | "approved" | "needs-revision"; score?: number; feedback?: string; xpAwarded?: number }) {
  return await request<any>(`/submissions/${id}/review`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function adminListUsers() {
  return await request<any[]>("/admin/users");
}

export async function adminCreateUser(payload: {
  email: string;
  password: string;
  name: string;
  grade?: string;
  track?: Track;
  role?: Role;
  avatar?: string;
  school?: string;
  pin?: string;
}) {
  return await request<any>("/admin/users", { method: "POST", body: JSON.stringify(payload) });
}

export async function getProgram() {
  return await request<{ program: { id: string; name: string; year: number; totalDays: number }; state: { currentDay: number } }>("/program");
}

export async function getProgramDay(day: number) {
  return await request<any>(`/program/days/${day}`);
}

