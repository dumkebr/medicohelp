# MédicoHelp - Assistente Médico com IA

## Overview

MédicoHelp is a professional medical platform that leverages artificial intelligence to assist healthcare professionals. The system offers: AI-powered medical consultations with conversation history, automatic analysis of medical images (X-rays, reports, etc.) using GPT-5 Vision, a complete patient registration and management system, and direct integration with Memed for digital prescription of recipes. The project aims to provide a robust AI assistant for medical professionals, enhancing diagnostic and administrative workflows.

## User Preferences

I prefer simple language and clear explanations. I want iterative development with frequent updates and feedback. Ask before making major changes or architectural decisions. Do not make changes to the folder `Z` or the file `Y`.

## AI Behavior: Dual-Mode System

MédicoHelp AI operates in **two distinct modes** selected via frontend toggle:

### 🩺 Modo Clínico (Clinical Mode) - **DEFAULT**

**Role**: Medical scribe / Registrador médico - for clinical documentation only.

**Behavior**:
- Returns ONLY structured clinical content (no explanations, no teaching)
- Direct and objective responses for medical charts/notes
- Follows selected documentation style: Tradicional, SOAP, or Personalizado
- NO introductions, commentary, or theoretical explanations
- User always interpreted as physician writing documentation

**Forbidden in Clinical Mode**:
- ❌ "Espero que isso ajude" / didactic phrases
- ❌ "Recomendo que..." / generic advice
- ❌ Teaching content or literature reviews
- ❌ Any explanations beyond what's needed for the chart

**Response Formats**:

*Tradicional MédicoHelp*:
```
**QUEIXA PRINCIPAL:** [brief chief complaint]
**HISTÓRIA CLÍNICA:** [concise clinical history]
**EXAME FÍSICO:** [objective physical exam findings]
**CONDUTA:** [clear management plan]
```

*SOAP*:
```
**SUBJETIVO:** [patient's perspective]
**OBJETIVO:** [examination findings]
**AVALIAÇÃO:** [diagnosis and clinical reasoning]
**PLANO:** [management plan]
```

*Personalizado*: User-defined template from profile settings.

**Length**: 100-400 words, concise and structured.

---

### 📘 Modo Explicativo (Explanatory Mode)

**Role**: Educational assistant for learning and clinical reasoning.

**Behavior**:
- Provides detailed explanations with scientific foundations
- Explains pathophysiology, guidelines, and clinical reasoning
- Educational tone with teaching content
- Can access PubMed evidence if enabled in user profile (silent integration)
- Longer, more comprehensive responses

**Automatic Trigger Detection**: Mode automatically switches if user input contains:
- "explica", "me ensina", "justifica", "por quê"
- "evidência", "estudo", "artigo", "pesquisa"
- "fundamento", "fisiopatologia"

**Evidence Integration** (if enabled in profile):
- Silently fetches scientific references from PubMed
- Integrates evidence into explanation without visible citations
- Enriches educational content with current research
- No UI indication of evidence fetching (seamless)

**Configuration**: User can enable/disable evidence search in profile settings.

**Length**: 400-800 words, comprehensive and educational.

---

**Language**: Portuguese (Brasil) with professional medical terminology (both modes)

**Mode Persistence**: Selected mode persists during session, user can toggle anytime.

## System Architecture

MédicoHelp is built with a modern full-stack JavaScript architecture.

