export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }

  // Por si algún endpoint responde vacío
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return (undefined as unknown) as T;
  }

  return (await res.json()) as T;
}