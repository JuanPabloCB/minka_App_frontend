"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPlan, PlanWithStepsOut } from "@/lib/api/plans";

export default function PlanPage() {
  const params = useParams<{ planId: string }>();
  const planId = params.planId;

  const [data, setData] = useState<PlanWithStepsOut | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await getPlan(planId);
        setData(p);
      } catch (e: any) {
        setErr(e?.message ?? "Error");
      }
    })();
  }, [planId]);

  if (err) return <div style={{ padding: 24 }}>Error: {err}</div>;
  if (!data) return <div style={{ padding: 24 }}>Cargando plan...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Ruta creada</h2>
      <div>
        <b>ID:</b> {data.plan.id}
      </div>
      <div>
        <b>Status:</b> {data.plan.status}
      </div>
      <div>
        <b>UI State:</b> {data.plan.ui_state}
      </div>
      <div>
        <b>Title:</b> {data.plan.title}
      </div>

      <div style={{ marginTop: 16, opacity: 0.8 }}>
        (plan_steps existen, pero por ahora no se muestran)
      </div>
    </div>
  );
}