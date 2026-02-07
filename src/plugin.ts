import type { Plugin } from "@opencode-ai/plugin";
import { IFLOW_CONSTANTS } from "./constants.js";
import { startOAuthFlow } from "./iflow/oauth.js";

export const createIflowPlugin = (providerId: string = "iflow"): Plugin =>
  async (_ctx) => {
    return {
      auth: {
        provider: providerId,

        loader: async (getAuth, _provider) => {
          const auth = await getAuth() as any;
          // If not authenticated yet, return empty — don't provide broken credentials
          if (!auth || !auth.key) {
            return {};
          }

          const apiKey = auth.key;
          return {
            apiKey,
            baseURL: IFLOW_CONSTANTS.API_BASE_URL,
            fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
              const currentAuth = await getAuth() as any;
              const currentKey = currentAuth?.key || apiKey;
              const headers = new Headers(init?.headers);
              headers.set("Authorization", `Bearer ${currentKey}`);
              return fetch(input, { ...init, headers });
            },
          };
        },

        methods: [
          {
            type: "oauth" as const,
            label: "iFlow OAuth",
            authorize: async () => {
              // Start local server and get auth URL
              const { url, callback } = startOAuthFlow();
              return {
                url,
                instructions: "Complete sign-in in your browser with iFlow.",
                method: "auto" as const,
                callback,
              };
            },
          },
        ],
      },
    };
  };

export const IflowOAuthPlugin = createIflowPlugin();
export default IflowOAuthPlugin;
