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
- **Database**: PostgreSQL (Neon) com Drizzle ORM
- **Autenticação**: Replit Auth com Passport.js e OIDC
- **Storage**: DbStorage com persistência em PostgreSQL
- **Upload**: Multer para processamento de arquivos
- **Validação**: Zod para validação de dados
- **Sessões**: connect-pg-simple para sessões persistentes

### Estrutura de Dados (PostgreSQL + Drizzle)

**Pacientes (Tabela `patients`):**
```typescript
{
  id: serial (Primary Key);
  nome: varchar(255);
  cpf?: varchar(14);
  dataNascimento?: varchar(10);
  telefone?: varchar(20);
  endereco?: text;
  observacoes?: text;
  createdAt: timestamp (default: now());
}
```

**Usuários (Tabela `users`):**
```typescript
{
  id: serial (Primary Key);
  replitId: varchar(255) (unique);
  username: varchar(255);
  email?: varchar(255);
  firstName?: varchar(255);
  lastName?: varchar(255);
  createdAt: timestamp (default: now());
}
```

**Sessões (Tabela `sessions`):**
```typescript
{
  sid: varchar(255) (Primary Key);
  sess: json;
  expire: timestamp;
}
```

**Chat (In-memory):**
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

### Pacientes (CRUD Completo - PostgreSQL)
**GET /api/patients** - Lista todos os pacientes (persistidos no DB)
**GET /api/patients/:id** - Busca paciente por ID
**POST /api/patients** - Cria novo paciente (persiste no DB)
**PATCH /api/patients/:id** - Atualiza paciente (atualiza no DB)
**DELETE /api/patients/:id** - Remove paciente (deleta do DB)

### Autenticação (Replit Auth)
**GET /api/login** - Redireciona para login Replit Auth
**GET /api/callback** - Callback OAuth após autenticação
**GET /api/auth/user** - Retorna usuário autenticado atual (protegido)
**POST /api/logout** - Faz logout do usuário

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
DATABASE_URL=postgresql://... (auto-configurado pelo Replit)
SESSION_SECRET=... (auto-configurado pelo Replit Auth)
REPLIT_DB_URL=... (auto-configurado pelo Replit)
```

## Dependências Principais

**Backend:**
- openai: ^4.0.0
- express: ^4.18.2
- @neondatabase/serverless: PostgreSQL driver
- drizzle-orm: ORM para TypeScript
- drizzle-kit: CLI para migrações
- passport: Autenticação
- openid-client: OIDC para Replit Auth
- express-session: Gerenciamento de sessões
- connect-pg-simple: Sessões no PostgreSQL
- multer: Upload de arquivos

**Frontend:**
- react: ^18.x
- @tanstack/react-query: ^5.x
- wouter: Roteamento
- shadcn/ui: Componentes de UI
- zod: Validação de schemas

## Desenvolvimento

O projeto usa o padrão fullstack JavaScript com:
- Vite para desenvolvimento frontend
- Express para backend
- Hot reload automático
- TypeScript em todo o código
- Validação com Zod

## Status de Implementação

### ✅ Concluído (Fase Beta)
- ✅ Chat médico com IA (GPT-5)
- ✅ Análise de exames com visão computacional
- ✅ CRUD completo de pacientes
- ✅ **Persistência PostgreSQL (Neon)** - Pacientes salvos permanentemente
- ✅ **Infraestrutura Replit Auth** - Login, logout, sessões persistentes
- ✅ **Sistema de Histórico de Consultas** - Prontuário digital completo
- ✅ Sistema de cotas (50 consultas/dia)
- ✅ Modo claro/escuro
- ✅ Design médico profissional

### 🚧 Em Desenvolvimento
- ⏸️ Exportação de prontuários em PDF (próximo)
- ⏸️ Análise avançada de imagens médicas
- ⏸️ Dashboard com estatísticas

### 📋 Arquitetura de Autenticação

**Modo Atual:** Híbrido (Demo + Auth disponível)
- Aplicação funciona sem login obrigatório (modo demo)
- Infraestrutura Replit Auth completamente implementada:
  - Tabelas `users` e `sessions` criadas no PostgreSQL
  - Endpoints `/api/login`, `/api/callback`, `/api/logout`, `/api/auth/user`
  - Hook `useAuth()` disponível no frontend
  - Middleware `isAuthenticated` implementado
  - Landing page criada para não-autenticados

**Para ativar autenticação obrigatória:**
1. Atualizar `App.tsx` para usar `useAuth()` e renderizar `<Landing />` se não autenticado
2. Proteger rotas da API com middleware `isAuthenticated`
3. Adicionar botão de logout no header

## Funcionalidade: Sistema de Histórico de Consultas

O sistema agora oferece prontuário digital completo com:

### Salvar Consultas
- Seleção de paciente durante o atendimento
- Botão "Salvar Consulta" após conversa com a IA
- Armazena automaticamente:
  - Queixa principal (primeira mensagem)
  - Histórico completo da conversa
  - Anexos enviados (imagens, PDFs)
  - Data e hora do atendimento
  - ID do médico responsável

### Visualizar Histórico
- Página dedicada por paciente (`/pacientes/:id/historico`)
- Listagem cronológica de todas as consultas
- Visualização completa de cada atendimento:
  - Conversa user ↔ IA Médica
  - Anexos enviados
  - Data e responsável
- Botão "Histórico" na lista de pacientes

### Tecnologia
- **Armazenamento**: PostgreSQL com tabela `consultations`
- **Relacionamento**: Consultas vinculadas a pacientes (cascade delete)
- **Formato**: JSONB para histórico e anexos (flexível e performático)

## Observações Importantes

- Sistema em Beta Gratuito
- IA como ferramenta de apoio, não substitui julgamento médico
- **Todos os dados persistem no PostgreSQL** (pacientes e consultas não são perdidos)
- Limite de 50 consultas/uploads por dia por usuário
- Autenticação disponível mas não obrigatória no momento

**⚠️ AVISO DE SEGURANÇA (Beta/Demo):**
- As rotas da API atualmente **NÃO requerem autenticação** (modo demo)
- Para uso em produção com dados reais de pacientes (PHI - Protected Health Information), é **OBRIGATÓRIO**:
  1. Ativar autenticação obrigatória (adicionar `isAuthenticated` em todas as rotas sensíveis)
  2. Proteger endpoints de consultas, pacientes e chat
  3. Configurar HTTPS/TLS para criptografia em trânsito
  4. Implementar logs de auditoria para acesso a dados médicos
- A infraestrutura de auth está implementada, apenas aguardando ativação
