# MédicoHelp - AI Medical Assistant

## Overview
MédicoHelp is a professional AI-powered medical platform designed for healthcare professionals. It offers AI medical consultations with conversation history, automatic analysis of medical images, a comprehensive patient registration and management system, and direct integration with Memed for digital prescriptions. The project aims to streamline diagnostic and administrative workflows, enhancing efficiency and accuracy for medical professionals.

## User Preferences
I prefer simple language and clear explanations. I want iterative development with frequent updates and feedback. Ask before making major changes or architectural decisions. Do not make changes to the folder `Z` or the file `Y`.

## System Architecture

MédicoHelp utilizes a modern full-stack JavaScript architecture, prioritizing a professional UI/UX and robust backend.

**UI/UX Decisions:**
-   **Frameworks**: React with Wouter for routing, Shadcn/ui and Tailwind CSS for design.
-   **Branding & Identity (Updated October 2024)**:
    -   **Color Scheme**: Professional teal (`#00A79D` / HSL 176° 100% 33%) replacing previous green palette.
    -   **Logo**: New SVG logos (`logo-medicohelp-icon.svg`, `logo-medicohelp-horizontal.svg`) featuring teal branding.
    -   **Mascot**: "Dra. Clarice" - AI medical assistant mascot with idle/talking animation states (video with PNG fallback).
