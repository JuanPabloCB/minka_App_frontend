"use client";

import { useRouter } from "next/navigation";

export default function CreateGoalCTA() {

  const router = useRouter();

  return (
    <div className="bg-gradient-to-r from-indigo-200 via-purple-200 to-teal-200 p-6 rounded-xl">

      <button
        onClick={() => router.push("/chat/new?template=custom")}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium"
      >
        + Crear Meta Personalizada
      </button>

    </div>
  );
}