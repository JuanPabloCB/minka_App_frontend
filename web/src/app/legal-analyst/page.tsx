import LegalAnalystShell from "./components/LegalAnalystShell";

export default function Page() {
  return (
    <LegalAnalystShell
      initialPayload={{
        goal_type: "critical_clause_detection",
        inputs: {
          desired_output: "structured_legal_findings",
          estimated_time: "18 min restantes",
        },
        assigned_macro_steps: [
          {
            id: "macro_1",
            title: "Recibir y validar contrato de arrendamiento",
            description:
              "Usar el contrato entregado por el usuario como base del análisis legal.",
            expected_output: "Contrato listo para análisis",
          },
          {
            id: "macro_2",
            title: "Identificar cláusulas relevantes del contrato",
            description:
              "Ubicar cláusulas y secciones importantes para revisión.",
            expected_output: "Listado inicial de hallazgos",
          },
          {
            id: "macro_3",
            title: "Detectar cláusulas críticas o riesgosas",
            description:
              "Determinar cuáles cláusulas requieren atención legal.",
            expected_output: "Cláusulas críticas detectadas",
          },
          {
            id: "macro_4",
            title: "Priorizar cláusulas según nivel de riesgo",
            description:
              "Ordenar las cláusulas detectadas por criticidad e impacto.",
            expected_output: "Riesgos priorizados",
          },
          {
            id: "macro_5",
            title: "Explicar impacto práctico de los hallazgos",
            description:
              "Traducir hallazgos legales a implicancias concretas para el cliente.",
            expected_output: "Interpretación práctica",
          },
          {
            id: "macro_6",
            title: "Preparar salida legal estructurada para informe posterior",
            description:
              "Organizar los hallazgos en formato claro para que otro analista genere el informe visual y estadístico.",
            expected_output: "Paquete legal estructurado",
          },
        ],
      }}
    />
  );
}