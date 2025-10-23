import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";

interface CalcPlaceholderProps {
  title: string;
  description: string;
}

export default function CalcPlaceholder({ title, description }: CalcPlaceholderProps) {
  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {title}
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {description}
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
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Card className="border-dashed">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[400px] text-center">
            <Construction className="w-16 h-16 text-neutral-400 mb-4" />
            <CardTitle className="text-xl mb-2">Em Construção</CardTitle>
            <CardDescription className="max-w-md">
              Esta calculadora está sendo desenvolvida. Em breve você poderá utilizá-la
              diretamente no MédicoHelp com interface otimizada e resultados prontos para copiar.
            </CardDescription>
            <div className="flex gap-3 mt-6">
              <Link href="/avancado">
                <Button variant="outline">
                  ← Voltar para Ferramentas
                </Button>
              </Link>
              <Link href="/atendimento">
                <Button className="bg-[#3cb371] hover:bg-[#2f9e62]">
                  Ir para o Chat Médico
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
