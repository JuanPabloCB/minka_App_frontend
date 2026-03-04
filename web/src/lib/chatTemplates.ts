export type GoalPresetKey = "custom" | "legal_clauses" | "executive_summary";

export function presetFirstMessage(key: GoalPresetKey): string | null {
  if (key === "custom") return null;

  if (key === "legal_clauses") {
    return [
      "Quiero detectar cláusulas críticas en un contrato.",
      "Enfócate en: riesgos, obligaciones, penalidades, terminación, confidencialidad, jurisdicción, pagos y responsabilidad.",
      "Hazme preguntas mínimas para empezar y luego arma la ruta.",
    ].join("\n");
  }

  if (key === "executive_summary") {
    return [
      "Quiero un resumen ejecutivo de un documento/contrato.",
      "Estructúralo en: contexto, puntos clave, obligaciones, plazos, riesgos, y recomendaciones.",
      "Hazme preguntas mínimas para empezar y luego arma la ruta.",
    ].join("\n");
  }

  return null;
}