import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type Payment = {
  id: string;
  amount: string;
  currency: string;
  provider: string | null;
  reference: string | null;
  proof_path: string | null;
  status: string;
  created_at: string;
  notes: string | null;
};

export function PaymentsPage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [draft, setDraft] = useState({
    amount: "4999.00",
    currency: "INR",
    provider: "UPI",
    reference: "",
    notes: ""
  });
  const [proof, setProof] = useState<File | null>(null);

  async function load() {
    setErr("");
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;

      const p = await supabase
        .from("payments")
        .select("id,amount,currency,provider,reference,proof_path,status,created_at,notes")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      if (p.error) throw p.error;
      setItems((p.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load payments");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const canSubmit = useMemo(() => Number(draft.amount) > 0 && !!draft.currency.trim() && !!draft.provider.trim(), [draft]);

  async function submit() {
    setErr("");
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");

      let proofPath: string | null = null;
      if (proof) {
        const safeName = proof.name.replace(/[^\w.\-]+/g, "_");
        proofPath = `${uid}/${Date.now()}_${safeName}`;
        const up = await supabase.storage.from("payment-proofs").upload(proofPath, proof, { upsert: false, cacheControl: "3600" });
        if (up.error) throw up.error;
      }

      const { error } = await supabase.from("payments").insert({
        user_id: uid,
        amount: Number(draft.amount),
        currency: draft.currency.trim(),
        provider: draft.provider.trim(),
        reference: draft.reference.trim() || null,
        proof_path: proofPath,
        notes: draft.notes.trim() || null,
        status: "pending"
      });
      if (error) throw error;

      setProof(null);
      setDraft((d) => ({ ...d, reference: "", notes: "" }));
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Payment submit failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Payments</div>
          <div className="text-sm text-slate-500">Store transaction details, upload proof, admin verifies.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <Card>
          <div className="text-sm font-extrabold">Submit payment proof</div>
          <div className="mt-3 grid gap-3">
            {(["amount", "currency", "provider", "reference"] as const).map((k) => (
              <label key={k} className="block">
                <div className="text-xs font-bold text-slate-600">{k.toUpperCase()}</div>
                <input
                  value={(draft as any)[k]}
                  onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                />
              </label>
            ))}
            <label className="block">
              <div className="text-xs font-bold text-slate-600">Notes (optional)</div>
              <textarea
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                className="mt-1 w-full min-h-[90px] rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
              />
            </label>
            <label className="block">
              <div className="text-xs font-bold text-slate-600">Upload proof (image/PDF)</div>
              <input type="file" accept="application/pdf,image/*" onChange={(e) => setProof(e.target.files?.[0] ?? null)} />
              <div className="mt-1 text-xs text-slate-400">Stored privately in bucket `payment-proofs`.</div>
            </label>
            <Button disabled={!canSubmit || busy} onClick={submit} className="w-full">
              {busy ? "Submitting..." : "Submit for verification"}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-extrabold">Your payments</div>
          <div className="mt-3 space-y-2">
            {items.map((p) => (
              <div key={p.id} className="rounded-2xl border border-slate-100 p-4 flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-extrabold text-slate-900">
                    {p.currency} {Number(p.amount).toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500">
                    {p.provider ?? "—"} {p.reference ? `· Ref: ${p.reference}` : ""} · {new Date(p.created_at).toLocaleString()}
                  </div>
                  {p.notes && <div className="mt-1 text-sm text-slate-600">{p.notes}</div>}
                </div>
                <div className="text-right">
                  <div className="text-xs font-black tracking-[0.18em] text-slate-400">STATUS</div>
                  <div className={p.status === "approved" ? "font-black text-emerald-700" : p.status === "rejected" ? "font-black text-rose-700" : "font-black text-slate-700"}>
                    {p.status}
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="text-sm text-slate-500">No payment records yet.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

