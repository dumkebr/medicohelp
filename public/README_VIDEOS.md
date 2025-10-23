# Vídeos da Dra. Clarice (Mascote)

## Arquivos Necessários

Para ativar a mascote animada, você precisa adicionar os seguintes vídeos nesta pasta (`public/`):

### 1. **clarice-idle.webm**
- Vídeo da Dra. Clarice em estado "parado" (idle)
- Usado quando o sistema não está processando
- Formato: WebM (recomendado para web)
- Duração sugerida: 3-5 segundos em loop

### 2. **clarice-talking.webm**
- Vídeo da Dra. Clarice "falando"
- Usado quando o sistema está processando/respondendo
- Formato: WebM (recomendado para web)
- Duração sugerida: 2-4 segundos em loop

## Arquivos de Fallback (Já Incluídos)

Os seguintes arquivos PNG já estão incluídos como fallback caso os vídeos não carreguem:

- ✅ `clarice-idle-fallback.png` - Imagem estática para modo idle
- ✅ `clarice-talking-fallback.png` - Imagem estática para modo falando

## Especificações Técnicas

### Formato Recomendado: WebM
- Codec de vídeo: VP8 ou VP9
- Resolução: 280px de largura (altura proporcional)
- FPS: 24-30
- Qualidade: Alta (para preservar detalhes da animação)

### Conversão para WebM

Se você tiver vídeos em outro formato, pode converter usando FFmpeg:

```bash
# Converter para WebM (VP9, boa qualidade)
ffmpeg -i clarice-idle.mp4 -c:v libvpx-vp9 -b:v 1M -c:a libopus clarice-idle.webm

# Converter para WebM (VP8, compatibilidade)
ffmpeg -i clarice-talking.mp4 -c:v libvpx -b:v 1M -c:a libvorbis clarice-talking.webm
```

## Como o Sistema Funciona

1. **Estado Inicial (sem mensagens)**:
   - Exibe `clarice-idle.webm` em loop
   - Mostra texto de boas-vindas: "Olá, eu sou a Dra. Clarice"

2. **Durante processamento**:
   - Alterna para `clarice-talking.webm` em loop
   - Indica visualmente que o sistema está trabalhando

3. **Fallback automático**:
   - Se os vídeos .webm não carregarem
   - Sistema usa automaticamente os PNG fallback

## Status Atual

- ⏳ **Vídeos WebM**: Aguardando upload
- ✅ **Fallback PNG**: Incluídos e funcionando
- ✅ **Componente React**: Implementado e pronto
- ✅ **Integração**: Completa na página de atendimento

## Após Adicionar os Vídeos

1. Coloque os arquivos `.webm` nesta pasta (`public/`)
2. Reinicie o servidor (se necessário)
3. Acesse `/atendimento`
4. A mascote animada aparecerá automaticamente!

---

**Nota**: Os vídeos devem ser otimizados para web (tamanho pequeno, boa compressão) para garantir carregamento rápido.
