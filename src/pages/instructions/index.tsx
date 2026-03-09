import { Markdown } from "@/components";
import { PageLayout } from "@/layouts";

const guide = `# Instructions

This page helps you connect Echo to an AI provider.

## 1) OpenAI API key

1. Go to **platform.openai.com** and sign in.
2. Open **API Keys** and create a new key.
3. Copy the key once and store it safely.
4. In Echo, open **Config** and paste your key into the provider variable field.

## 2) Claude (Anthropic) API key

1. Go to **console.anthropic.com** and sign in.
2. Create an API key in the account settings area.
3. Copy the key and keep it private.
4. In Echo, choose your Claude provider config and paste the key variable.

## 3) Local model from Hugging Face

You can run many Hugging Face models locally via an OpenAI-compatible server.

### Option A: LM Studio

1. Install LM Studio.
2. Download a model from Hugging Face inside LM Studio.
3. Start the local server (OpenAI-compatible endpoint).
4. Use a custom provider in Echo with a local URL like \`http://localhost:1234/v1/chat/completions\`.

### Option B: Ollama

1. Install Ollama.
2. Pull a model, for example:\n   \`ollama pull llama3.1\`
3. Run the model with Ollama's local API.
4. Point Echo custom provider to your local Ollama/OpenAI-compatible endpoint.

## 4) Make it work in Echo

1. Open **Config**.
2. Pick an existing provider or create a custom provider.
3. Set required variables (API key, model name, endpoint).
4. Send a quick test prompt from Chats.

## Troubleshooting

- **401 / Unauthorized**: API key missing, expired, or wrong variable mapping.
- **404 / Model not found**: Wrong model name or endpoint path.
- **Connection refused**: Local server is not running or wrong port.
- **No response stream**: Disable streaming in provider config if your endpoint does not support it.

Keep your API keys private and never commit them to git.
`;

const Instructions = () => {
  return (
    <PageLayout
      title="Instructions"
      description="Setup guide for OpenAI, Claude, and local Hugging Face models."
    >
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <Markdown>{guide}</Markdown>
      </div>
    </PageLayout>
  );
};

export default Instructions;
