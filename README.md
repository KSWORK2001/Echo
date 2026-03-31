<a id="readme-top"></a>

<div align="center">
  <img src="images/Echo.png" alt="Echo banner" width="720" />

  <h1>Echo</h1>

  <p>
    <strong>An on-screen AI copilot for meetings, interviews, demos, and live work.</strong>
  </p>

  <p>
    Lightweight, local-first where possible, and built to help <em>during</em> the conversation instead of after it.
  </p>

  <p>
    <a href="#getting-started"><strong>Get Started</strong></a>
    ·
    <a href="#usage">Usage</a>
    ·
    <a href="#contributing">Contributing</a>
    ·
    <a href="#contact">Contact</a>
  </p>
</div>

---

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#why-echo">Why Echo</a></li>
    <li><a href="#built-with">Built With</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#architecture">Architecture</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

## About The Project

Echo is a desktop AI assistant built for live situations where context changes fast and switching windows kills momentum.

Instead of behaving like a normal chat app, Echo acts like a **quiet overlay companion** that can listen, watch, and help while you keep moving.

It is designed for moments like:

- live interviews
- customer calls
- demos and presentations
- support and troubleshooting sessions
- high-context work where multiple inputs are happening at once

What Echo can do right now:

- capture **system audio**
- capture **microphone input** at the same time
- transcribe both sides of the conversation
- label transcript roles so the AI follows the exchange more accurately
- interrupt an in-progress response when new speech starts
- include screenshots and files as extra context
- work with multiple LLM and STT providers

The core idea is simple: **help you think and respond in real time without becoming another thing you have to manage**.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Why Echo

Most AI desktop tools feel like generic chat interfaces with a microphone bolted on.

Echo is intentionally different.

- **Built for pressure**
  It is meant to be useful when you need fast thinking in a live conversation.

- **Conversation-aware**
  It now runs in a single conversation mode that captures both speaker audio and your microphone for better context.

- **Interrupt-aware**
  If someone starts talking again, Echo can stop generating and resume listening.

- **Provider-flexible**
  You are not locked into one AI backend.

- **Local-first mindset**
  Settings, chat history, and configuration stay close to the machine and your chosen providers.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Built With

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Radix UI
- **Desktop:** Tauri 2.x, Rust
- **Storage:** SQLite
- **Speech / AI:** provider-based STT and LLM integrations with custom curl-based support

Current OpenAI reasoning model options in the app:

- `gpt-5.4`
- `gpt-5.4-mini-2026-03-17`
- `gpt-5.4-nano-2026-03-17`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

### Prerequisites

- Node.js 18+
- Rust stable
- Tauri platform prerequisites
  - [Linux prerequisites](https://v2.tauri.app/start/prerequisites/)
  - [macOS prerequisites](https://v2.tauri.app/start/prerequisites/)
  - [Windows prerequisites](https://v2.tauri.app/start/prerequisites/)

### Installation

```bash
git clone https://github.com/your-username/echo.git
cd echo
npm install
```

### Run locally

```bash
npm run tauri dev
```

### Production build

```bash
npm run build
npm run tauri build
```

### Provider setup

To use Echo fully, configure:

- an AI provider
- a speech-to-text provider
- any relevant API keys in the app settings

Echo supports both built-in providers and custom curl-based providers.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

### Conversation mode

Echo now uses a **single conversation mode**.

When you start capture:

- speaker/system audio is recorded
- your microphone is recorded too
- both transcripts are combined for better conversational context
- the AI can distinguish between the other speaker and you

This improves follow-up quality, continuity, and general awareness during back-and-forth discussion.

### Live response behavior

Echo can:

- show transcript progress
- indicate when speech is actively being detected
- indicate when the AI is processing
- stop an in-flight answer if new speech starts

### Extra context inputs

You can also use:

- screenshots
- file attachments
- saved chat history
- custom prompts and reusable context

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Architecture

```text
src/                 React UI, hooks, provider flows, app logic
src-tauri/           Rust backend, native commands, system audio handling
images/              README/media assets
public/              runtime static assets
```

### Technical highlights

- Tauri-based desktop shell with Rust-native integrations
- React UI with streaming response workflows
- simultaneous mic + system audio capture for conversation context
- provider abstraction for AI and STT backends
- local settings and persisted chat history

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Roadmap

- [ ] stronger conversation memory and context linking
- [ ] better speaker separation and conversation understanding
- [ ] richer local knowledge and profile integration
- [ ] more polished live coaching and response workflows
- [ ] broader platform hardening and deployment improvements

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributing

Contributions are welcome.

Useful areas to contribute to include:

- platform-specific audio reliability fixes
- provider integrations
- transcript quality improvements
- UI polish
- onboarding and setup improvements

If you want to contribute:

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push the branch
5. Open a pull request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

Distributed under the GPL-3.0 license. See [LICENSE](LICENSE) for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contact

Karan Shrivastava

- Portfolio: <a href="https://kswork2001.github.io/portfolio">kswork2001.github.io/portfolio</a>
- Email: <a href="mailto:work.karan2001@gmail.com">work.karan2001@gmail.com</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>