import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calculator, 
  ArrowLeft, 
  Activity, 
  Baby, 
  Heart, 
  Stethoscope,
  FileText,
  Pill,
  Upload,
  FileImage,
  Mic
} from "lucide-react";

export default function AdvancedHub() {
  const calculators = [
    { 
      key: "wells", 
      title: "Escore de Wells (TEV)", 
      desc: "Probabilidade de TEP/TVP", 
      path: "/calc/wells",
      icon: Activity 
    },
    { 
      key: "gasometria", 
      title: "Gasometria Arterial/Venosa", 
      desc: "pH, PaCO₂, HCO₃⁻, ânion gap", 
      path: "/calc/gasometria",
      icon: Activity 
    },
    { 
      key: "iga", 
      title: "Idade Gestacional", 
      desc: "Cálculo por DUM, DPP ou USG", 
      path: "/calc/ig",
      icon: Baby 
    },
    { 
      key: "childpugh", 
      title: "Child-Pugh", 
      desc: "Gravidade da cirrose hepática", 
      path: "/calc/child-pugh",
      icon: Activity 
    },
    { 
      key: "grace", 
      title: "GRACE Score", 
      desc: "Risco em Síndrome Coronariana Aguda", 
      path: "/calc/grace",
      icon: Heart 
    },
    { 
      key: "cha2ds2vasc", 
      title: "CHA₂DS₂-VASc", 
      desc: "Risco tromboembólico em FA", 
      path: "/calc/cha2ds2vasc",
      icon: Heart 
    },
  ];

  const proTools = [
    { 
      title: "Gestão de Pacientes PRO", 
      desc: "Exportar/Importar, relatórios e análises avançadas", 
      path: "/pro/pacientes",
      icon: FileText,
      available: false 
    },
    { 
      title: "Protocolos do Pronto Socorro", 
      desc: "Dor torácica, dispneia, febre, dor abdominal, AVC", 
      path: "/pro/protocolos",
      icon: Stethoscope,
      available: false 
    },
    { 
      title: "Modelos de Documentos", 
      desc: "Atestados, encaminhamentos, receitas padronizadas", 
      path: "/pro/modelos",
      icon: FileText,
      available: false 
    },
  ];

  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                Ferramentas Avançadas
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Calculadoras clínicas, PosologiaCerta e recursos PRO
              </p>
            </div>
            <Link href="/atendimento">
              <Button variant="outline" className="gap-2" data-testid="button-voltar-chat">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Chat
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* CALCULADORAS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#3cb371]" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Calculadoras Clínicas
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {calculators.map((calc) => {
              const Icon = calc.icon;
              return (
                <Link key={calc.key} href={calc.path}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer hover-elevate">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Icon className="w-5 h-5 text-[#3cb371]" />
                      </div>
                      <CardTitle className="text-base">{calc.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {calc.desc}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* POSOLOGIACERTA */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-[#3cb371]" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              PosologiaCerta
            </h2>
          </div>
          <Card className="border-dashed">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    PosologiaCerta
                    <Badge variant="secondary" className="text-xs">Em breve</Badge>
                  </CardTitle>
                  <CardDescription className="text-sm mt-2">
                    Cálculo automático de doses (mg/kg/dose, mg/kg/dia), conversão para mL/comprimidos/gotas,
                    verificação de máximos por dose/dia, alertas para pediatria/gestante/insuficiência renal/hepática.
                    Saída padronizada no formato MédicoHelp.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </section>

        {/* FERRAMENTAS PRO */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-[#3cb371]" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Ferramentas Médico PRO
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {proTools.map((tool, i) => {
              const Icon = tool.icon;
              const content = (
                <Card className={`h-full ${tool.available ? 'hover:shadow-md cursor-pointer hover-elevate' : 'opacity-60'}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Icon className="w-5 h-5 text-[#3cb371]" />
                      {!tool.available && (
                        <Badge variant="secondary" className="text-xs">Em breve</Badge>
                      )}
                    </div>
                    <CardTitle className="text-base">{tool.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {tool.desc}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );

              return tool.available ? (
                <Link key={i} href={tool.path}>
                  {content}
                </Link>
              ) : (
                <div key={i}>
                  {content}
                </div>
              );
            })}
          </div>
        </section>

        {/* UPLOADS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#3cb371]" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Upload de Arquivos
            </h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                Envie exames, fotos e áudios diretamente no chat médico. O sistema transcreve áudios
                automaticamente e analisa imagens usando GPT-5 Vision.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/atendimento">
                  <Button variant="outline" className="gap-2">
                    <FileImage className="w-4 h-4" />
                    Anexar Arquivos
                  </Button>
                </Link>
                <Link href="/atendimento">
                  <Button variant="outline" className="gap-2">
                    <FileImage className="w-4 h-4" />
                    Tirar Foto
                  </Button>
                </Link>
                <Link href="/atendimento">
                  <Button variant="outline" className="gap-2">
                    <Mic className="w-4 h-4" />
                    Gravar Áudio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
