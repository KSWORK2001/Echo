# Echo

<p align="center">
  <img src="images/Echo.png" alt="Echo banner" width="720" />
</p>

<p align="center">
  <strong>An on-screen AI copilot for meetings, interviews, demos, and live work.</strong>
</p>

<p align="center">
  Built for people who need help <em>during</em> the conversation, not after it.
</p>

---

## What Echo actually is

Echo is a lightweight desktop assistant that stays available while you work.

It can:

- listen to **system audio**
- listen to **your microphone** at the same time
- build a better understanding of the full conversation
- show you live transcript context
- generate fast responses without forcing you to switch windows
- attach screenshots and files when extra context matters

The goal is simple: **help you think and respond in real time without getting in your way**.

---

## Why it feels different

Most AI desktop tools feel like chat apps with a microphone glued on top.

Echo is designed more like a **silent overlay system**:

- **Always near, never loud**
- **Fast to open, fast to dismiss**
- **Useful during pressure moments**
- **Private by default**
- **Flexible enough to work with your own providers**

It is especially useful when you are:

- in a live interview
- on a customer call
- presenting or demoing
- handling support or troubleshooting
- trying to think clearly while multiple inputs are coming at once

---

## Current experience

### Conversation capture

Echo now uses a **single conversation mode**.

When you start it:

- system/speaker audio is captured
- your microphone is captured too
- both sides of the conversation are sent through speech-to-text
- the transcript is labeled so the AI can distinguish between the other side and you

This makes the assistant much better at following back-and-forth discussion instead of reacting to only one side.

### Real-time interruption handling

If the AI starts responding and new speech begins, Echo can interrupt the in-flight response and continue listening so the conversation stays current.

### Live context

Echo can surface:

- transcript progress
- speech activity status
- response generation state
- screenshots and file attachments for extra context

---

## Highlights

### Lightweight desktop architecture

- Tauri 2.x + Rust backend
- React 19 + TypeScript frontend
- Vite development workflow
- native desktop performance without shipping a full Electron-style browser stack

### Real-time audio intelligence

- simultaneous microphone + system audio capture
- voice activity detection for speaker-side flow
- live transcript accumulation
- interruption-aware response handling
- configurable audio device selection

### Flexible AI + STT providers

- OpenAI, Anthropic, local, and custom curl-based providers
- streaming and non-streaming model support
- pluggable speech-to-text setup
- current OpenAI reasoning model options:
  - `gpt-5.4`
  - `gpt-5.4-mini-2026-03-17`
  - `gpt-5.4-nano-2026-03-17`

### Useful in live workflows

- screenshot capture for visual context
- file attachments
- saved conversations
- quick actions
- custom prompts and reusable context

### Local-first behavior

- local settings + persisted chat history
- direct provider connections
- no mandatory proxy layer
- user-controlled credentials

---

## Tech stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Radix UI

### Desktop / native

- Tauri 2.x
- Rust
- SQLite

### AI / speech

- provider-based LLM integration
- provider-based STT integration
- curl-driven custom providers
- streaming response support

---

## What Echo is good for

### Interviews

- recover quickly when a question is phrased awkwardly
- keep track of technical context while speaking
- use screenshots/files when the discussion turns visual

### Sales and demos

- pull in product context during calls
- answer objections faster
- stay anchored to what was just said

### Support and operations

- follow technical back-and-forth accurately
- attach screenshots for incident/debugging context
- avoid losing the thread during long troubleshooting sessions

### General knowledge work

- use Echo as a fast sidecar while reading, presenting, coding, or planning

---

## Quick start

### Prerequisites

- Node.js 18+
- Rust stable
- platform prerequisites for Tauri:
  - [Linux prerequisites](https://v2.tauri.app/start/prerequisites/)
  - [macOS prerequisites](https://v2.tauri.app/start/prerequisites/)
  - [Windows prerequisites](https://v2.tauri.app/start/prerequisites/)

### Install

```bash
git clone https://github.com/your-username/echo.git
cd echo
npm install
```

### Run in development

```bash
npm run tauri dev
```

### Build

```bash
npm run build
npm run tauri build
```

---

## Project shape

```text
src/                 React UI, hooks, providers, app flows
src-tauri/           Rust backend, native commands, platform audio handling
images/              README/media assets
public/              static runtime assets used by the app
```

---

## Design principles

- **Speed over ceremony**
- **Useful during live pressure**
- **Local-first where possible**
- **Provider-agnostic by design**
- **Minimal UI, high leverage**

---

## Roadmap direction

- stronger conversation memory and context linking
- better speaker separation and conversation understanding
- richer local knowledge / profile integration
- more polished live coaching and response workflows
- broader platform hardening and deployment improvements

---

## Contributing

If you want to improve the app, open an issue or submit a PR.

Good contributions include:

- platform-specific audio reliability fixes
- provider integrations
- UI polish
- onboarding improvements
- transcript quality improvements

---

## License

GPL-3.0. See [LICENSE](LICENSE).

---

<div align="center">
**Built with ❤️ using Tauri, React, and Rust**

*The future of AI-assisted meetings is here*

</div>