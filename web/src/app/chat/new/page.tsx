"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSession } from "@/lib/api/sessions";
import { getTemplateKey } from "@/lib/chat/templates";

export default function NewChatPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    (async () => {
      const template = getTemplateKey(sp.get("template"));

      const session = await createSession({ user_id: null });

      router.replace(
        `/chat/${session.id}?template=${encodeURIComponent(template)}`
      );
    })();
  }, [router, sp]);

  return (
    <div style={{ padding: 24, color: "white", background: "#0b1220", minHeight: "100vh" }}>
      Creando sesión...
    </div>
  );
}