import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type Track = { id: string; code: string; name: string };

export function ProfilePage() {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [completionPct, setCompletionPct] = useState<number>(0);
  const [draft, setDraft] = useState({
    full_name: "",
    phone: "",
    grade: "",
    school: "",
    track_id: "" as string
  });

  async function load() {
    setErr("");
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;

      const t = await supabase.from("tracks").select("id,code,name").order("name", { ascending: true });
      if (t.error) throw t.error;
      setTracks((t.data as any) ?? []);

      const me = await supabase.from("users").select("full_name,phone,grade,school,track_id,email,role,points,level,streak").eq("id", uid).single();
      if (me.error) throw me.error;
      const m = me.data as any;
      setDraft({
        full_name: m.full_name ?? "",
        phone: m.phone ?? "",
        grade: m.grade ?? "",
        school: m.school ?? "",
        track_id: m.track_id ?? ""
      });

      const days = await supabase.from("program_days").select("day", { count: "exact", head: true });
      if (days.error) throw days.error;
      const totalDays = days.count ?? 25;
      const pr = await supabase.from("progress").select("completion_percent").eq("user_id", uid);
      if (pr.error) throw pr.error;
      const sum = ((pr.data as any[]) ?? []).reduce((a, r) => a + Number(r.completion_percent ?? 0), 0);
      setCompletionPct(totalDays ? Math.round(sum / (totalDays * 100) * 100) : 0);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load profile");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setErr("");
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase.from("users").update({
        full_name: draft.full_name.trim() || null,
        phone: draft.phone.trim() || null,
        grade: draft.grade.trim() || null,
        school: draft.school.trim() || null,
        track_id: draft.track_id || null,
        updated_at: new Date().toISOString()
      }).eq("id", uid);
      if (error) throw error;
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  const canGenerateCert = useMemo(() => completionPct >= 100 && !!draft.full_name.trim(), [completionPct, draft.full_name]);

  async function generateCertificate() {
    setErr("");
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");
      if (!draft.full_name.trim()) throw new Error("Set your name first (Profile → Full name).");
      if (completionPct < 100) throw new Error("Complete the program to generate certificate.");

      const pdf = await PDFDocument.create();
      const page = pdf.addPage([842, 595]); // A4 landscape
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

      const bg = rgb(0.97, 0.98, 0.99);
      page.drawRectangle({ x: 0, y: 0, width: 842, height: 595, color: bg });
      page.drawRectangle({ x: 32, y: 32, width: 778, height: 531, borderColor: rgb(0.88, 0.90, 0.93), borderWidth: 2 });

      const brand = rgb(0.06, 0.73, 0.51);
      page.drawText("TECHM4SCHOOLS", { x: 60, y: 520, size: 18, font: bold, color: brand });
      page.drawText("Certificate of Completion", { x: 60, y: 470, size: 36, font: bold, color: rgb(0.06, 0.09, 0.16) });
      page.drawText("This certifies that", { x: 60, y: 425, size: 14, font, color: rgb(0.39, 0.45, 0.55) });

      page.drawText(draft.full_name.trim(), { x: 60, y: 385, size: 30, font: bold, color: rgb(0.06, 0.09, 0.16) });

      page.drawText("has successfully completed the", { x: 60, y: 345, size: 14, font, color: rgb(0.39, 0.45, 0.55) });
      page.drawText("Product-Based Innovation Training Program (25 Days)", { x: 60, y: 320, size: 18, font: bold, color: rgb(0.06, 0.09, 0.16) });

      const date = new Date().toLocaleDateString();
      page.drawText(`Issued on: ${date}`, { x: 60, y: 270, size: 12, font, color: rgb(0.39, 0.45, 0.55) });
      page.drawText(`Student ID: ${uid}`, { x: 60, y: 250, size: 10, font, color: rgb(0.55, 0.60, 0.68) });

      page.drawRectangle({ x: 60, y: 150, width: 240, height: 2, color: rgb(0.75, 0.80, 0.86) });
      page.drawText("Program Director", { x: 60, y: 132, size: 10, font, color: rgb(0.39, 0.45, 0.55) });

      const bytes = await pdf.save();
      const out = new Uint8Array(bytes.length);
      out.set(bytes);
      const blob = new Blob([out], { type: "application/pdf" });

      // Try to store in Supabase (optional, for admin re-download). If buckets aren't created yet, download still works.
      const path = `${uid}/certificate.pdf`;
      const up = await supabase.storage.from("certificates").upload(path, blob, { upsert: true, contentType: "application/pdf" });
      if (!up.error) {
        await supabase.from("certificates").upsert({ user_id: uid, storage_path: path });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "certificate.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e?.message ?? "Certificate generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Profile</div>
          <div className="text-sm text-slate-500">Personal details, program details, track selection.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="text-sm font-extrabold">Personal details</div>
          <div className="mt-3 grid gap-3">
            {(["full_name", "phone", "grade", "school"] as const).map((k) => (
              <label key={k} className="block">
                <div className="text-xs font-bold text-slate-600">{k.replace("_", " ").toUpperCase()}</div>
                <input
                  value={(draft as any)[k]}
                  onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                />
              </label>
            ))}

            <label className="block">
              <div className="text-xs font-bold text-slate-600">TRACK</div>
              <select
                value={draft.track_id}
                onChange={(e) => setDraft((d) => ({ ...d, track_id: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
              >
                <option value="">Select track…</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <Button disabled={busy} onClick={save} className="w-full">{busy ? "Saving..." : "Save profile"}</Button>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-extrabold">Certificates</div>
          <div className="mt-2 text-sm text-slate-500">Completion: <span className="font-black text-slate-900">{completionPct}%</span></div>
          <div className="mt-3">
            <Button disabled={!canGenerateCert || busy} onClick={generateCertificate}>
              {busy ? "Generating..." : "Generate & Download PDF"}
            </Button>
          </div>
          {!draft.full_name.trim() && <div className="mt-2 text-xs text-slate-500">Set your full name to appear on the certificate.</div>}
          {completionPct < 100 && <div className="mt-2 text-xs text-slate-500">Finish all 25 days to unlock certificate.</div>}
        </Card>
      </div>
    </div>
  );
}

