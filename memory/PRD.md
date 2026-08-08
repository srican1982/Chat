# AI Roleplay Chat — Browser-Only, Privacy-First

## Original Problem Statement
A web-based AI chat app for creative writing and roleplay. All chat history and image/video data
live only in the user's browser (localStorage). No database, no accounts, no server-side storage of
user content. Backend is a thin, stateless proxy to OpenRouter (→ Google Vertex AI, Gemini) so the
API key stays off the client. Two tones (Professional / Story), image + video upload (in-browser
Base64), session management, storage warning, model picker, temperature locked 0.9, pinned provider
routing (Vertex, no fallbacks, data_collection deny, ZDR).

## Architecture
- Frontend: React (CRA + craco, `@` alias → src), TailwindCSS, Shadcn UI, framer-motion, sonner.
- Backend: FastAPI single endpoint `POST /api/chat/stream` — stateless httpx streaming proxy, no body logging.
- AI: OpenRouter → Google Vertex AI. Provider block pinned: order ["google-vertex"],
  allow_fallbacks false, data_collection "deny", zdr true. temperature 0.9, stream true.
- Storage: browser localStorage only (key `roleplay_sessions_v1`). No MongoDB used for user content.

## User Personas
- Writers / roleplayers wanting creative freedom and uncensored fiction (Story tone).
- Privacy-conscious users: no tracking, no persistent server data, anonymous.

## Core Requirements (static)
- Streaming chat with Gemini via OpenRouter.
- Professional vs Story tone (Story = locked no-refusal system prompt, injected server-side).
- Image + video upload read entirely in browser → Base64; video frames via canvas (~15/10s).
- Session CRUD in localStorage; clear session / clear all; export / import JSON.
- Storage warning toast when localStorage > 3.5 MB.
- Model picker: default Gemini 3.5 Flash Lite + 2.5 Flash, 2.5 Pro, 3.1 Pro Preview.
- Privacy explainer modal documenting the memory model.

## Implemented (2026-08-08)
- Backend proxy `/api/chat/stream` with pinned provider block, SSE streaming, no body logging,
  graceful 503 when key missing. Verified live streaming (default + 2.5-flash models) and multimodal
  image_url forwarding.
- Full frontend: sidebar (sessions, storage indicator, export/import, clear all, privacy),
  glass chat header (tone selector, model picker, Local Only lock, clear session), chat pane with
  streaming render + framer-motion entrance, floating composer with image/video attach + preview tray,
  privacy modal, storage warning toast. Design: 'Midnight Velvet' dark theme, Outfit/IBM Plex/JetBrains fonts.
- Story tone system prompt fully locked (server-side). Session export/import added. Temperature locked 0.9.
- OpenRouter API key configured in backend/.env. End-to-end verified via screenshot.

## Backlog / Remaining
- P1: Stop/cancel button during streaming.
- P2: Regenerate last response; per-message copy button.
- P2: Markdown rendering for assistant messages.
- P2: Session search/filter in sidebar.

## Next Tasks
- Add streaming cancel + regenerate.
- Optional: markdown rendering.
