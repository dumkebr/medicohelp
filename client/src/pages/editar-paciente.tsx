import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { insertPatientSchema, type InsertPatient, type Patient } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

export default function EditarPaciente() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/pacientes/:id/editar");
  const patientId = params?.id;

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ["/api/patients", patientId],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${patientId}`);
      if (!response.ok) {
        throw new Error("Paciente não encontrado");
      }
      return response.json();
    },
    enabled: !!patientId,
  });

  const form = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema),
    values: patient ? {
      nome: patient.nome,
      cpf: patient.cpf || "",
      dataNascimento: patient.dataNascimento || "",
      telefone: patient.telefone || "",
      endereco: patient.endereco || "",
      observacoes: patient.observacoes || "",
    } : undefined,
  });

  const updatePatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      return await apiRequest("PATCH", `/api/patients/${patientId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId] });
      toast({
        title: "Paciente atualizado",
        description: "As informações foram atualizadas com sucesso.",
      });
      setLocation("/pacientes");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar paciente",
        description: error.message || "Tente novamente mais tarde.",
      });
    },
  });

  const onSubmit = (data: InsertPatient) => {
    updatePatientMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Paciente não encontrado</h3>
            <p className="text-muted-foreground mb-6">
              O paciente que você está tentando editar não existe.
            </p>
            <Button onClick={() => setLocation("/pacientes")}>
              Voltar para lista de pacientes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Editar Paciente</h1>
        <p className="text-muted-foreground">
          Atualize as informações do paciente
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Paciente</CardTitle>
          <CardDescription>
            Campos obrigatórios estão marcados com *
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome completo *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex.: João da Silva"
                          data-testid="input-nome"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          data-testid="input-cpf"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataNascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de nascimento</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          data-testid="input-data-nascimento"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(00) 00000-0000"
                          data-testid="input-telefone"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Rua, número, bairro, cidade"
                          data-testid="input-endereco"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Alergias, comorbidades, convênio..."
                          className="min-h-[100px]"
                          data-testid="input-observacoes"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/pacientes")}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updatePatientMutation.isPending}
                  data-testid="button-submit"
                >
                  {updatePatientMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar alterações"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