**Frontend:**
- **Framework**: React with Wouter for routing.
- **Design System**: Shadcn/ui and Tailwind CSS for a professional, consistent UI.
- **State Management**: TanStack Query.
- **Theming**: Dark/light mode support with persistence.
- **Color Palette**: Professional medical green (#00B37E).

**Backend:**
- **Runtime**: Node.js with Express.
- **AI**: OpenAI GPT-4o for medical chat (with SSE streaming), GPT-5 Vision for image analysis and scientific summaries.
- **Streaming**: Server-Sent Events (SSE) for real-time chat responses with exponential backoff retry (3 attempts, 2s base delay, 45s timeout).
- **Database**: PostgreSQL (Neon) with Drizzle ORM.
- **Authentication**:
  - JWT for role-based access control.
  - Email/Password with bcrypt (10 salt rounds).
  - OAuth with Google, Apple, Microsoft, GitHub (Passport.js), supporting automatic email linking.
  - Verification by 6-digit codes (email/SMS) for signup and password reset.
- **Storage**: DbStorage with PostgreSQL persistence.
- **File Upload**: Multer.
- **Validation**: Zod for data schema validation.
- **Rate Limiting**: Daily request limits (10 per IP) using `express-rate-limit`.
- **SPA Routing**: connect-history-api-fallback middleware for proper SPA routing (serves index.html for non-API routes while preserving API/auth/static endpoints).

**Key Features & Technical Implementations:**
- **Frontend Authentication UI**: Complete auth flow with login, register (with conditional CRM/UF for doctors), forgot password, and 6-digit verification code pages. Protected route guards with redirect preservation. User profile management with avatar upload.
- **AI Medical Chat with Dual-Mode System**: 
  - **Modo Clínico (default)**: Clinical scribe for structured documentation (Tradicional/SOAP/Personalizado formats)
  - **Modo Explicativo**: Educational responses with optional silent PubMed evidence integration
  - **Automatic Detection**: Switches mode based on trigger phrases ("explica", "me ensina", "por quê", etc.)
  - **User Control**: Frontend toggle buttons with tooltips explaining each mode
  - **Evidence Integration**: Optional silent PubMed search in Explanatory Mode (configurable in profile)
  - **Technical**: SSE streaming for real-time responses, full conversation history, attachment support (images, PDFs)
  - **UX**: Progressive UI updates, automatic fallback to non-streaming, disabled send button during streaming
  - **Analytics**: Completion duration and token count tracking
- **Exam Analysis**: Multi-file upload, automatic analysis with GPT-5 Vision, contextual medical interpretation.
- **Patient Management (CRUD)**: Complete patient lifecycle management with fields like name, CPF, birth date, phone, address, and observations. Integration with Memed for prescriptions.
- **Clinical Evidence (Evidências Clínicas)**: Legacy toggle-based feature for explicit evidence display. Now integrated into dual-mode system: in Explanatory Mode, evidence can be silently fetched (if enabled in profile) to enrich explanations without visible citations. Original toggle still available for backward compatibility (shows explicit references with disclaimer). Powered by PubMed (NIH/NCBI E-utilities). Non-blocking analytics logging tracks usage.
- **Consultation History System**: Saves patient consultations, including chat history, attachments, date, and responsible physician, stored in PostgreSQL with JSONB for flexible data.
- **Design Guidelines**: Professional medical design with primary green colors, Inter typography, consistent spacing, subtle shadows, and visual feedback.

**Data Structures (PostgreSQL + Drizzle):**
- `patients`: Stores patient details.
- `users`: Stores user authentication details (doctors, students) including roles and CRM.
- `user_settings`: User-specific preferences including:
  - `default_style`: Documentation format (tradicional/soap/personalizado)
  - `custom_template`: User-defined template for "personalizado" style
  - `explanatory_mode_enabled`: Enable/disable PubMed evidence in Explanatory Mode
  - Module visibility toggles (showPediatria, showGestante, showEmergencia)
- `consultations`: Stores detailed consultation records, linked to patients.
- `research_analytics` (optional): Tracks usage of clinical evidence feature for analytics (non-blocking, query text, source count, response time).

## External Dependencies

- **OpenAI API**: For GPT-5 (AI medical chat, image analysis, scientific summaries).
- **Neon (PostgreSQL)**: Managed PostgreSQL database service.
- **Memed**: Digital prescription integration.
- **PubMed (NIH/NCBI E-utilities)**: For scientific literature search in Clinical Evidence feature (optional).
- **Resend / SMTP**: For email delivery (verification codes, notifications).
- **Twilio**: For SMS delivery (verification codes).
- **Google OAuth**: For user authentication.
- **Apple OAuth**: For user authentication.
- **Microsoft OAuth**: For user authentication.
- **GitHub OAuth**: For user authentication.

## Recent Changes (October 20, 2025)

**Dual-Mode AI System Implementation (Latest):**
- Implemented two distinct AI modes: Modo Clínico (default) and Modo Explicativo
- **Modo Clínico**: Clinical scribe for structured documentation (Tradicional/SOAP/Personalizado)
- **Modo Explicativo**: Educational responses with optional silent PubMed evidence integration
- Added automatic mode detection based on trigger phrases (e.g., "explica", "me ensina", "por quê")
- Frontend: Toggle buttons in chat interface with tooltips explaining each mode
- Backend: Mode-specific system prompts and evidence integration logic
- Database: Added `explanatory_mode_enabled` and `custom_template` columns to `user_settings`
- Profile settings: New configuration for evidence in Explanatory Mode + custom template support
- Documentation styles: Added "Personalizado" option with user-defined templates
- Silent evidence integration: PubMed searches enrich Explanatory Mode without visible citations
- Maintains backward compatibility with legacy evidence toggle

**Chat Performance Optimization with SSE Streaming (Production Ready):**
- Implemented Server-Sent Events (SSE) for `/api/chat` endpoint with real-time streaming
- Added exponential backoff retry logic: 3 attempts, 2s base delay, 45s timeout per attempt
- Switched to GPT-4o model for better streaming compatibility and faster responses
- Frontend now progressively renders chat responses as chunks arrive
- Production-ready SSE parser with multi-line data payload buffering
- AbortController integration: cancels previous streams, cleanup on unmount, 60s timeout safeguard
- Added streaming state management: `isStreaming`, `streamingMessage`, `currentUserMessage`
- Spinner shows while waiting for first token with "Gerando resposta..." placeholder
- Send button automatically disabled during streaming to prevent duplicate requests
- Graceful error handling with user-friendly timeout message, silent AbortError handling
- Automatic fallback to non-streaming mode if streaming fails
- Analytics logging for completion duration and token count
- Created retry utility (`server/utils/retry.ts`) for robust API calls
- No resource leaks: streams properly cancelled on component unmount or new requests

**"Em Breve" Modules with Waitlist:**
- Implemented three preview modules: Pediatria, Gestante, Emergência
- User-controlled visibility toggles in profile settings (all enabled by default)
- Waitlist system with email signup and duplicate detection (409 error on duplicates)
- Routes: `/pediatria`, `/gestante`, `/emergencia`
- Database table: `notifications_waitlist` with unique constraint on (feature, email)

**Clinical Evidence Feature:**
- Added optional "Evidências Clínicas" toggle in Atendimento page (defaults to OFF)
- Created `/api/research` endpoint with PubMed E-utilities integration
- Implemented scientific references display (up to 5 sources per query) with proper attribution
- References are reference-only and DO NOT affect medical chat logic
- Graceful degradation when API keys (SEARCH_PROVIDER, SEARCH_API_KEY) not configured
- Non-blocking analytics logging for usage tracking
- Routes: Added `/atendimento` route to protected router (in addition to `/` route)