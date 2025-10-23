import { useRef, useState } from "react";

export type ChatComposerProps = {
  onSend: (text: string) => Promise<void> | void;
  onFiles?: (files: File[]) => Promise<void> | void;
  uploadUrl?: string;
  transcribeUrl?: string;
  placeholder?: string;
  disabled?: boolean;
};

const ChatComposer: React.FC<ChatComposerProps> = ({
  onSend,
  onFiles,
  uploadUrl,
  transcribeUrl,
  placeholder = "Digite sua pergunta clínica…",
  disabled = false,
}) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // inputs ocultos
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);

  // Ditado (Web Speech API)
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Gravação (MediaRecorder)
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Upload helper
  async function uploadFiles(files: File[]) {
    if (!files?.length) return;
    // dispara pro seu fluxo
    if (onFiles) await onFiles(files);

    // e opcionalmente salva no backend
    if (uploadUrl) {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      try {
        await fetch(uploadUrl, { method: "POST", body: form });
      } catch {}
    }
  }

  // Handlers dos inputs
  function onPickFiles() {
    fileRef.current?.click();
  }
  function onPickCamera() {
    cameraRef.current?.click();
  }
  function onPickGallery() {
    galleryRef.current?.click();
  }

  function onInputFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) uploadFiles(files);
    e.target.value = "";
  }

  // Ditado em tempo real
  function hasSpeechApi() {
    return (
      typeof window !== "undefined" &&
      ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition)
    );
  }

  function toggleDictation() {
    if (isRecording) return;
    if (isDictating) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsDictating(false);
      return;
    }
    if (!hasSpeechApi()) {
      alert("Ditado em tempo real não suportado neste navegador. Use a gravação.");
      return;
    }
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (ev: any) => {
      let finalText = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) finalText += r[0].transcript + " ";
      }
      if (finalText) setText((prev) => (prev ? prev + " " : "") + finalText.trim());
    };
    rec.onend = () => setIsDictating(false);
    rec.onerror = () => setIsDictating(false);
    rec.start();
    recognitionRef.current = rec;
    setIsDictating(true);
  }

  // Gravação (pressione e segure no mic)
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      audioChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `audio_${Date.now()}.webm`, { type: "audio/webm" });
        await uploadFiles([file]);
        if (transcribeUrl) {
          const form = new FormData();
          form.append("file", file);
          try {
            const r = await fetch(transcribeUrl, { method: "POST", body: form });
            const d = await r.json();
            if (d?.text) setText((p) => (p ? p + " " : "") + d.text);
          } catch {}
        }
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      mediaRecorderRef.current = rec;
      setIsRecording(true);
    } catch {
      alert("Sem permissão para microfone.");
    }
  }

  function stopRecording() {
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
    setIsRecording(false);
  }

  // Enviar
  async function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await handleSend();
    }
  }

  async function handleSend() {
    const t = text.trim();
    if (!t || sending || disabled) return;
    setSending(true);
    try {
      await onSend(t);
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="w-full">
      {/* Barra estilo Whats/ChatGPT */}
      <div className="flex items-end gap-2 rounded-2xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900 shadow-sm">
        {/* Ícones à esquerda */}
        <div className="flex items-center gap-1 sm:gap-2 py-1">
          {/* Anexos */}
          <button
            onClick={onPickFiles}
            disabled={disabled}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 text-neutral-600 dark:text-neutral-400"
            title="Anexar arquivos"
            data-testid="button-attach-files"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 11-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          {/* Câmera direta (abre a câmera no celular) */}
          <button
            onClick={onPickCamera}
            disabled={disabled}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 text-neutral-600 dark:text-neutral-400"
            title="Câmera"
            data-testid="button-camera"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>

          {/* Galeria/Imagens existentes */}
          <button
            onClick={onPickGallery}
            disabled={disabled}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 text-neutral-600 dark:text-neutral-400"
            title="Galeria/Fotos"
            data-testid="button-gallery"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-3.5-3.5a2 2 0 0 0-3 0L7 18" />
            </svg>
          </button>

          {/* Mic: toque = ditado; segurar = gravação */}
          <button
            onClick={toggleDictation}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={disabled}
            className={`p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 ${
              isDictating
                ? "bg-green-50 dark:bg-green-900/20 text-[#3cb371]"
                : isRecording
                  ? "bg-red-50 dark:bg-red-900/20 text-red-500"
                  : "text-neutral-600 dark:text-neutral-400"
            }`}
            title={
              isRecording
                ? "Gravando… solte para enviar"
                : isDictating
                  ? "Ditando… toque para parar"
                  : "Toque para ditado • Segure para gravar"
            }
            data-testid="button-microphone"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 00-3 3v7a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        </div>

        {/* Caixa de texto */}
        <textarea
          className="flex-1 max-h-40 min-h-[44px] resize-none outline-none leading-6 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          data-testid="input-chat-message"
        />

        {/* Enviar */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending || disabled}
          className="ml-2 h-10 px-4 rounded-xl bg-[#3cb371] text-white disabled:opacity-50 hover:bg-[#2f9e62] active:scale-[.98] transition-all"
          title="Enviar"
          data-testid="button-send-message"
        >
          <span className="inline-flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Enviar
          </span>
        </button>
      </div>

      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 pl-1">
        Pressione <strong>Enter</strong> para enviar • <strong>Shift+Enter</strong> para quebrar linha
      </div>

      {/* Inputs ocultos */}
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,application/pdf,audio/*,video/*"
        className="hidden"
        onChange={onInputFiles}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onInputFiles}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onInputFiles}
      />
    </div>
  );
};

export default ChatComposer;
