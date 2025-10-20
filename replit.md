# MédicoHelp - Assistente Médico com IA

## Overview

MédicoHelp is a professional medical platform that leverages artificial intelligence to assist healthcare professionals. The system offers: AI-powered medical consultations with conversation history, automatic analysis of medical images (X-rays, reports, etc.) using GPT-5 Vision, a complete patient registration and management system, and direct integration with Memed for digital prescription of recipes. The project aims to provide a robust AI assistant for medical professionals, enhancing diagnostic and administrative workflows.

## User Preferences

I prefer simple language and clear explanations. I want iterative development with frequent updates and feedback. Ask before making major changes or architectural decisions. Do not make changes to the folder `Z` or the file `Y`.

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
- **AI**: OpenAI GPT-5 for medical chat, image analysis, and scientific summaries.
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
- **AI Medical Chat**: Contextual medical queries, full conversation history, attachment support (images, PDFs).
- **Exam Analysis**: Multi-file upload, automatic analysis with GPT-5 Vision, contextual medical interpretation.
- **Patient Management (CRUD)**: Complete patient lifecycle management with fields like name, CPF, birth date, phone, address, and observations. Integration with Memed for prescriptions.
- **Clinical Evidence (Evidências Clínicas)**: Optional toggle-based feature in chat that provides scientific references from PubMed (NIH/NCBI E-utilities) for medical queries. Defaults to OFF. When enabled, displays up to 5 scientific references (title, source, authors, year, clickable links) below AI responses with disclaimer "Material de apoio. Não substitui avaliação médica." References are purely supplementary and DO NOT affect medical chat logic. Gracefully degrades when API not configured. Requires SEARCH_PROVIDER and SEARCH_API_KEY environment variables. Non-blocking analytics logging tracks usage.
- **Consultation History System**: Saves patient consultations, including chat history, attachments, date, and responsible physician, stored in PostgreSQL with JSONB for flexible data.
- **Design Guidelines**: Professional medical design with primary green colors, Inter typography, consistent spacing, subtle shadows, and visual feedback.

**Data Structures (PostgreSQL + Drizzle):**
- `patients`: Stores patient details.
- `users`: Stores user authentication details (doctors, students) including roles and CRM.
- `user_settings`: User-specific preferences like default style.
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

**Clinical Evidence Feature Implementation:**
- Added optional "Evidências Clínicas" toggle in Atendimento page (defaults to OFF)
- Created `/api/research` endpoint with PubMed E-utilities integration
- Implemented scientific references display (up to 5 sources per query) with proper attribution
- References are reference-only and DO NOT affect medical chat logic
- Graceful degradation when API keys (SEARCH_PROVIDER, SEARCH_API_KEY) not configured
- Non-blocking analytics logging for usage tracking
- Full e2e tests verified toggle behavior, badge synchronization, and chat functionality
- Routes: Added `/atendimento` route to protected router (in addition to `/` route)