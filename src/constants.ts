export const IFLOW_CONSTANTS = {
  CLIENT_ID: "10009311001",
  AUTH_ENDPOINT: "https://iflow.cn/oauth",
  TOKEN_ENDPOINT: "https://iflow.cn/oauth/token", // Verify this endpoint
  REDIRECT_URI: "http://localhost",
  API_BASE_URL: "https://api.iflow.cn/v1", // Verify if this is OpenAI-compatible
  USER_AGENT: "opencode-auth-iflow/0.0.1",
  SCOPES: ["openid", "profile"],

  // Available Models from iFlow
  MODELS: [
    { id: "glm-4.7", name: "GLM-4.7" },
    { id: "iflow-rome-30ba3b", name: "iFlow-ROME-30BA3B" },
    { id: "deepseek-v3.2", name: "DeepSeek-V3.2" },
    { id: "qwen3-coder-plus", name: "Qwen3-Coder-Plus" },
    { id: "kimi-k2-thinking", name: "Kimi-K2-Thinking" },
    { id: "minimax-m2.1", name: "MiniMax-M2.1" },
    { id: "kimi-k2-0905", name: "Kimi-K2-0905" },
  ],
};
