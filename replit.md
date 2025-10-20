# MédicoHelp - Assistente Médico com IA

## Visão Geral

MédicoHelp é uma plataforma médica profissional que utiliza inteligência artificial para auxiliar profissionais de saúde. O sistema oferece:

- **Atendimento Médico com IA**: Chat inteligente para consultas clínicas com histórico de conversação
- **Análise de Exames**: Upload e análise automática de imagens médicas (raio-x, laudos, etc.) usando GPT-5 Vision
- **Gestão de Pacientes**: Sistema completo de cadastro e gerenciamento de pacientes
- **Integração Memed**: Link direto para prescrição digital de receitas

## Arquitetura do Projeto

### Frontend (React + TypeScript)
- **Framework**: React com Wouter para roteamento
- **Design System**: Shadcn/ui + Tailwind CSS
- **Estado**: TanStack Query para gerenciamento de dados
- **Tema**: Suporte a modo claro/escuro com persistência
- **Cores**: Paleta médica profissional em tons de verde (#00B37E)

### Backend (Express + TypeScript)
- **Runtime**: Node.js com Express
- **IA**: OpenAI GPT-5 para chat médico e análise de imagens
- **Storage**: Memória (MemStorage) para pacientes e controle de cota
- **Upload**: Multer para processamento de arquivos
- **Validação**: Zod para validação de dados

### Estrutura de Dados

**Pacientes:**
```typescript
{
  id: string;
  nome: string;
  cpf?: string;
  dataNascimento?: string;
  telefone?: string;
  endereco?: string;
  observacoes?: string;
  createdAt: Date;
}
```

**Chat:**
```typescript
{
  message: string;
  history: { role: 'user' | 'assistant', content: string }[];
  userRole: 'doctor' | 'patient';
}
```

## Funcionalidades Principais

### 1. Atendimento Médico (Chat IA)
- Perguntas clínicas com contexto médico
- Histórico completo de conversação
- Suporte a anexos (imagens e PDFs)
- Limite de 50 consultas diárias por usuário

### 2. Análise de Exames
- Upload de múltiplos arquivos (até 10 por vez)
- Análise automática com GPT-5 Vision
- Suporte a imagens (JPEG, PNG) e PDFs
- Interpretação médica contextualizada

### 3. Gestão de Pacientes (CRUD Completo)
- **Create**: Cadastro completo de novos pacientes
- **Read**: Listagem e visualização de detalhes
- **Update**: Edição de informações do paciente
- **Delete**: Remoção com confirmação via AlertDialog
- Campos: nome, CPF, data de nascimento, telefone, endereço, observações
- Listagem organizada por data de cadastro (mais recentes primeiro)
- Integração com Memed para prescrições
- Feedback visual (toasts) para todas as operações

### 4. Sistema de Cotas
- Limite diário de 50 requisições
- Contador em tempo real no header
- Reset automático a cada dia
- Controle por usuário (userId)

## Endpoints da API

### Chat Médico
**POST /api/chat**
```json
{
  "message": "Qual o diagnóstico provável?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "userRole": "doctor"
}
```

### Upload de Arquivos
**POST /api/upload**
- Content-Type: multipart/form-data
- Campo: files[] (múltiplos arquivos)
- Header: X-User-Id

### Pacientes (CRUD Completo)
**GET /api/patients** - Lista todos os pacientes
**GET /api/patients/:id** - Busca paciente por ID
**POST /api/patients** - Cria novo paciente
**PATCH /api/patients/:id** - Atualiza paciente
**DELETE /api/patients/:id** - Remove paciente

Exemplo de criação:
```json
{
  "nome": "João da Silva",
  "cpf": "000.000.000-00",
  "dataNascimento": "1980-01-01",
  "telefone": "(11) 99999-9999",
  "endereco": "Rua Example, 123",
  "observacoes": "Alergia a penicilina"
}
```

## Design Guidelines

O sistema segue design médico profissional com:
- Cores primárias em verde médico (#00B37E)
- Tipografia Inter para clareza
- Espaçamento consistente e generoso
- Cards com bordas suaves e sombras sutis
- Feedback visual em todas as ações
- Estados de loading com skeletons
- Modo escuro otimizado para reduzir fadiga visual

## Variáveis de Ambiente

```
OPENAI_API_KEY=sk-... (obrigatório)
```

## Dependências Principais

- openai: ^4.0.0
- express: ^4.18.2
- multer: ^1.4.5-lts.1
- react: ^18.x
- @tanstack/react-query: ^5.x
- wouter: para roteamento
- shadcn/ui: componentes de UI

## Desenvolvimento

O projeto usa o padrão fullstack JavaScript com:
- Vite para desenvolvimento frontend
- Express para backend
- Hot reload automático
- TypeScript em todo o código
- Validação com Zod

## Próximas Fases (Não MVP)

- Autenticação de médicos com Replit Auth
- Persistência em PostgreSQL
- Histórico de consultas por paciente
- Exportação de prontuários em PDF
- Análise avançada de imagens médicas
- Dashboard com estatísticas

## Observações Importantes

- Sistema em Beta Gratuito
- IA como ferramenta de apoio, não substitui julgamento médico
- Dados armazenados em memória (reinicia ao recarregar servidor)
- Limite de 50 consultas/uploads por dia por usuário
