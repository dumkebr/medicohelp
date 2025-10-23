import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

function fmtWeeksDays(totalDays: number) {
  const w = Math.floor(totalDays / 7);
  const d = totalDays % 7;
  return `${w}s${d}d`;
}

function addDays(date: Date, days: number) {
  const dt = new Date(date);
  dt.setDate(dt.getDate() + days);
  return dt;
}

function diffDays(a: Date, b: Date) {
  const A = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const B = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((B.getTime() - A.getTime()) / 86400000);
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CalcIG() {
  const today = useMemo(() => new Date(), []);
  const [dum, setDum] = useState("");
  const [dpp, setDpp] = useState("");
  const [usDate, setUsDate] = useState("");
  const [usWeeks, setUsWeeks] = useState("");
  const [usDays, setUsDays] = useState("");

  // Cálculo por DUM
  const dumInfo = useMemo(() => {
    if (!dum) return null;
    const DUM = new Date(dum);
    const DPP = addDays(DUM, 280);
    const igDays = diffDays(DUM, today);
    return { DPP, igDays };
  }, [dum, today]);

  // Cálculo por USG (data + IG na data do exame)
  const usInfo = useMemo(() => {
    if (!usDate || (!usWeeks && !usDays)) return null;
    const USD = new Date(usDate);
    const weeks = Number(usWeeks || 0);
    const days = Number(usDays || 0);
    const igAtExamDays = weeks * 7 + days;
    const concDays = 280 - igAtExamDays;
    const DPP = addDays(USD, concDays);
    const igTodayDays = 280 - diffDays(today, DPP);
    return { DPP, igTodayDays };
  }, [usDate, usWeeks, usDays, today]);

  // Cálculo por DPP fornecida
  const dppInfo = useMemo(() => {
    if (!dpp) return null;
    const DPP = new Date(dpp);
    const igTodayDays = 280 - diffDays(today, DPP);
    return { igTodayDays };
  }, [dpp, today]);

  const handleCopy = () => {
    const results: string[] = [];
    
    if (dumInfo) {
      results.push(`Por DUM:\nIG hoje: ${fmtWeeksDays(dumInfo.igDays)}\nDPP: ${toISO(dumInfo.DPP)}`);
    }
    
    if (usInfo) {
      results.push(`Por USG:\nIG hoje: ${fmtWeeksDays(usInfo.igTodayDays)}\nDPP: ${toISO(usInfo.DPP)}`);
    }
    
    if (dppInfo) {
      results.push(`Por DPP:\nIG hoje: ${fmtWeeksDays(dppInfo.igTodayDays)}`);
    }
    
    const text = `Idade Gestacional\n\n${results.join('\n\n')}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                Idade Gestacional
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Cálculo por DUM, DPP ou Ultrassom
              </p>
            </div>
            <Link href="/avancado">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* POR DUM */}
        <Card>
          <CardHeader>
            <CardTitle>Por DUM (Data da Última Menstruação)</CardTitle>
            <CardDescription>
              Regra de Naegele: DPP = DUM + 280 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dum">DUM</Label>
                <Input
                  id="dum"
                  type="date"
                  value={dum}
                  onChange={(e) => setDum(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => setDum("")}>
                  Limpar
                </Button>
              </div>
            </div>

            {dumInfo && (
              <div className="p-4 bg-[#3cb371]/10 border border-[#3cb371]/30 rounded-lg">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Resultado</div>
                <div className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-1">
                  IG hoje: {fmtWeeksDays(dumInfo.igDays)}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                  DPP: {toISO(dumInfo.DPP)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* POR ULTRASSOM */}
        <Card>
          <CardHeader>
            <CardTitle>Por Ultrassom</CardTitle>
            <CardDescription>
              Informe a data do USG e a idade gestacional no momento do exame
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="usd">Data do USG</Label>
                <Input
                  id="usd"
                  type="date"
                  value={usDate}
                  onChange={(e) => setUsDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="usw">IG no USG – semanas</Label>
                <Input
                  id="usw"
                  type="number"
                  step="1"
                  value={usWeeks}
                  onChange={(e) => setUsWeeks(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="usd2">IG no USG – dias</Label>
                <Input
                  id="usd2"
                  type="number"
                  step="1"
                  value={usDays}
                  onChange={(e) => setUsDays(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setUsDate("");
                setUsWeeks("");
                setUsDays("");
              }}>
                Limpar
              </Button>
            </div>

            {usInfo && (
              <div className="p-4 bg-[#3cb371]/10 border border-[#3cb371]/30 rounded-lg">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Resultado</div>
                <div className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-1">
                  IG hoje: {fmtWeeksDays(usInfo.igTodayDays)}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                  DPP: {toISO(usInfo.DPP)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* POR DPP */}
        <Card>
          <CardHeader>
            <CardTitle>Por DPP (Data Provável do Parto)</CardTitle>
            <CardDescription>
              Se você já conhece a DPP, informe aqui
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dpp">DPP</Label>
                <Input
                  id="dpp"
                  type="date"
                  value={dpp}
                  onChange={(e) => setDpp(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => setDpp("")}>
                  Limpar
                </Button>
              </div>
            </div>

            {dppInfo && (
              <div className="p-4 bg-[#3cb371]/10 border border-[#3cb371]/30 rounded-lg">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Resultado</div>
                <div className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-1">
                  IG hoje: {fmtWeeksDays(dppInfo.igTodayDays)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* NOTAS */}
        <Card>
          <CardHeader>
            <CardTitle>Notas Importantes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-neutral-700 dark:text-neutral-300">
            <ul className="list-disc ml-5 space-y-2">
              <li>
                A DPP calculada pela DUM segue a Regra de Naegele (DUM + 280 dias ou 40 semanas)
              </li>
              <li>
                Quando a DPP estimada por USG de primeiro trimestre divergir da DUM, 
                <strong className="text-[#3cb371]"> priorize a estimativa do USG precoce</strong> 
                (até 13 semanas e 6 dias)
              </li>
              <li>
                O USG de primeiro trimestre é mais preciso para datar a gestação, 
                com margem de erro de ±5-7 dias
              </li>
              <li>
                A partir do segundo trimestre, a variabilidade biológica aumenta e o USG 
                é menos preciso para datação
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* AÇÕES */}
        <div className="flex gap-3">
          <Button
            onClick={handleCopy}
            disabled={!dumInfo && !usInfo && !dppInfo}
            className="bg-[#3cb371] hover:bg-[#2f9e62]"
          >
            Copiar Resultados
          </Button>
        </div>
      </main>
    </div>
  );
}
