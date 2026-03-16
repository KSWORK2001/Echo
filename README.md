# Echo 🚀

<a href="https://Echo/">
  <img src="/images/Echo.png" alt="Echo banner" width="100%" />
</a>

---

---

## ⚡ **The Ultimate Lightweight AI Meeting Assistant**

<div align="center">

### 🎯 **Just 10MB • Always On Display • One Click Away**

**A scalable, privacy-first desktop AI assistant designed for real-time support during meetings, interviews, and live work sessions**

</div>

---

## 🧠 **Core Architecture & Tech Stack**

### **Frontend & UI**
- **React 19** with **TypeScript** for type-safe, modern UI development
- **Vite** for lightning-fast builds and hot module replacement
- **TailwindCSS** + **shadcn/ui** for a polished, responsive design system
- **Radix UI primitives** for accessible, unstyled component foundations

### **Desktop Engine**
- **Tauri 2.x** with Rust backend for native performance (< 100ms startup)
- **SQLite** for local, transaction-safe chat history and settings persistence
- **Cross-platform native APIs** (system audio, global shortcuts, file system)

### **AI & Speech Integration**
- **Universal curl-based provider system** supporting any REST API
- **Streaming and non-streaming** LLM support (OpenAI, Anthropic, Google, xAI, Mistral, Groq, Ollama, custom endpoints)
- **Multi-provider STT integration** (OpenAI Whisper, ElevenLabs, Deepgram, Azure, Google, custom)
- **Real-time audio processing** with voice activity detection and visual feedback

### **State Management & Data Flow**
- **React Context API** for global state and provider management
- **localStorage + SQLite hybrid** for settings and chat persistence
- **Encrypted credential storage** via Tauri's secure storage APIs
- **Real-time streaming response handling** with abort controller support

---

## 🚀 **Meeting Assistant Features**

### **Stealth Mode for Live Sessions**
- **Translucent overlay window** that's invisible in screen shares and recordings
- **Screenshot-proof design** undetectable in Zoom, Google Meet, Teams, and Slack
- **Global keyboard shortcuts** for instant access during critical moments
- **Always-on-top positioning** with arrow-key movement and transparency controls

### **Real-time Audio Intelligence**
- **System audio capture** for transcribing meetings, presentations, and calls
- **Voice activity detection** with automatic processing and visual indicators
- **Multi-device audio routing** with customizable input/output selection
- **Background processing** with minimal resource footprint (< 50MB RAM)

### **Visual Context Capture**
- **Instant screenshot capture** (full screen or region selection)
- **Auto/Manual processing modes** with configurable AI prompts
- **Multi-file attachment support** for documents, code, and images
- **Drag-and-drop interface** with real-time file processing

### **Profile-Driven Personalization**
- **Resume-based profile building** with AI extraction from PDF/DOCX/TXT
- **Editable structured JSON** for skills, experience, education, certifications
- **Context injection** into every AI request for personalized responses
- **Live validation** and persistence across sessions

---

## 🏗️ **Scalability & Performance**

### **Resource Optimization**
- **50% less RAM usage** than Electron alternatives (no embedded Chromium)
- **Sub-100ms cold start** time with instant UI responsiveness
- **Efficient streaming** with backpressure handling and memory management
- **Background operation** with negligible CPU impact during idle periods

### **Data Architecture**
- **SQLite with WAL mode** for concurrent read/write operations
- **Indexed chat history** with full-text search and pagination
- **Local-first storage** with optional markdown export functionality
- **Modular provider system** supporting unlimited custom integrations

### **Multi-Provider Support**
- **Dynamic provider switching** without conversation context loss
- **Load balancing and failover** capabilities across multiple LLM endpoints
- **Custom curl-based integration** supporting any REST API with streaming
- **Provider-specific optimizations** (token counting, rate limiting, retry logic)

---

## 🛠️ **Developer Experience**

### **Extensibility**
- **Plugin-style provider configuration** using familiar curl syntax
- **Custom system prompts** with AI-powered generation assistance
- **Theme and layout customization** with CSS-in-JS support
- **Keyboard shortcut remapping** with conflict detection

### **Build & Deployment**
- **Cross-platform builds** (Windows .msi/.exe, macOS .dmg, Linux .deb/.rpm/.AppImage)
- **Auto-updater integration** with delta updates for minimal download sizes
- **Code signing and notarization** ready for enterprise distribution
- **Docker containerization** support for headless deployment scenarios

---

## 🔒 **Privacy & Security**

### **Local-First Design**
- **Zero telemetry or analytics** - no data ever leaves your device
- **Direct API connections** to your chosen AI providers (no proxies)
- **Encrypted credential storage** using system keychain/credential manager
- **Complete data ownership** with export and purge capabilities

### **Enterprise Ready**
- **Offline capability** for all local features (no internet required)
- **Granular permission controls** for audio, screen, and file access
- **Audit-ready logging** with transparent network request inspection
- **SOC 2 compatible** architecture for regulated environments

---

## 📊 **Enterprise Meeting Use Cases**

### **Sales Enablement**
- Real-time product information retrieval during client calls
- Competitive intelligence access without breaking conversation flow
- Proposal and pricing guidance with instant document analysis

### **Technical Interviews**
- Code syntax assistance and algorithm hints during live coding
- Architecture pattern suggestions for design discussions
- Technology stack recommendations with context awareness

### **Executive Support**
- Board meeting preparation with instant data retrieval
- Financial analysis assistance during investor presentations
- Strategic planning support with real-time market insights

### **Customer Success**
- Technical troubleshooting guidance during support calls
- Product feature explanations with visual context
- Customer conversation analysis with sentiment awareness

---

## 🚀 **Installation & Development**

### **Prerequisites**
- **Node.js** 18+ and **Rust** latest stable
- **Tauri dependencies** for your target platform
  - [Linux: WebKitGTK + system libraries](https://v2.tauri.app/start/prerequisites/)
  - [macOS: Xcode Command Line Tools](https://v2.tauri.app/start/prerequisites/)
  - [Windows: Microsoft Visual Studio C++ Build Tools](https://v2.tauri.app/start/prerequisites/)

### **Quick Start**

```bash
# Clone and install dependencies
git clone https://github.com/your-username/echo.git
cd echo
npm install

# Start development server
npm run tauri dev

# Build for production
npm run tauri build
```

### **Development Workflow**

```bash
# Type checking
npm run build

# Linting and formatting
npm run lint
npm run format

# Testing (when implemented)
npm run test
```

---

## 📈 **Roadmap & Future Enhancements**

- **Multi-language UI support** with i18n framework
- **Advanced meeting analytics** with speaker identification
- **Integration with calendar systems** for automatic meeting context
- **Voice synthesis** for hands-free AI response delivery
- **Team collaboration features** with shared prompt libraries
- **Advanced RAG capabilities** with local vector database integration

---

## 📄 **License**

GPL-3.0 License - See [LICENSE](LICENSE) for details.

---

## 🤝 **Contributing**

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our main repository.

---

<div align="center">

**Built with ❤️ using Tauri, React, and Rust**

*The future of AI-assisted meetings is here*

</div>