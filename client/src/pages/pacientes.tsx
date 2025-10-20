import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Plus, User, Pencil, Trash2 } from "lucide-react";
import type { Patient } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Pacientes() {
  const { toast } = useToast();
  
  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/patients/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Erro ao deletar paciente");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Paciente removido",
        description: "O paciente foi removido do sistema com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao remover paciente",
        description: error.message || "Tente novamente mais tarde.",
      });
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Pacientes Cadastrados</h1>
          <p className="text-muted-foreground">
            Gerencie e visualize todos os pacientes do sistema
          </p>
        </div>
        <Button asChild data-testid="button-novo-paciente">
          <Link href="/novo-paciente">
            <Plus className="w-4 h-4 mr-2" />
            Novo paciente
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : !patients || patients.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhum paciente cadastrado
              </h3>
              <p className="text-muted-foreground mb-6">
                Comece adicionando seu primeiro paciente ao sistema
              </p>
              <Button asChild data-testid="button-novo-paciente-empty">
                <Link href="/novo-paciente">
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar primeiro paciente
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          patients.map((patient) => (
            <Card key={patient.id} data-testid={`card-patient-${patient.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-semibold" data-testid={`text-patient-nome-${patient.id}`}>
                      {patient.nome}
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium">CPF:</span>{" "}
                        {patient.cpf || "-"}
                        {" • "}
                        <span className="font-medium">Nascimento:</span>{" "}
                        {patient.dataNascimento || "-"}
                      </p>
                      {patient.telefone && (
                        <p>
                          <span className="font-medium">Telefone:</span>{" "}
                          {patient.telefone}
                        </p>
                      )}
                      {patient.endereco && (
                        <p>
                          <span className="font-medium">Endereço:</span>{" "}
                          {patient.endereco}
                        </p>
                      )}
                      {patient.observacoes && (
                        <p className="mt-2">
                          <span className="font-medium">Observações:</span>{" "}
                          {patient.observacoes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      data-testid={`button-editar-${patient.id}`}
                    >
                      <Link href={`/pacientes/${patient.id}/editar`}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      data-testid={`button-emitir-receita-${patient.id}`}
                    >
                      <a
                        href="https://memed.com.br"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Receita
                      </a>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-deletar-${patient.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remover
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover o paciente{" "}
                            <strong>{patient.nome}</strong>? Esta ação não pode
                            ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletePatientMutation.mutate(patient.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
