"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSession } from "@/lib/api/sessions";
import { getTemplateKey } from "@/lib/chat/templates";

export default function NewChatPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const startedRef = useRef(false);
  const templateParam = sp.get("template");

  useEffect(() => {
    (async () => {
      if (!templateParam) return;
      if (startedRef.current) return;
      startedRef.current = true;

      const template = getTemplateKey(templateParam);

      const session = await createSession({ user_id: null });

      router.replace(
        `/chat/${session.id}?template=${encodeURIComponent(template)}`
      );
    })();
  }, [router, templateParam]);
  
  /*
  return (
    <div style={{ padding: 24, color: "white", background: "#0b1220", minHeight: "100vh" }}>
      Creando sesión...
    </div>
  );*/ 
  
}