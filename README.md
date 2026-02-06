# Opencode iFlow Auth Plugin

A plugin for [Opencode](https://github.com/opencode-ai/opencode) that provides authentication and model integration for the **iFlow** AI platform.

This plugin enables you to use iFlow's powerful models (GLM, DeepSeek, Qwen, Kimi, etc.) directly within your Opencode environment.

## Installation

You can install this plugin directly from GitHub:

```bash
npm install github:lutfi238/opencode-iflow-auth
```

## Configuration

To use this plugin, you need to configure your `opencode.json` (usually located in `~/.opencode/opencode.json` or your project root).

### 1. Add the Provider

Add `iflow` to your `providers` list and point it to the installed plugin.

```json
{
  "providers": {
    "iflow": {
      "plugin": "opencode-iflow-auth"
    }
  }
  // ...
}
```

### 2. Configure Models

Add the iFlow models you want to use to the `models` array. You can configure their context limits and capabilities below.

```json
{
  "models": {
    "iflow-glm-4.7": {
      "name": "GLM-4.7 (iFlow)",
      "provider": "iflow",
      "modelId": "glm-4.7",
      "limit": { "context": 200000, "output": 128000 },
      "modalities": { "input": ["text"], "output": ["text"] }
    },
    "iflow-deepseek-v3.2": {
      "name": "DeepSeek-V3.2 (iFlow)",
      "provider": "iflow",
      "modelId": "deepseek-v3.2",
      "limit": { "context": 128000, "output": 8192 },
      "modalities": { "input": ["text"], "output": ["text"] }
    },
    "iflow-qwen3-coder": {
      "name": "Qwen3-Coder-Plus (iFlow)",
      "provider": "iflow",
      "modelId": "qwen3-coder-plus",
      "limit": { "context": 256000, "output": 16384 },
      "modalities": { "input": ["text"], "output": ["text"] }
    },
    "iflow-kimi-k2-thinking": {
      "name": "Kimi-K2-Thinking (iFlow)",
      "provider": "iflow",
      "modelId": "kimi-k2-thinking",
      "limit": { "context": 256000, "output": 16384 },
      "modalities": { "input": ["text"], "output": ["text"] },
      "variants": {
        "thinking": { "thinkingLevel": "high" }
      }
    },
    "iflow-rome-preview": {
      "name": "iFlow-ROME-30BA3B (Preview)",
      "provider": "iflow",
      "modelId": "iflow-rome-30ba3b",
      "limit": { "context": 256000, "output": 16384 },
      "modalities": { "input": ["text"], "output": ["text"] }
    },
    "iflow-minimax-m2.1": {
      "name": "MiniMax-M2.1 (iFlow)",
      "provider": "iflow",
      "modelId": "minimax-m2.1",
      "limit": { "context": 200000, "output": 128000 },
      "modalities": { "input": ["text"], "output": ["text"] }
    },
    "iflow-kimi-k2.5": {
      "name": "Kimi-K2.5 (iFlow)",
      "provider": "iflow",
      "modelId": "kimi-k2.5",
      "limit": { "context": 256000, "output": 16384 },
      "modalities": { "input": ["text"], "output": ["text"] }
    },
    "iflow-kimi-k2-0905": {
      "name": "Kimi-K2-0905 (iFlow)",
      "provider": "iflow",
      "modelId": "kimi-k2-0905",
      "limit": { "context": 256000, "output": 16384 },
      "modalities": { "input": ["text"], "output": ["text"] }
    }
  }
}
```

## Usage

1.  Start Opencode.
2.  Select one of the iFlow models (e.g., `GLM-4.7 (iFlow)`).
3.  The first time you use it, the plugin will launch your browser to authenticate with **iflow.cn**.
4.  Log in with your phone number as requested by the iFlow platform.
5.  Once authenticated, you will be redirected back to localhost, and Opencode will store your session.

## Troubleshooting

- **Browser doesn't open?**
  Check your terminal output. The login URL is printed there; you can copy and paste it manually.
- **Port conflict?**
  The plugin attempts to find a random free port for the callback server. If you have firewalls blocking local connections, ensure you allow Node.js to listen on localhost.

## License

MIT
