# MédicoHelp - Assistente Médico com IA

## Overview
MédicoHelp is a professional medical platform designed to assist healthcare professionals with AI-powered tools. It provides AI medical consultations with conversation history, automatic analysis of medical images using GPT-5 Vision, a comprehensive patient registration and management system, and direct integration with Memed for digital prescription. The project aims to enhance diagnostic and administrative workflows for medical professionals.

## User Preferences
I prefer simple language and clear explanations. I want iterative development with frequent updates and feedback. Ask before making major changes or architectural decisions. Do not make changes to the folder `Z` or the file `Y`.

## System Architecture

MédicoHelp is built with a modern full-stack JavaScript architecture.

**UI/UX Decisions:**
- **Framework**: React with Wouter for routing.
- **Design System**: Shadcn/ui and Tailwind CSS for a professional, consistent UI.
- **Theming**: Dark/light mode support with persistence (automatic via `prefers-color-scheme`).
- **Color Palette**: Professional medical green (#3cb371).
- **Design Guidelines**: Professional medical design with Inter typography, consistent spacing, subtle shadows, and visual feedback.
- **Chat Interface**: Modern clean layout with fixed header (controls), scrollable thread (bubble messages), and fixed composer (similar to ChatGPT/Claude).
- **Medical Tools Modal**: Refined layout with compact header, tab bar (#f8f9f9 background), 3px green underline on active tab, minimal gap (8px) between tabs and content, no scroll overflow issues, smooth fade-in animations (200ms) between tab switches, and full dark mode support.

**Technical Implementations:**
- **Frontend:**
  - State Management: TanStack Query.
- **Backend:**
  - **Runtime**: Node.js with Express.
  - **AI**: OpenAI GPT-4o for medical chat, GPT-5 Vision for image analysis and scientific summaries.
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
  - **Modo Clínico (DEFAULT)**: Medical scribe for structured clinical documentation (Tradicional, SOAP, Personalizado formats). Returns only structured content without explanations.
  - **Modo Explicativo**: Educational assistant providing detailed explanations, pathophysiology, and clinical reasoning. Can silently integrate PubMed evidence.
  - **Automatic Trigger Detection**: Switches mode based on user input keywords (e.g., "explica", "por quê").
  - **User Control**: Frontend toggle buttons for mode selection.
  - **Technical**: SSE streaming for real-time responses, full conversation history, attachment support.
- **Exam Analysis**: Multi-file upload, automatic analysis with GPT-5 Vision, contextual medical interpretation.
- **Patient Management (CRUD)**: Complete patient lifecycle management, integrated with Memed for prescriptions.
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