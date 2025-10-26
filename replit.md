# MédicoHelp - AI Medical Assistant

## Overview
MédicoHelp is an AI-powered medical platform for healthcare professionals, offering AI medical consultations with conversation history, automatic analysis of medical images, comprehensive patient registration and management, and direct integration with Memed for digital prescriptions. The project aims to streamline diagnostic and administrative workflows, enhancing efficiency and accuracy for medical professionals, and positioning itself as a leading solution in AI-driven healthcare.

## User Preferences
I prefer simple language and clear explanations. I want iterative development with frequent updates and feedback. Ask before making major changes or architectural decisions. Do not make changes to the folder `Z` or the file `Y`.

## System Architecture

MédicoHelp utilizes a modern full-stack JavaScript architecture, prioritizing a professional UI/UX and robust backend.

**UI/UX Decisions:**
-   **Frameworks**: React with Wouter, Shadcn/ui, and Tailwind CSS.
-   **Branding & Identity**: Professional teal (`#00A79D`) color scheme. New SVG logos and "Dra. Clarice" as the AI medical assistant mascot with animations.
-   **Theming**: Dark/light mode support with the teal color palette.
-   **Chat Interface**: Modern layout with multimodal input (file upload, camera, gallery, microphone with transcription). Dra. Clarice mascot is present when no conversation is active.
-   **Medical Tools Modal**: Refined layout with tabs and fade-in animations.
-   **Sidebar Organization**: Intuitive navigation with main menu items, expandable search, and collapsible sections for patient management and history. Features "MédicoHelp" branding with bright teal "Help" text and a custom medical heart icon.
-   **TopControls Component**: Reusable tabbed interface for medical consultation workflow: "Clínico," "Explicação + Evidências," and advanced tools navigation.
-   **AdvancedHub**: Central hub (`/avancado`) for clinical calculators and advanced features in a responsive grid.
-   **Medical Calculators**: Interactive forms providing real-time calculations, interpretations, and copy/clear functions for various clinical assessments.

**Technical Implementations:**
-   **Frontend**: React, TanStack Query.
-   **Backend**: Node.js with Express.
-   **AI - Sistema Híbrido GPT-5**:
    -   **Primary Model**: GPT-5 with refined medical prompts.
    -   **New API Integration**: Uses `client.responses.create()` and `client.responses.stream()`.
    -   **Automatic Fallback Chain**: GPT-5 → GPT-4o (new API) → GPT-4o (legacy API).
    -   **Zero Restrictions**: Dra. Clarice responds to any subject, maintaining a professional medical tone when relevant.
    -   **Real-time Streaming**: Server-Sent Events (SSE) for chunk-by-chunk delivery.
-   **AI Tone**: Hybrid communication starting with an informal personalized greeting, followed by formal technical content using precise medical terminology and evidence-based references.
-   **Configuration System**: JSON-based configuration (`config/medicohelp.clinico.v1.json`) defines AI clinical response structure with mandatory sections and guardrails.
-   **Clinical Score Detector**: Semantic detection system (`server/clinical-detector.ts`) for instant responses to clinical scales/scores.
-   **Intent Detection System**: Expanded system (`server/intent-detector.ts`) to detect 7 types of medical intents using keyword, context, and priority weighting.
-   **Database**: PostgreSQL with Drizzle ORM.
-   **Authentication**: JWT for role-based access, Email/Password, OAuth (Google, Apple, Microsoft, GitHub), and 6-digit verification codes.
-   **Storage**: DbStorage (PostgreSQL), Multer for file uploads.
-   **Validation**: Zod for data schema validation.
-   **Security**: Rate limiting using `express-rate-limit`.

**Feature Specifications:**
-   **AI Medical Chat with Dual-Mode System (GPT-5 Powered)**:
    -   **Modo Clínico (DEFAULT)**: Direct clinical decision support with structured format (Impression/Context, Conduct/Direct response, Alerts/Observations, CID).
    -   **Modo Avançado (Explicativo + Evidências)**: Didactic explanations with evidence-based references and PubMed integration.
    -   **No Topic Filters**: Responds to any subject, maintaining medical terminology.
    -   **Personalized Greeting System**: AI responses begin with an informal greeting using the physician's first name.
    -   **Session Management**: Auto-save with intelligent titles and new consultations opening in the same page.
-   **Real-Time Voice Calls with Dra. Clarice**: Full-duplex voice communication using WebRTC and OpenAI Realtime API, featuring a feminine "aria" voice and barge-in support.
-   **MedPrime - Ferramentas Médicas Avançadas**: Professional visual card and dedicated page (`/medprime`) for advanced medical tools, including clinical calculators and AI diagnostic support.
-   **Histórico de Atendimentos**: Manages multiple medical consultations with sidebar navigation, search, smart titling, and optional patient association.
-   **Exam Analysis**: Multi-file upload for automatic analysis and contextual medical interpretation.
-   **Patient Management**: CRUD operations for patient data, integrated with Memed.
-   **Clinical Evidence**: Provides scientific literature from PubMed in Explanatory Mode.
-   **Medical Professional Tools**: 16 medical calculators with dynamic forms, severity-colored interpretation, and calculation history, plus an interactive Partograma for labor progression visualization.

