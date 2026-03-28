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
      "Luego confirma la meta en una sola frase para que yo responda 'sí'."
    );
  }

  if (key === "summary") {
    return (
      "Quiero un resumen ejecutivo de un documento legal. " +
      "Luego confirma la meta en una sola frase para que yo responda 'sí'."
    );
  }

  return (
    "Quiero crear una meta personalizada. " +
    "Hazme preguntas cortas para aclararla y luego confírmala en una sola frase para que yo responda 'sí'."
  );
}