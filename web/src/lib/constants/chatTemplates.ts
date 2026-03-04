export type ChatTemplateKey = "legal_clauses" | "exec_summary" | "custom";

export const CHAT_TEMPLATES: Record<
  Exclude<ChatTemplateKey, "custom">,
  { title: string; firstAssistantMessage: string }
> = {
  legal_clauses: {
    title: "Detección de Cláusulas Críticas",
    firstAssistantMessage:
      "Perfecto. Para detectar cláusulas críticas necesito:\n\n" +
      "1) ¿Qué tipo de contrato es?\n" +
      "2) ¿De qué país o jurisdicción aplica?\n" +
      "3) ¿Qué te preocupa más del contrato?\n\n" +
      "Puedes pegar el texto aquí (o luego subir el documento).",
  },
  exec_summary: {
    title: "Resumen Ejecutivo",
    firstAssistantMessage:
      "Perfecto. Para crear un resumen ejecutivo necesito:\n\n" +
      "1) ¿Qué tipo de documento es?\n" +
      "2) ¿Para quién es el resumen?\n" +
      "3) ¿Qué nivel de detalle quieres?\n\n" +
      "Pega el documento o dime de qué trata.",
  },
};