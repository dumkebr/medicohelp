import { useLocation } from "wouter";
import MedPrimeCard from "@/components/MedPrimeCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Activity, Heart, Stethoscope, Baby, Droplet } from "lucide-react";

export default function MedPrimePage() {
  const [, navigate] = useLocation();

  const calculadoras = [
    {
      title: "Gasometria Arterial",
      desc: "Interpretação ABG e parâmetros principais",
      icon: Activity,
      path: "/calc/gasometria",
    },
    {
      title: "Wells (TEV)",
      desc: "Probabilidade pré-teste para TEP/TVP",
      icon: Heart,
      path: "/calc/wells",
    },
    {
      title: "Idade Gestacional",
      desc: "Cálculo por DUM ou ultrassonografia",
      icon: Baby,
      path: "/calc/ig",
    },
    {
      title: "CURB-65",
      desc: "Gravidade de pneumonia comunitária",
      icon: Stethoscope,
      path: "/calc/curb65",
      available: false,
    },
    {
      title: "CHA₂DS₂-VASc",
      desc: "Risco tromboembólico na FA",
      icon: Droplet,
      path: "/calc/cha2ds2vasc",
      available: false,
    },
    {
      title: "Child-Pugh",
      desc: "Classificação de cirrose hepática",
      icon: Calculator,
      path: "/calc/child-pugh",
      available: false,
    },
  ];

  const scrollToCalcs = () => {
    const el = document.getElementById("medprime-calculadoras");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <MedPrimeCard
        onAccess={scrollToCalcs}
        restricted={true}
      />

      <section id="medprime-calculadoras" className="space-y-3">
        <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
          Calculadoras Clínicas
        </h2>
        <p className="text-sm text-emerald-900/80 dark:text-emerald-100/70">
          Acesso rápido às ferramentas essenciais para decisões clínicas baseadas em evidências.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {calculadoras.map((calc) => (
            <Card
              key={calc.path}
              className="rounded-2xl border-emerald-100 dark:border-emerald-800 hover-elevate active-elevate-2 cursor-pointer transition-all"
              onClick={() => calc.available !== false && navigate(calc.path)}
              data-testid={`card-calc-${calc.path.split('/').pop()}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-700 text-white">
                    <calc.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                      {calc.title}
                    </h3>
                    <p className="text-xs text-emerald-900/70 dark:text-emerald-100/60">
                      {calc.desc}
                    </p>
                  </div>
                </div>

                {calc.available === false ? (
                  <div className="rounded-lg border border-dashed border-emerald-200 dark:border-emerald-700 p-2 text-center">
                    <span className="text-xs text-emerald-800 dark:text-emerald-200">
                      Em breve
                    </span>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    data-testid={`button-open-${calc.path.split('/').pop()}`}
                  >
                    Abrir Calculadora
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
