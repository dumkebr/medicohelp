# Como usar `VoiceCallButton.jsx` no seu app

1. Copie `client/VoiceCallButton.jsx` para a sua pasta de componentes do front.
2. Importe e coloque o botão na área superior do chat (exemplo):

```jsx
import VoiceCallButton from "./client/VoiceCallButton";

export default function TopBar() {
  return (
    <div className="flex items-center justify-between p-2 border-b">
      {/* ... outros botões (Clínico / Fundamentação Teórica) ... */}
      <div className="flex gap-2">
        <VoiceCallButton />
      </div>
    </div>
  );
}
```

3. Certifique-se de que o backend (server.js) esteja rodando e que o navegador tenha permissão de **microfone**.

## Dica
- Se quiser trocar a cor do botão, edite as classes Tailwind em `className`.
- A voz feminina é definida no backend (variável `REALTIME_VOICE`, ex.: `aria`).