import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, ListChecks, FileText, Bot, ShieldCheck, Heart } from "lucide-react";
import medprimeHeartIcon from "@assets/medprime-heart-icon.png";

export type MedPrimeCardProps = {
  onAccess?: () => void;
  className?: string;
  restricted?: boolean;
};

function FeatureItem({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="text-sm leading-tight">{label}</span>
    </div>
  );
}

export default function MedPrimeCard({ onAccess, className = "", restricted = true }: MedPrimeCardProps) {
  return (
    <Card
      role="region"
      aria-label="MedPrime – Ferramentas Médicas Avançadas"
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-700/90 via-emerald-700 to-emerald-800 text-white shadow-xl ${className}`}
    >
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <img src={medprimeHeartIcon} alt="" className="h-48 w-48" aria-hidden="true" />
          <div className="min-w-0">
            <CardTitle className="text-2xl font-bold tracking-tight">MedPrime</CardTitle>
            <CardDescription className="text-emerald-100/90">
              Ferramentas Médicas Avançadas · <span className="font-medium">by MédicoHelp</span>
            </CardDescription>
          </div>
        </div>

        {restricted && (
          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs font-medium tracking-wide ring-1 ring-white/20">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Exclusivo para médicos cadastrados</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <p className="mb-4 text-sm text-emerald-50/95">
          A nova geração de utilitários clínicos: tudo em um só lugar, rápido e confiável – com a precisão que o atendimento exige.
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <FeatureItem icon={Calculator} label="Calculadoras e doses (pediatria e adulto)" />
          <FeatureItem icon={ListChecks} label="Escalas e scores validados (Wells, CURB-65, CHA₂DS₂-VASc)" />
          <FeatureItem icon={FileText} label="Protocolos e vias de cuidado padronizados" />
          <FeatureItem icon={Bot} label="Apoio diagnóstico com IA integrada" />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Button
          size="lg"
          onClick={onAccess}
          aria-label="Acessar ferramentas MedPrime"
          className="h-11 w-full bg-white text-emerald-900 hover:bg-emerald-100"
          data-testid="button-access-medprime"
        >
          ACESSAR FERRAMENTAS
        </Button>
        <div className="text-xs leading-tight text-emerald-50/80">
          <span className="font-semibold">MedPrime.</span> Porque excelência é o padrão.
        </div>
      </CardFooter>
    </Card>
  );
}
