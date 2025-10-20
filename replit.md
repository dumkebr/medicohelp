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
- **Medical Perplexity (Scientific Search)**: Integration with PubMed (NIH/NCBI E-utilities) for scientific article retrieval and GPT-5-generated summaries with citations.
- **Consultation History System**: Saves patient consultations, including chat history, attachments, date, and responsible physician, stored in PostgreSQL with JSONB for flexible data.
- **Design Guidelines**: Professional medical design with primary green colors, Inter typography, consistent spacing, subtle shadows, and visual feedback.

**Data Structures (PostgreSQL + Drizzle):**
- `patients`: Stores patient details.
- `users`: Stores user authentication details (doctors, students) including roles and CRM.
- `user_settings`: User-specific preferences like default style.
- `consultations`: Stores detailed consultation records, linked to patients.

## External Dependencies

- **OpenAI API**: For GPT-5 (AI medical chat, image analysis, scientific summaries).
- **Neon (PostgreSQL)**: Managed PostgreSQL database service.
- **Memed**: Digital prescription integration.
- **PubMed (NIH/NCBI E-utilities)**: For scientific literature search.
- **Resend / SMTP**: For email delivery (verification codes, notifications).
- **Twilio**: For SMS delivery (verification codes).
- **Google OAuth**: For user authentication.
- **Apple OAuth**: For user authentication.
- **Microsoft OAuth**: For user authentication.
- **GitHub OAuth**: For user authentication.