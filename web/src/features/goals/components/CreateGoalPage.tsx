"use client";

import GoalCard from "./GoalCard";
import CreateGoalCTA from "@/features/goals/components/CreateGoalCTA";
import ComingSoonAutomation from "@/features/goals/components/ComingSoonAutomation";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CreateGoalPage() {
  const router = useRouter();
  return (
    <div className="px-2 py-10">

      <div className="mx-auto max-w-[1200px]">

        <h1 className="text-3xl font-semibold mb-2">
          ¿Qué quieres lograr hoy?
        </h1>

        <p className="text-gray-500 mb-8">
          Minka convierte tu meta en una ruta ejecutable paso a paso
        </p>

        <div className="rounded-[16px] border border-slate-200 bg-slate-50 overflow-hidden"> 
          <div className="relative h-[120px] sm:h-[140px] md:h-[100px] w-full">
            <Image
              src="/banners/banner-tipo1.png"
              alt="Banner Crear Meta"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center px-16">
              <button 
              type ="button" 
              onClick={() => router.push("/chat/new?template=custom")}
              className="inline-flex items-center gap-3 rounded-xl bg-[#5B63FF] w-[336px] h-[59px] px-8 text-sm font-semibold text-white shadow-sm hover:bg-[#4c54e6] active:scale-[0.98]"
              >
                <span className="text-[48px] leading-none">+</span>
                <span className="text-[18px] leading-none">Crear Meta Personalizada</span>
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid gap-[65px] justify-center grid-cols-1 md:[grid-template-columns:repeat(2,500px)]">
              <div className="rounded-[12px] border border-slate-200 bg-white p-6 shadow-sm w-[500px] h-[300px]">
                <div className="flex gap-6 lg:gap-7 mt-2.5">
                  
                  <div className="shrink-0">
                    <div className="relative h-30 w-30 rounded-[12px] overflow-hidden bg-slate-100">
                      <Image
                        src="/illustrations/crear-meta/clausula-critica.png"
                        alt="Imagen cláusula crítica"
                       fill
                        className="object-contain"
                       priority
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <h3 className="text-[24px] font-semibold leading-tight text-slate-900">
                     Detección de <br /> Clausulas Críticas
                    </h3>

                    <p className="mt-3 text-[16px] leading-6 text-slate-600">
                      Identifica las cláusulas críticas en contratos y otros documentos
                      legales. Marca y explica las cláusulas con riesgo potencial.
                    </p>

                    <div className="mt-auto pt-6">
                      <button
                       type="button"
                       onClick={() => router.push("")}
                        className="inline-flex h-[52px] items-center justify-center rounded-xl bg-[#5B63FF] px-8 text-[18px] font-semibold text-white hover:bg-[#4c54e6] active:scale-[0.98]"
                      >
                       Iniciar Detección
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-[12px] border border-slate-200 bg-white p-6 shadow-sm w-[500px] h-[300px]">
                  <div className="flex gap-6 lg:gap-7 mt-2.5">
                    
                  <div className="shrink-0">
                    <div className="relative h-30 w-30 rounded-[12px] overflow-hidden bg-slate-100">
                      <Image
                       src="/illustrations/crear-meta/resumen-ejecutivo.png"
                       alt="Imagen resumen ejecutivo"
                       fill
                       className="object-contain"
                        priority
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <h3 className="text-[24px] font-semibold leading-tight text-slate-900">
                     Resumen <br /> Ejecutivo
                    </h3>

                    <p className="mt-3 text-[16px] leading-6 text-slate-600">
                      Genera un resumen estructurado y accionable de documentos largos.
                      Proporciona un “Output” vendible y fácil de entender.
                    </p>

                    <div className="mt-auto pt-6">
                      <button
                       type="button"
                        onClick={() => router.push("")}
                        className="inline-flex h-[52px] items-center justify-center rounded-xl bg-[#5B63FF] px-8 text-[18px] font-semibold text-white hover:bg-[#4c54e6] active:scale-[0.98]"
                      >
                       Iniciar Análisis
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 ml-10 relative overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-sm w-[700px] h-[86px] max-w-3xl">
              <Image
                src="/banners/banner-tipo2.png"
                alt="Banner Automatizaciones"
                fill
                className="object-cover"
                priority
              />
              <div className="relative z-10 flex h-full items-center px-5">
                {/*texto*/}
                <div className="flex items-center gap-6">
                  <div className="relative h-[60px] w-[60px] shrink-0">
                    <Image
                      src="/illustrations/crear-meta/automations.png"
                      alt="Icono Automatización"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-[22px] font-semibold text-slate-900">
                      Automatizaciones próximamente
                   </h4>
                    <p className="text-[14px] text-slate-600">
                      Guarda y programa procesos legales recurrentes.
                    </p>
                  </div>
                </div>
 
                <div className="relative ml-12 shrink-0">
                  <div className="rounded-[8px] border border-slate-300 bg-white/85 px-4 py-2 text-sm font-medium leading-none text-slate-700 backdrop-blur">
                   Próximamente
                  </div>
                  <div className="absolute -top-2 -right-2 h-6 w-6">
                    <Image
                      src="/illustrations/crear-meta/ai-symbol.png"
                      alt="Icono IA"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>

      </div>

    </div>
  );
}