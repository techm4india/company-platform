import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

type KitRow = {
  id: string;
  status: string;
  tracking_number: string | null;
  courier: string | null;
  address: any;
};

export function KitsPage() {
  const [row, setRow] = useState<KitRow | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [addr, setAddr] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: ""
  });

  async function load() {
    setErr("");
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;

      const res = await supabase.from("kits").select("id,status,tracking_number,courier,address").eq("user_id", uid).maybeSingle();
      if (res.error) throw res.error;
      setRow((res.data as any) ?? null);

      const a = (res.data as any)?.address ?? {};
      setAddr({
        line1: a.line1 ?? "",
        line2: a.line2 ?? "",
        city: a.city ?? "",
        state: a.state ?? "",
        pincode: a.pincode ?? ""
      });
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load kit status");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const addressOk = useMemo(() => !!addr.line1.trim() && !!addr.city.trim() && !!addr.state.trim() && !!addr.pincode.trim(), [addr]);

  async function saveAddress() {
    setErr("");
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");

      const { error } = await supabase.from("kits").upsert({
        user_id: uid,
        address: addr,
        status: "pending_dispatch",
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save address");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-black text-slate-900">Kit Management</div>
          <div className="text-sm text-slate-500">Store address and track dispatch/delivery status.</div>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {err && <Card className="border-rose-200 bg-rose-50 text-rose-700">{err}</Card>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="text-sm font-extrabold">Delivery status</div>
          <div className="mt-3 rounded-2xl border border-slate-100 p-4">
            <div className="text-xs font-black tracking-[0.18em] text-slate-400">STATUS</div>
            <div className="mt-1 text-lg font-black text-slate-900">{row?.status ?? "not requested"}</div>
            <div className="mt-2 text-sm text-slate-600">
              <div><span className="font-extrabold">Courier:</span> {row?.courier ?? "—"}</div>
              <div><span className="font-extrabold">Tracking:</span> {row?.tracking_number ?? "—"}</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-slate-500">
            Admins update dispatch status and tracking details in Admin → Students / Kits.
          </div>
        </Card>

        <Card>
          <div className="text-sm font-extrabold">Your address</div>
          <div className="mt-3 grid gap-3">
            {(["line1", "line2", "city", "state", "pincode"] as const).map((k) => (
              <label key={k} className="block">
                <div className="text-xs font-bold text-slate-600">{k.toUpperCase()}</div>
                <input
                  value={(addr as any)[k]}
                  onChange={(e) => setAddr((a) => ({ ...a, [k]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                />
              </label>
            ))}
            <Button disabled={!addressOk || busy} onClick={saveAddress} className="w-full">
              {busy ? "Saving..." : "Save address"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

