import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, FileText, User } from "lucide-react";
import type { Patient, Consultation } from "@shared/schema";

export default function HistoricoPaciente() {
  const [, params] = useRoute("/pacientes/:id/historico");
  const patientId = params?.id;

  const { data: patient, isLoading: loadingPatient } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });

  const { data: consultations, isLoading: loadingConsultations } = useQuery<Consultation[]>({
    queryKey: [`/api/patients/${patientId}/consultations`],
    enabled: !!patientId,
  });

  if (!patientId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-destructive">ID do paciente não fornecido</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Button
        variant="ghost"
        asChild
        className="mb-6"
        data-testid="button-voltar"
      >
        <Link href="/pacientes">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para lista de pacientes
        </Link>
      </Button>

      {loadingPatient ? (
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
        </Card>
      ) : patient ? (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-2xl">{patient.nome}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {patient.cpf && `CPF: ${patient.cpf}`}
                  {patient.cpf && patient.dataNascimento && " • "}
                  {patient.dataNascimento && `Nascimento: ${patient.dataNascimento}`}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Paciente não encontrado</p>
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Histórico de Consultas</h2>
        <p className="text-sm text-muted-foreground">
          {consultations?.length || 0} consulta(s) registrada(s)
        </p>
      </div>

      <div className="space-y-4">
        {loadingConsultations ? (
          <>
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : !consultations || consultations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma consulta registrada
              </h3>
              <p className="text-muted-foreground mb-6">
                As consultas feitas através do chat serão registradas automaticamente aqui
              </p>
            </CardContent>
          </Card>
        ) : (
          consultations.map((consultation) => {
            const history = consultation.history as any[];
            const attachments = consultation.attachments as any[];
            const date = new Date(consultation.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Card key={consultation.id} data-testid={`card-consultation-${consultation.id}`}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {consultation.complaint}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{date}</span>
                          {consultation.userId && (
                            <>
                              <span>•</span>
                              <span>Dr(a). {consultation.userId}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {attachments && attachments.length > 0 && (
                        <Badge variant="secondary">
                          {attachments.length} anexo(s)
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3 border-t pt-4">
                      <h4 className="text-sm font-semibold text-muted-foreground">
                        Histórico da Conversa
                      </h4>
                      <div className="space-y-2">
                        {history && history.map((msg: any, idx: number) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-md ${
                              msg.role === "user"
                                ? "bg-primary/10 text-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-xs font-semibold mb-1 text-muted-foreground">
                              {msg.role === "user" ? "Paciente/Médico" : "IA Médica"}
                            </p>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {attachments && attachments.length > 0 && (
                      <div className="space-y-2 border-t pt-4">
                        <h4 className="text-sm font-semibold text-muted-foreground">
                          Anexos
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {attachments.map((attachment: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-2 border rounded-md text-sm flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="truncate">{attachment.filename || `Anexo ${idx + 1}`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
