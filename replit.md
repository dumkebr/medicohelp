# MédicoHelp - Assistente Médico com IA

## Overview
MédicoHelp is a professional medical platform designed to assist healthcare professionals with AI-powered tools. It provides AI medical consultations with conversation history, automatic analysis of medical images using GPT-5 Vision, a comprehensive patient registration and management system, and direct integration with Memed for digital prescription. The project aims to enhance diagnostic and administrative workflows for medical professionals.

## User Preferences
I prefer simple language and clear explanations. I want iterative development with frequent updates and feedback. Ask before making major changes or architectural decisions. Do not make changes to the folder `Z` or the file `Y`.

## System Architecture

MédicoHelp is built with a modern full-stack JavaScript architecture.

**Configuration System:**
- **Clinical Mode Config**: `config/medicohelp.clinico.v1.json` - JSON-based configuration for AI clinical responses
  - Defines response structure with 5 mandatory sections (1️⃣ Avaliar estabilidade → 5️⃣ Seguimento)
  - Guardrails system: prevents AI from inventing vitals, forces asking for missing data (PA, FC, peso, idade)
  - Template loader: `server/config-loader.ts` loads and caches config at startup
  - Applied to all clinical mode (modo clínico) conversations via system prompt injection

**UI/UX Decisions:**
- **Framework**: React with Wouter for routing.
- **Design System**: Shadcn/ui and Tailwind CSS for a professional, consistent UI.
- **Theming**: Dark/light mode support with persistence (automatic via `prefers-color-scheme`).
- **Color Palette**: Professional medical green (#3cb371).
- **Design Guidelines**: Professional medical design with Inter typography, consistent spacing, subtle shadows, and visual feedback.
- **Chat Interface**: Modern clean layout with fixed header (controls), scrollable thread (bubble messages), and fixed composer (similar to ChatGPT/Claude).
- **Medical Tools Modal**: Refined layout with compact header, tab bar (#f8f9f9 background), 3px green underline on active tab, minimal gap (8px) between tabs and content, no scroll overflow issues, smooth fade-in animations (200ms) between tab switches, and full dark mode support.
- **Sidebar Organization**: Menu Principal with 4 items (Atendimento médico, Sobre, Novo atendimento, Buscar), expandable search field, collapsible sections (Gestão de Pacientes, Atendimentos Salvos, Histórico).
- **TopControls Component**: Reusable tabbed interface for atendimento workflow with three modes:
  - **Clínico Tab**: Default view for AI medical chat
  - **Explicação + Evidências Tab**: Shows evidence panel with educational information
  - **Calculadoras Tab**: Quick access to 13 clinical calculators (CURB-65, Wells, CHA₂DS₂-VASc, etc.)
  - Includes save button, title display, and responsive tab layout
  - Demo available at `/demo-top-controls` (publicly accessible)

**Technical Implementations:**
- **Frontend:**
  - State Management: TanStack Query.
- **Backend:**
  - **Runtime**: Node.js with Express.
  - **AI**: OpenAI GPT-4o for medical chat, GPT-5 Vision for image analysis and scientific summaries.
  - **Clinical Score Detector**: Semantic detection system (`server/clinical-detector.ts`) that intercepts queries about clinical scales/scores BEFORE calling OpenAI, returning structured responses instantly (~4ms vs ~3000ms). Recognizes 14 calculators with keyword variations (e.g., "alvarado", "alvorado", "alvorada") and contextual indicators ("escala", "score", "calcular").
  - **Streaming**: Server-Sent Events (SSE) for real-time chat responses with exponential backoff retry.
  - **Database**: PostgreSQL (Neon) with Drizzle ORM.
  - **Authentication**: JWT for role-based access control, Email/Password with bcrypt, OAuth (Google, Apple, Microsoft, GitHub), 6-digit verification codes.
  - **Storage**: DbStorage with PostgreSQL persistence.
  - **File Upload**: Multer.
  - **Validation**: Zod for data schema validation.
  - **Rate Limiting**: Daily request limits using `express-rate-limit`.
  - **SPA Routing**: `connect-history-api-fallback` middleware.

**Feature Specifications:**
- **Frontend Authentication UI**: Complete auth flow with protected routes and user profile management.
- **AI Medical Chat with Dual-Mode System**:
  - **Modo Clínico (DEFAULT)**: Quick clinical checklist format with structured action steps using emoji indicators (⚡, 1️⃣, 2️⃣, etc.). Optimized for rapid decision-making during clinical shifts.
    - **Guardrails System (config/medicohelp.clinico.v1.json)**:
      - **Never Invent**: AI NEVER invents vital signs, age, weight, or clinical stability assumptions
      - **Ask If Missing**: If PA, FC, peso, idade, or other critical data needed for dosing → AI ASKS first using polite prompts
      - **Example prompts**: "Para definir a conduta corretamente, poderia me informar os sinais vitais atuais do paciente?"
      - **Guidelines**: MUST follow SBC/AMB/CFM, ESC/AHA/ACC, UpToDate, BMJ, Medscape
      - **Mandatory Format**: Use "⚠️ Evitar se" for contraindications, structured dose format
    - **Structured Sections**: 1️⃣ Avaliar estabilidade → 2️⃣ Conduta principal → 3️⃣ Investigar causas → 4️⃣ Suporte → 5️⃣ Seguimento
  - **Modo Explicativo + Evidências**: Educational explanations in natural flowing text with mandatory bibliographic references section (📚 Evidências clínicas). Integrates PubMed evidence when available.
  - **Automatic Trigger Detection**: Switches mode based on user input keywords (e.g., "explica", "por quê").
  - **User Control**: Simplified frontend toggle system - "Clínico" button vs "Explicação + Evidências" toggle.
  - **Response Formats**:
    - Clinical: "⚡ CONDUTA CLÍNICA RÁPIDA" with 5-7 numbered action steps
    - Explanatory: Flowing educational text + "📚 Evidências clínicas:" section with guidelines and references
  - **Technical**: SSE streaming for real-time responses, full conversation history, attachment support.
- **Histórico de Atendimentos (localStorage)**:
  - **Multiple Conversations**: Create and manage multiple medical consultations, each saved independently in localStorage.
  - **Sidebar Navigation**: Visual list of all saved consultations with title, timestamp, and patient link indicator.
  - **Menu Principal**: Reorganized structure with "Novo atendimento" and "Buscar em atendimentos" in main menu.
  - **Search Feature**: Inline expandable search field for finding consultations by complaint, CID, patient name, or date.
  - **Collapsible History**: History section with toggle (expand/collapse) for better space management.
  - **Smart Titles**: First user message automatically becomes the title (editable inline).
  - **Patient Association**: Link consultations to patients (optional, controlled by Patient Management toggle).
  - **Mode Persistence**: Each consultation remembers its mode (Clinical/Explanatory).
  - **Automatic Saving**: All messages auto-saved to localStorage after each AI response.
  - **Quick Actions**: Create new consultation, switch between conversations, delete consultations, rename titles.
  - **Data Structure**: Stored in `mh_atendimentos` key with full message history, metadata, and timestamps.
- **Exam Analysis**: Multi-file upload, automatic analysis with GPT-5 Vision, contextual medical interpretation.
- **Patient Management (CRUD)**: Complete patient lifecycle management, integrated with Memed for prescriptions. Optional toggle in sidebar to show/hide patient features.
- **Clinical Evidence**: Provides scientific literature from PubMed (NIH/NCBI E-utilities), integrated into Explanatory Mode, with a legacy toggle for explicit display.
- **Consultation History System**: Saves patient consultations, chat history, attachments, and physician details in PostgreSQL (JSONB).
- **Medical Professional Tools**: Six specialized clinical decision support tools for physicians and medical students:
  - **Posologia**: Simplified placeholder with "PosologiaCerta" branding (beta notice, no backend).
  - **Calculadoras Clínicas**: 16 medical calculators with friendly forms and interpretation:
    - **Clinical (11)**: CURB-65, Alvarado, Wells TVP/TEP, CHA₂DS₂-VASc, HAS-BLED, qSOFA, SIRS, GCS, IMC, **Gasometria Arterial/Venosa**
    - **Obstetric (5)**: IG por DUM/DPP/USG, Escore de Bishop (pré-indução), Apgar (1' e 5')
    - **Features**: Dynamic forms, severity-colored interpretation, copy/print actions, localStorage history (last 20), medical disclaimer
    - **Gasometria**: Complete blood gas analysis with automatic acid-base disturbance detection, AG calculation (with albumin correction), Winter's formula, compensation calculations, Delta/Delta ratio for mixed disorders, oxygenation analysis (PAO₂, A-a gradient, PaO₂/FiO₂), venous-to-arterial conversion
  - **Partograma**: Interactive labor partogram with Recharts visualization:
    - **Data Points**: Time, cervical dilation (0-10cm), fetal station, FHR, blood pressure, notes
    - **Alert/Action Lines**: Configurable parameters (default: 4cm start, 1cm/h rate, 2h action offset)
    - **Visualization**: Recharts line chart with patient evolution vs alert/action reference lines
    - **Attention System**: Badge indicator when patient curve crosses action line
    - **Export**: Multi-format export (PNG/PDF/JSON) using html2canvas and jsPDF
    - **Persistence**: localStorage for data retention across sessions
  - **Conduta**: Evidence-based management plans.
  - **Solicitação de Exames**: Intelligent exam ordering.
  - **Diagnósticos Diferenciais**: Comprehensive differential diagnosis generation.
  - **Technical**: Role-based access control, dedicated rate limiting, audit logging.

**System Design Choices:**
- **Data Structures (PostgreSQL + Drizzle):**
  - `patients`: Patient details.
  - `users`: User authentication, roles, and CRM.
  - `user_settings`: User preferences (documentation style, custom templates, explanatory mode settings).
  - `consultations`: Detailed consultation records.
  - `research_analytics`: Optional logging for clinical evidence feature.
  - `medical_tools_audit`: Audit log for medical tools usage.
- **localStorage Data Structures:**
  - `mh_atendimentos`: Array of consultation objects (id, title, messages[], createdAt, updatedAt, mode, patientId, saved).
  - `mh_current_atendimento_id`: Currently active consultation ID.
  - `mh_showPatientMgmt`: Boolean toggle for showing/hiding patient management features.
  - `medicohelp_mode`: Persisted mode preference (clinico/explicativo).
  - `medicohelp_evidence`: Evidence display preference.
  - `calc_history`: Calculator results history (last 20 calculations).
- **Retention Policy:**
  - Atendimentos with `saved: true` or `patientId` are **never automatically deleted**.
  - Atendimentos without patient and not marked as saved **expire in 30 days**.
  - Cleanup runs automatically when listing atendimentos.
  - Vincular paciente auto-marca como `saved: true`.

## External Dependencies

- **OpenAI API**: For GPT-4o and GPT-5 Vision (AI medical chat, image analysis, scientific summaries).
- **Neon (PostgreSQL)**: Managed PostgreSQL database service.
- **Memed**: Digital prescription integration.
- **PubMed (NIH/NCBI E-utilities)**: For scientific literature search.
- **Resend / SMTP**: For email delivery.
- **Twilio**: For SMS delivery.
- **Google OAuth**: For user authentication.
- **Apple OAuth**: For user authentication.
- **Microsoft OAuth**: For user authentication.
- **GitHub OAuth**: For user authentication.