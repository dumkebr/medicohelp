import { useRef, useState, useEffect } from "react";
import { Camera, Mic, MicOff, MessageSquare, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type AttachmentBarProps = {
  onFilesSelected?: (files: File[]) => void;
  onTextFromSpeech?: (text: string) => void;
  disabled?: boolean;
};

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function AttachmentBar({
  onFilesSelected,
  onTextFromSpeech,
  disabled = false,
}: AttachmentBarProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Ditado (Web Speech API)
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Gravação de áudio
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Inicializar Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "pt-BR";

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          }
        }
        if (finalTranscript && onTextFromSpeech) {
          onTextFromSpeech(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Erro no reconhecimento de voz:", event.error);
        setIsDictating(false);
        if (event.error !== "no-speech" && event.error !== "aborted") {
          toast({
            variant: "destructive",
            title: "Erro no ditado",
            description: "Não foi possível reconhecer a fala. Verifique as permissões do microfone.",
          });
        }
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTextFromSpeech, toast]);

  // Toggle ditado
  const handleToggleDictation = () => {
    if (!recognitionRef.current) {
      toast({
        variant: "destructive",
        title: "Não suportado",
        description: "Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.",
      });
      return;
    }

    if (isDictating) {
      recognitionRef.current.stop();
      setIsDictating(false);
    } else {
      recognitionRef.current.start();
      setIsDictating(true);
      toast({
        title: "🎤 Ditado ativado",
        description: "Fale naturalmente. O texto aparecerá automaticamente.",
      });
    }
  };

  // Tirar foto (câmera)
  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  // Upload de arquivos
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Processar arquivos selecionados
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0 && onFilesSelected) {
      onFilesSelected(selectedFiles);
    }
    // Limpar input
    event.target.value = "";
  };

  // Gravar áudio
  const handleToggleRecording = async () => {
    if (isRecording) {
      // Parar gravação
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } else {
      // Iniciar gravação
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, {
            type: "audio/webm",
          });

          if (onFilesSelected) {
            onFilesSelected([audioFile]);
          }

          // Parar stream
          stream.getTracks().forEach((track) => track.stop());
          setIsRecording(false);

          toast({
            title: "✓ Áudio gravado",
            description: "O áudio será transcrito automaticamente.",
          });
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);

        toast({
          title: "🎙️ Gravando áudio",
          description: "Fale sua mensagem. Clique novamente para parar.",
        });
      } catch (error) {
        console.error("Erro ao acessar microfone:", error);
        toast({
          variant: "destructive",
          title: "Erro ao gravar",
          description: "Não foi possível acessar o microfone. Verifique as permissões.",
        });
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Upload de arquivos */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUploadClick}
            disabled={disabled}
            data-testid="button-upload-files"
            className="h-8"
          >
            <Upload className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Anexar arquivos (imagens, PDFs)</p>
        </TooltipContent>
      </Tooltip>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {/* Câmera (tirar foto) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCameraClick}
            disabled={disabled}
            data-testid="button-camera"
            className="h-8"
          >
            <Camera className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Tirar foto</p>
        </TooltipContent>
      </Tooltip>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {/* Ditado por voz */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isDictating ? "default" : "ghost"}
            size="sm"
            onClick={handleToggleDictation}
            disabled={disabled}
            data-testid="button-dictation"
            className="h-8"
          >
            <MessageSquare className="w-4 h-4" />
            {isDictating && <span className="ml-1 text-xs">●</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isDictating ? "Parar ditado" : "Ditar texto (falar)"}</p>
        </TooltipContent>
      </Tooltip>

      {/* Gravar áudio */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="sm"
            onClick={handleToggleRecording}
            disabled={disabled}
            data-testid="button-record-audio"
            className="h-8"
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isRecording && <span className="ml-1 text-xs">●</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isRecording ? "Parar gravação" : "Gravar áudio"}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
