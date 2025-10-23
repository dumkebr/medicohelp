# MédicoHelp - AI Medical Assistant

## Overview
MédicoHelp is a professional AI-powered medical platform designed for healthcare professionals. It offers AI medical consultations with conversation history, automatic analysis of medical images, a comprehensive patient registration and management system, and direct integration with Memed for digital prescriptions. The project aims to streamline diagnostic and administrative workflows, enhancing efficiency and accuracy for medical professionals.

## User Preferences
I prefer simple language and clear explanations. I want iterative development with frequent updates and feedback. Ask before making major changes or architectural decisions. Do not make changes to the folder `Z` or the file `Y`.

## System Architecture

MédicoHelp utilizes a modern full-stack JavaScript architecture, prioritizing a professional UI/UX and robust backend.

**UI/UX Decisions:**
-   **Frameworks**: React with Wouter for routing, Shadcn/ui and Tailwind CSS for design.
-   **Theming**: Dark/light mode support, professional medical green color palette.
-   **Chat Interface**: Modern layout inspired by popular chat applications, featuring multimodal input (file upload, camera, gallery, microphone with transcription).
-   **Medical Tools Modal**: Refined layout with tabs and fade-in animations for a seamless user experience.
-   **Sidebar Organization**: Intuitive navigation with main menu items, expandable search, and collapsible sections for patient management and history.
-   **TopControls Component**: Reusable tabbed interface for the medical consultation workflow, offering "Clínico" (clinical mode), "Explicação + Evidências" (explanatory mode), and navigation to advanced tools.
-   **AdvancedHub**: Central hub (`/avancado`) for clinical calculators and advanced features, presented in a responsive grid layout.
-   **Medical Calculators**: Interactive forms for various clinical assessments (e.g., Wells Score, Arterial/Venous Blood Gas Analysis, Gestational Age), providing real-time calculations, interpretations, and copy/clear functions.

**Technical Implementations:**
-   **Frontend**: React, TanStack Query for state management.
-   **Backend**: Node.js with Express.
-   **AI**: OpenAI GPT-4o for medical chat, GPT-5 Vision for image analysis.
-   **AI Tone**: Formal, technical communication with precise medical terminology (CID-10/11, SNOMED-CT, MeSH), evidence-based medicine (SBC, ESC, AHA, ACC, AMB, CFM), and professional language compatible with specialist-to-specialist communication.
-   **Configuration System**: JSON-based configuration (`config/medicohelp.clinico.v1.json`) defines AI clinical response structure with 5 mandatory sections and guardrails to prevent AI from inventing data and to ensure it requests missing critical information. It enforces 5 "Leis do MédicoHelp" for response quality.
-   **Clinical Score Detector**: Semantic detection system (`server/clinical-detector.ts`) for instantly identifying and responding to queries about clinical scales/scores without involving the main AI.
-   **Intent Detection System (Motor Único)**: An expanded system (`server/intent-detector.ts`) to detect 7 types of medical intents, using keyword, context, and priority weighting for structured responses.
-   **Streaming**: Server-Sent Events (SSE) for real-time chat responses.
-   **Database**: PostgreSQL with Drizzle ORM.
-   **Authentication**: JWT for role-based access, Email/Password, OAuth (Google, Apple, Microsoft, GitHub), and 6-digit verification codes.
-   **Storage**: DbStorage (PostgreSQL), Multer for file uploads.
-   **Validation**: Zod for data schema validation.
-   **Security**: Rate limiting using `express-rate-limit`.

**Feature Specifications:**
-   **AI Medical Chat with Dual-Mode System**:
    -   **Modo Clínico (DEFAULT)**: Structured, rapid checklist format with guardrails, enforcing medical guidelines (SBC/AMB/CFM, ESC/AHA/ACC, etc.) and a mandatory 5-section response format (e.g., 1️⃣ Avaliar estabilidade → 5️⃣ Seguimento).
    -   **Modo Explicativo + Evidências**: Educational explanations with mandatory bibliographic references (📚 Evidências clínicas), integrating PubMed evidence.
    -   Automatic mode switching based on user input, with user-controlled toggles.
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

-   **OpenAI API**: GPT-4o, GPT-5 Vision.
-   **Neon**: Managed PostgreSQL database.
-   **Memed**: Digital prescription integration.
-   **PubMed (NIH/NCBI E-utilities)**: Scientific literature search.
-   **Resend / SMTP**: Email delivery.
-   **Twilio**: SMS delivery.
-   **Google OAuth**: User authentication.
-   **Apple OAuth**: User authentication.
-   **Microsoft OAuth**: User authentication.
-   **GitHub OAuth**: User authentication.