**System Design Choices:**
-   **Data Structures**: PostgreSQL + Drizzle ORM for `patients`, `users`, `user_settings`, `consultations`, `research_analytics`, and `medical_tools_audit` tables.
-   **localStorage Data Structures**: Keys for `mh_atendimentos`, `mh_current_atendimento_id`, `mh_showPatientMgmt`, `medicohelp_mode`, `medicohelp_evidence`, and `calc_history`.
-   **Microservices Backend (V6)**: Optional separate Node.js backend (`medicohelp-backend/`) for advanced admin features: KB management via API, centralized analytics in SQLite, sales reporting, and medical protocols versioning.

## Recent Updates

### PWA - Progressive Web App (Oct 26, 2025)
-   **Installable Mobile App**: Full PWA configuration with manifest.json, service-worker.js, and iOS meta tags
-   **Offline Support**: Service Worker with cache-first strategy for offline functionality
-   **Mobile Installation**: "Add to Home Screen" support for Android (Chrome/Edge) and iOS (Safari)
-   **App Features**: Standalone display mode, teal theme color (#00A79D), custom app shortcuts (Nova Consulta, MedPrime)
-   **iOS Optimization**: Apple touch icons, status bar styling, and mobile-web-app-capable meta tags
-   **Cache Strategy**: Precache static assets (index, favicon, logos, config) + runtime cache for dynamic content
-   **Deployment**: VPS deployment at www.medicohelp.com.br (72.61.219.66) via GitHub Actions SFTP workflow

### V7 Integration (Oct 24, 2025)
-   **Site Estático Completo**: 6 páginas HTML integradas (index, cadastro, termos, privacidade, admin, admin-api)
-   **Assets Profissionais**: 7 imagens high-res (hero1, chat1, logos, Clarice mascot)
-   **Modal "Conhecer Recursos"**: Hero Clarice + FeaturesSection com 12 cards clicáveis, animações fade-in/slide-up
-   **Componentes React Novos**: HeroClarice.tsx, FeaturesSection.tsx
-   **KB V7 com index.json**: Sistema modular atualizado com manifest e fallback automático
-   **Clarice Brain**: server/clarice_brain.js integrado, client/lib atualizado

### Knowledge Base & Admin System
-   **KB V5 (Modular)**: 4-category system (geral, assinatura, conta, tecnico) with intelligent scoring algorithm (100pts exact, 50pts starts-with, 10pts contains)
-   **Interactive Buttons**: HTML buttons in KB responses with data-action handlers (e.g., cancelar_assinatura, trocar_email)
-   **Analytics System**: localStorage logging with export function, tracks all user questions for improvement
-   **Painel Admin Local**: Standalone HTML (`/admin.html`) for KB management, log viewing, and CSV sales processing
-   **Painel Admin API**: API-connected version (`/admin-api.html`) consumes backend microservice when available

### Legal Documentation  
-   **V4.1 Simplified**: Ultra-condensed HTML (1 paragraph) for quick acceptance, full PDFs for legal archive
-   **Legal Validity Note**: Explicit reference to Art. 107 CC + Arts. 7º/10 Marco Civil for electronic acceptance
-   **Official CNPJ**: 63.354.382/0001-71 included throughout
-   **Company**: C.J.Dumke Tecnologia e Saúde LTDA / MEI, Foro: Paranavaí-PR

### Backend Microservice V6 (Optional)
-   **Location**: `medicohelp-backend/` (separate Node.js project)
-   **Database**: SQLite (`data/medicohelp.db`) with users, logs, sales, protocols tables
-   **APIs**: REST endpoints for KB CRUD, analytics, sales reporting, protocol versioning
-   **Auth**: Simple token-based (header: `x-auth`)
-   **Roles**: admin (full access) and editor (KB/protocols only)
-   **Default credentials**: admin@medicohelp.com.br / medicohelp-admin
-   **Port**: 3001 (configurable via .env)
-   **Setup**: `cd medicohelp-backend && npm install && npm start`

## External Dependencies

-   **OpenAI API**: GPT-4o, GPT-5 Vision, Realtime API (voice calls).
-   **Neon**: Managed PostgreSQL database.
-   **Memed**: Digital prescription integration.
-   **PubMed (NIH/NCBI E-utilities)**: Scientific literature search.
-   **Resend / SMTP**: Email delivery.
-   **Twilio**: SMS delivery.
-   **Google OAuth**: User authentication.
-   **Apple OAuth**: User authentication.
-   **Microsoft OAuth**: User authentication.
-   **GitHub OAuth**: User authentication.