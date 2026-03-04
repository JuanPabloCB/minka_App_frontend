"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSession } from "@/lib/api/sessions";

export default function NewChatPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const template = (sp.get("template") ?? "custom").toString();

  useEffect(() => {
    (async () => {
      const session = await createSession({ user_id: null });
      router.replace(`/chat/${session.id}?template=${encodeURIComponent(template)}`);
    })();
  }, [router, template]);

  return <div style={{ padding: 24 }}>Creando sesión...</div>;
}