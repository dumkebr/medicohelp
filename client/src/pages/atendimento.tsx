import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send, Paperclip, Loader2, FileImage, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { FileAttachment } from "@shared/schema";

interface ChatHistoryItem {
  user: string;
  assistant: string;
}

export default function Atendimento() {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; history: any[] }) => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": "demo-doctor",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao processar mensagem");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      setHistory(prev => [...prev, {
        user: variables.message,
        assistant: data.answer
      }]);
      setMessage("");
      setFiles([]);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao processar mensagem",
        description: error.message || "Tente novamente mais tarde.",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          "X-User-Id": "demo-doctor",
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro no upload");
      }
      return response.json();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message || "Não foi possível enviar os arquivos.",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 10);
      setFiles(newFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!message.trim() && files.length === 0) return;

    let enrichedMessage = message;

    if (files.length > 0) {
      const formData = new FormData();
      files.forEach(file => formData.append("files", file));

      try {
        const uploadResult = await uploadMutation.mutateAsync(formData);
        const attachmentText = uploadResult.attachments
          .map((a: FileAttachment) => `- ${a.filename}`)
          .join("\n");
        enrichedMessage = message
          ? `${message}\n\n[Anexos enviados:\n${attachmentText}]`
          : `[Anexos enviados:\n${attachmentText}]`;
      } catch (error) {
        return;
      }
    }

    const chatHistory = history.flatMap(h => [
      { role: "user" as const, content: h.user },
      { role: "assistant" as const, content: h.assistant },
    ]);

    chatMutation.mutate({
      message: enrichedMessage,
      history: chatHistory,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLoading = chatMutation.isPending || uploadMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Atendimento Médico com IA</h1>
        <p className="text-muted-foreground">
          Faça perguntas clínicas e envie imagens de exames para análise
        </p>
      </div>

      {history.length > 0 && (
        <Card data-testid="card-chat-history">
          <CardContent className="p-6 space-y-6">
            {history.map((item, index) => (
              <div key={index} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-primary">Você:</p>
                  <p className="text-sm whitespace-pre-wrap">{item.user}</p>
                </div>
                <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-primary">Médico Help:</p>
                  <p className="text-sm whitespace-pre-wrap">{item.assistant}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-chat-input">
        <CardContent className="p-6 space-y-4">
          <Textarea
            placeholder="Digite sua pergunta clínica... (Ctrl+Enter para enviar)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] resize-none"
            disabled={isLoading}
            data-testid="input-chat-message"
          />

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <Badge key={index} variant="secondary" className="gap-2 pr-1">
                  <FileImage className="w-3 h-3" />
                  <span className="text-xs">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-destructive/20"
                    onClick={() => removeFile(index)}
                    data-testid={`button-remove-file-${index}`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-input")?.click()}
                disabled={isLoading}
                data-testid="button-attach-files"
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Anexar arquivos
              </Button>
              <input
                id="file-input"
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              <span className="text-xs text-muted-foreground">
                Até 10 arquivos (imagens ou PDF)
              </span>
            </div>

            <Button
              onClick={handleSend}
              disabled={isLoading || (!message.trim() && files.length === 0)}
              data-testid="button-send-message"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
