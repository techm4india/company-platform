import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Row = {
  id: string;
  user_id: string;
  amount: string;
  currency: string;
  provider: string | null;
  reference: string | null;
  proof_path: string | null;
  status: string;
  created_at: string;
  notes: string | null;
};

export function PaymentsAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setErr("");
    try {
      const r = await supabase
        .from("payments")
        .select("id,user_id,amount,currency,provider,reference,proof_path,status,created_at,notes")
        .order("created_at", { ascending: false })
        .limit(500);
      if (r.error) throw r.error;
      setRows((r.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load payments");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function setStatus(id: string, status: "approved" | "rejected") {
    setErr("");
    setBusyId(id);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const adminId = auth.user?.id;
      if (!adminId) throw new Error("Not signed in");

      const { error } = await supabase.from("payments").update({
        status,
        verified_by: adminId,
        verified_at: new Date().toISOString()
      }).eq("id", id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function openProof(path: string) {
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 60);
    if (error) return;
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Admin · Payments</div>
          <div className="text-sm text-slate-500">Manual verification workflow.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="space-y-2">
        {rows.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="font-extrabold text-slate-900">
                  {p.currency} {Number(p.amount).toLocaleString()} · {p.status}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {p.provider ?? "—"} {p.reference ? `· Ref: ${p.reference}` : ""} · {new Date(p.created_at).toLocaleString()}
                </div>
                <div className="mt-1 text-xs font-mono text-slate-500">User: {p.user_id}</div>
                {p.notes && <div className="mt-2 text-sm text-slate-600">{p.notes}</div>}
              </div>
              <div className="flex items-center gap-2">
                {p.proof_path ? (
                  <Button variant="secondary" onClick={() => void openProof(p.proof_path!)}>View proof</Button>
                ) : (
                  <span className="text-xs text-slate-400">No proof</span>
                )}
                <Button disabled={busyId === p.id} onClick={() => void setStatus(p.id, "approved")}>Approve</Button>
                <Button disabled={busyId === p.id} variant="danger" onClick={() => void setStatus(p.id, "rejected")}>Reject</Button>
              </div>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <Card><div className="text-sm text-slate-500">No payments.</div></Card>}
      </div>
    </div>
  );
}

