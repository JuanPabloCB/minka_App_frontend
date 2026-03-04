"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  function start(template: string) {
    router.push(`/chat/new?template=${template}`);
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>¿Qué quieres lograr hoy?</h1>
      <p>Minka convierte tu meta en una ruta ejecutable paso a paso</p>

      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 24,
          flexWrap: "wrap",
        }}
      >
        <button onClick={() => start("custom")}>
          + Crear Meta Personalizada
        </button>

        <button onClick={() => start("legal_clauses")}>
          Detección de Cláusulas Críticas
        </button>

        <button onClick={() => start("executive_summary")}>
          Resumen Ejecutivo
        </button>
      </div>
    </div>
  );
}