-   **Theming**: Dark/light mode support with teal color palette throughout application.
-   **Chat Interface**: Modern layout inspired by popular chat applications, featuring multimodal input (file upload, camera, gallery, microphone with transcription). Dra. Clarice mascot appears when conversation is empty.
-   **Medical Tools Modal**: Refined layout with tabs and fade-in animations for a seamless user experience.
-   **Sidebar Organization**: Intuitive navigation with main menu items, expandable search, and collapsible sections for patient management and history. Features "MédicoHelp" branding with bright teal "Help" text (#1affb8). Custom medical heart icon (PNG) used consistently across sidebar and MedPrime sections.
    -   **Visual Hierarchy**: 
        - Logo: h-10 w-10, text-xl font-bold
        - Section Titles: text-xs font-semibold uppercase (Shadcn default)
        - Menu Items: text-sm font-medium with h-5 w-5 icons
        - MedPrime: h-10 w-10 icon, text-base font-bold title, text-xs subtitle
-   **TopControls Component**: Reusable tabbed interface for the medical consultation workflow, offering "Clínico" (clinical mode), "Explicação + Evidências" (explanatory mode), and navigation to advanced tools.
-   **AdvancedHub**: Central hub (`/avancado`) for clinical calculators and advanced features, presented in a responsive grid layout.
-   **Medical Calculators**: Interactive forms for various clinical assessments (e.g., Wells Score, Arterial/Venous Blood Gas Analysis, Gestational Age), providing real-time calculations, interpretations, and copy/clear functions.

**Technical Implementations:**
-   **Frontend**: React, TanStack Query for state management.
-   **Backend**: Node.js with Express.
-   **AI - Sistema Híbrido GPT-5 (LIBERADO TOTAL)**:
    -   **Primary Model**: GPT-5 with refined medical prompts (temperature 0.4, max 900 tokens for objective responses)
    -   **New API Integration**: Uses `client.responses.create()` and `client.responses.stream()` (latest OpenAI SDK)
    -   **Automatic Fallback Chain**: GPT-5 → GPT-4o (new API) → GPT-4o (legacy API) for maximum reliability
    -   **✅ ZERO RESTRICTIONS**: Dra. Clarice responds to ABSOLUTELY ANY subject (weather, sports, jokes, recipes, etc.) - no medical-only filters
    -   **Simplified Prompts**: Direct, conversational system prompts (`server/medicohelp-gpt5.ts`) with EXPLICIT "responde sobre qualquer assunto" instruction
    -   **Medical Mode**: When topic is medical, maintains professional terminology (CAIXA ALTA, BEG, LOTE, MV+) and structured responses
    -   **External Integrations**: New `/api/weather` endpoint demonstrates ability to fetch external data (weather from wttr.in)
    -   **Real-time Streaming**: Server-Sent Events (SSE) with chunk-by-chunk delivery via `event.type === 'response.output_text.delta'`
-   **AI Tone**: Hybrid communication style combining informal personalized greeting with formal technical content. Starts with casual greeting using physician's first name (e.g., "Beleza, João. Vamos direto ao ponto:"), followed by formal technical communication with precise medical terminology (CID-10/11, SNOMED-CT, MeSH), evidence-based medicine (SBC, ESC, AHA, ACC, AMB, CFM), and professional language compatible with specialist-to-specialist communication.
-   **Configuration System**: JSON-based configuration (`config/medicohelp.clinico.v1.json`) defines AI clinical response structure with 5 mandatory sections and guardrails to prevent AI from inventing data and to ensure it requests missing critical information. It enforces 5 "Leis do MédicoHelp" for response quality.
-   **Clinical Score Detector**: Semantic detection system (`server/clinical-detector.ts`) for instantly identifying and responding to queries about clinical scales/scores without involving the main AI.
-   **Intent Detection System (Motor Único)**: An expanded system (`server/intent-detector.ts`) to detect 7 types of medical intents, using keyword, context, and priority weighting for structured responses.
-   **Database**: PostgreSQL with Drizzle ORM.
-   **Authentication**: JWT for role-based access, Email/Password, OAuth (Google, Apple, Microsoft, GitHub), and 6-digit verification codes.
-   **Storage**: DbStorage (PostgreSQL), Multer for file uploads.
-   **Validation**: Zod for data schema validation.
-   **Security**: Rate limiting using `express-rate-limit`.

**Feature Specifications:**
-   **AI Medical Chat with Dual-Mode System (GPT-5 Powered)**:
    -   **Modo Clínico (DEFAULT)**: Direct clinical decision support with structured format (👉 Impressão/Contexto, ⚡ Conduta/Resposta direta, 🔎 Alertas/Observações, 📇 CID quando aplicável). Temperature 0.4 for stable responses. Requests missing vital signs instead of inventing data.
    -   **Modo Avançado (Explicativo + Evidências)**: Didactic explanations with evidence-based references (👉 Conceito/Fisiopatologia, 📚 Evidências clínicas citing AHA/ACC/IDSA/OMS/SBC/AMB/CFM, ⚡ Aplicação prática, 💡 Pontos-chave). Integrates PubMed search results when available.
    -   **No Topic Filters**: System responds to ANY subject while maintaining medical tone - removed all "medical-only" validation. Frontend sends clean text without templates.
    -   **Term Preservation**: Respects physician's original terminology (maintains CAIXA ALTA, abbreviations like BEG/LOTE/MV+, colloquial terms like "GRIPE" without converting to "síndrome gripal").
    -   **Personalized Greeting System**: Every AI response starts with informal greeting using physician's first name (e.g., "Beleza, João. Vamos direto ao ponto:"), followed by formal technical content. Name automatically extracted from authenticated user data.
    -   **Hybrid Model System**: GPT-5 as primary engine with automatic fallback to GPT-4o if unavailable. Model used is logged for transparency.
    -   **Session Management**: Auto-save with intelligent titles generated from last physician message, opens new consultations in same page (not separate tabs).
    -   Automatic mode switching based on user input, with user-controlled toggles.
-   **Real-Time Voice Calls with Dra. Clarice (NEW - October 2025)**:
    -   **WebRTC + OpenAI Realtime API**: Full-duplex voice communication directly with the AI medical assistant.
    -   **Voice Features**: Feminine "aria" voice, barge-in support (interrupt AI while speaking), natural conversation flow.
    -   **Security**: Ephemeral token system - API keys never exposed to frontend. Backend generates temporary session tokens via `/api/voice/session`.
    -   **Component**: VoiceCallButton.tsx - Phone icon button integrated in chat interface (click "Ligar" to start, "Encerrar" to hang up).
    -   **Technical**: Uses `gpt-4o-realtime-preview` model, WebRTC PeerConnection for audio streaming, automatic microphone capture with user permission.
    -   **Instructions**: AI receives same medical personality as text chat - professional, direct, and knowledgeable Dra. Clarice in Portuguese.
-   **MedPrime - Ferramentas Médicas Avançadas**:
    -   Professional visual card with emerald gradient design highlighting advanced medical tools.
    -   Dedicated page at `/medprime` with direct access to medical calculators.
    -   Highlighted green link in sidebar with custom medical heart icon (PNG: heart with cross, ECG, circuits).
    -   Features: Clinical calculators, validated scores (Wells, CURB-65, CHA₂DS₂-VASc), standardized protocols, integrated AI diagnostic support.
    -   Smooth scroll-to-section navigation within page.
-   **Histórico de Atendimentos**: Manages multiple medical consultations, saved in localStorage, with sidebar navigation, search functionality, smart titling, and optional patient association. Includes a retention policy for consultations.
-   **Exam Analysis**: Multi-file upload for automatic analysis and contextual medical interpretation.
-   **Patient Management**: CRUD operations for patient data, integrated with Memed.
-   **Clinical Evidence**: Provides scientific literature from PubMed, integrated into Explanatory Mode.
-   **Medical Professional Tools**:
    -   **Calculadoras Clínicas**: 16 medical calculators with dynamic forms, severity-colored interpretation, and calculation history. Includes advanced features like comprehensive blood gas analysis.
    -   **Partograma**: Interactive visualization of labor progression with alert/action lines, attention system, and multi-format export.

**System Design Choices:**
-   **Data Structures (PostgreSQL + Drizzle):** Tables for `patients`, `users`, `user_settings`, `consultations`, `research_analytics`, and `medical_tools_audit`.
-   **localStorage Data Structures:** Keys for `mh_atendimentos` (consultation array), `mh_current_atendimento_id`, `mh_showPatientMgmt`, `medicohelp_mode`, `medicohelp_evidence`, and `calc_history`.

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

## Recent Updates (October 2025)

### Visual Standardization & Branding Refinement (October 23, 2025) ✅
- **Custom MedPrime Icon**: Replaced generic icon with custom medical heart PNG (heart with cross, ECG, circuits)
- **Brand Color Update**: "Help" text now uses bright teal (#1affb8) for better visibility and brand consistency
- **Typography Hierarchy Standardized**:
  - Logo MédicoHelp: text-xl font-bold, h-10 w-10 icon
  - MedPrime sidebar: text-base font-bold title, text-xs subtitle, h-10 w-10 icon
  - MedPrime card: h-14 w-14 icon (proportionally larger for home page)
  - Menu items: Consistent text-sm font-medium with h-5 w-5 icons
- **Visual Consistency**: All icons and text sizes follow clear hierarchy for professional appearance

### Dra. Clarice LIBERADA - Zero Restrictions (October 23, 2025) ✅
- **System prompts simplified**: Removed all complex structures, made EXPLICIT that Dra. Clarice responds to ANY subject
- **New weather endpoint**: `/api/weather` demonstrates external API integration (fetches weather from wttr.in)
- **Updated prompts in `server/medicohelp-gpt5.ts`**: 
  - SYSTEM_PROMPT_BASE now explicitly states "REGRA ABSOLUTA: Você responde sobre QUALQUER assunto"
  - Removed all "medical-only" language and filters
  - Simplified MODE_CLINICO and MODE_EXPLICATIVO prompts
- **Documentation updated**: replit.md now reflects "ZERO RESTRICTIONS" policy
- **Test it**: Ask about weather, sports, jokes, recipes, technology - Dra. Clarice will respond naturally!

### Voice Call Integration ✅
- Integrated real-time voice calls using WebRTC + OpenAI Realtime API
- VoiceCallButton component added to atendimento-teal page
- Backend route `/api/voice/session` creates ephemeral tokens for secure WebRTC sessions
- E2E tested: 9/9 verifications passed
- Voice: Feminine "aria" voice, Portuguese instructions, medical personality consistent with text chat