export type TemplateKey = "custom" | "clauses" | "summary";

export function getTemplateKey(raw: string | null): TemplateKey {
  if (raw === "clauses") return "clauses";
  if (raw === "summary") return "summary";
  return "custom";
}

export function getTemplateTitle(key: TemplateKey) {
  if (key === "clauses") return "Detección de Cláusulas Críticas";
  if (key === "summary") return "Resumen Ejecutivo";
  return "Meta personalizada";
}

export function getInitialUserMessage(key: TemplateKey) {
  // Precontexto “sin tocar backend”: lo mandamos como primer mensaje USER al orquestador.
  if (key === "clauses") {
    return (
      "Quiero detectar cláusulas críticas y riesgos en un contrato. " +
      "Primero hazme 3-5 preguntas cortas para entender: (1) tipo de contrato, (2) jurisdicción/país, " +
      "(3) qué es crítico (plazos, penalidades, confidencialidad, terminación, pagos), (4) el output esperado. " +
      "Luego confirma la meta en una sola frase para que yo responda 'sí'."
    );
  }

  if (key === "summary") {
    return (
      "Quiero un resumen ejecutivo de un documento legal. " +
      "Primero pregúntame: (1) objetivo del resumen, (2) audiencia (CEO/abogado/cliente), " +
      "(3) extensión deseada, (4) si debo incluir riesgos o solo puntos clave. " +
      "Luego confirma la meta en una sola frase para que yo responda 'sí'."
    );
  }

  return (
    "Quiero crear una meta personalizada. " +
    "Hazme preguntas cortas para aclararla y luego confírmala en una sola frase para que yo responda 'sí'."
  );
}