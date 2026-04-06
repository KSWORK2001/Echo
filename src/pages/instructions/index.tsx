import { type ComponentType, type SVGProps } from "react";
import { PageLayout } from "@/layouts";
import {
  ArrowUpRight,
  Cloud,
  Cpu,
  ExternalLink,
  Key,
  Layers,
  Terminal,
} from "lucide-react";

type Provider = {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  color: string;
  link: { label: string; url: string };
  steps: string[];
};

const providers: Provider[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT‑5.4 with speech synthesis",
    icon: Cloud,
    color: "text-sky-500",
    link: { label: "platform.openai.com", url: "https://platform.openai.com/account/api-keys" },
    steps: [
      "Sign in and navigate to API Keys",
      "Create a new secret key",
      "Copy it to Echo's provider settings",
    ],
  },
  {
    id: "claude",
    name: "Claude",
    description: "Anthropic's reasoning models",
    icon: Cpu,
    color: "text-amber-500",
    link: { label: "console.anthropic.com", url: "https://console.anthropic.com/settings/keys" },
    steps: [
      "Open the Anthropic Console",
      "Go to Settings → API Keys",
      "Paste the key into Echo",
    ],
  },
  {
    id: "custom",
    name: "Custom",
    description: "Azure, Fireworks, or self-hosted",
    icon: Layers,
    color: "text-violet-500",
    link: { label: "API Reference", url: "https://platform.openai.com/docs/api-reference/introduction" },
    steps: [
      "Configure your endpoint URL",
      "Set the model identifier",
      "Add authentication headers",
    ],
  },
];

const localOptions = [
  { name: "LM Studio", url: "https://lmstudio.ai/", command: "localhost:1234" },
  { name: "Ollama", url: "https://ollama.com/", command: "ollama pull llama3.1" },
];

const Instructions = () => {
  return (
    <PageLayout title="Instructions" description="Connect Echo to your AI provider">
      <div className="mx-auto max-w-2xl space-y-20 py-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium">
            <Key className="h-3.5 w-3.5" />
            Setup Guide
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Connect your provider</h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Echo works with OpenAI, Claude, or any OpenAI-compatible API.
          </p>
        </div>

        {/* Providers */}
        <div className="space-y-10">
          {providers.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.id} className="group">
                <div className="mb-4 flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${p.color}`} />
                  <h2 className="text-lg font-medium">{p.name}</h2>
                  <span className="text-sm text-muted-foreground">— {p.description}</span>
                </div>

                <div className="space-y-3 pl-8">
                  <a
                    href={p.link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {p.link.label}
                    <ArrowUpRight className="h-4 w-4 opacity-60" />
                  </a>

                  <ol className="space-y-2 text-sm text-muted-foreground">
                    {p.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-muted-foreground/40">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            );
          })}
        </div>

        {/* Local */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Local Deployment
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {localOptions.map((opt) => (
              <a
                key={opt.name}
                href={opt.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-4 transition-colors hover:border-border hover:bg-muted/30"
              >
                <div>
                  <div className="mb-1 flex items-center gap-2 font-medium">
                    {opt.name}
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <code className="text-xs text-muted-foreground">{opt.command}</code>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs leading-relaxed text-muted-foreground/60">
          Keep API keys secure. Rotate regularly. Never commit secrets to version control.
        </p>
      </div>
    </PageLayout>
  );
};

export default Instructions;
