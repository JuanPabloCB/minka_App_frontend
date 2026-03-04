"use client";

import GoalCard from "./GoalCard";
import CreateGoalCTA from "@/features/goals/components/CreateGoalCTA";
import ComingSoonAutomation from "@/features/goals/components/ComingSoonAutomation";

export default function CreateGoalPage() {
  return (
    <div className="p-10">

      <h1 className="text-3xl font-semibold mb-2">
        ¿Qué quieres lograr hoy?
      </h1>

      <p className="text-gray-500 mb-8">
        Minka convierte tu meta en una ruta ejecutable paso a paso
      </p>

    </div>
  );
}